// TODO...
// * handle encores
// * newlines?? or html?
// * double-check multiple shows on one day... using #1 and #2 and no #...

import tippy from 'tippy.js';

import { withPluginApi } from 'discourse/lib/plugin-api';
import ComposerController from 'discourse/controllers/composer';
import { addBlockDecorateCallback, addTagDecorateCallback } from 'discourse/lib/to-markdown';

const PLUGIN_NAME = 'setlist'; // TBD Does this have to match the filename?
const HTML_CLASS_NAME = 'kglwSetlist';
const HTML_CLASS_NAME_ERROR = `${HTML_CLASS_NAME}-error`;
const HTML_CLASS_NAME_INVALID = `${HTML_CLASS_NAME}-invalid`;
const HTML_CLASS_NAME_PROCESSED = `${HTML_CLASS_NAME}-processed`;
const HTML_CLASS_NAME_PROCESSING = `${HTML_CLASS_NAME}-processing`;
const REGEX_DATE_FORMAT = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})(?!#(?<which>\d))?$/;
const API_BASE = 'https://kglw.net/api/v1';

function log(...msgs) {
  console.log('%cKGLW', 'color:chartreuse;background:black;padding:0.5rem;border-radius:1rem', ...msgs)
}

function hasTouchCapabilities() {
  // https://github.com/discourse/discourse/blob/8e63244e72f/app/assets/javascripts/discourse/app/lib/d-tooltip.js#L7C1-L9C2
  return navigator.maxTouchPoints > 1 || 'ontouchstart' in window;
}

async function doTheSetlist(setlistElement) {
  log('doTheSetlist!!', fetch, setlistElement);
  if (!fetch)
    return console.error('no fetch...');
  setlistElement.classList.add(HTML_CLASS_NAME_PROCESSING);
  const matches = setlistElement.innerHTML.match(REGEX_DATE_FORMAT);
  if (matches.length < 4 || matches.length > 5)
    return console.error('no regex matches', setlistElement.innerHTML, REGEX_DATE_FORMAT);
  try {
    const {year, month, day, which = 1} = matches.groups
    const date = `${year}-${month}-${day}`
    const showData = (await (await fetch(`${API_BASE}/shows/showdate/${date}.json`)).json()).data[which-1]; // `-1` bc arrays are 0-indexed...
    const setlistData = (await (await fetch(`${API_BASE}/setlists/showdate/${date}.json`)).json()).data;
    log('doTheSetlist', {showData, setlistData});
    const setlistObject = setlistData.reduce((a,e,idx)=>{
      if (!a[e.setnumber]) a[e.setnumber] = [];
      a[e.setnumber][e.position] = e.songname + e.transition;
      return a;
    }, {})
    const setlist = Object.entries(setlistObject).reduce((a,(k,e),index)=>{
      log('reducing...', a, k, e);
      const whichSet = k;
      if (e) return a + `<br/>${k === 'e' ? 'Encore' : `Set ${index}`}: ` + e.join('');
      return a;
    }, '')
    tippy(setlistElement, {
      content: `${showData.showdate} @ ${showData.venuename} (${showData.city}, ${showData.state || showData.country})<br/>${setlist}`,
      placement: 'top-start',
      duration: 0,
      theme: 'translucent',
      interactive: true,
      trigger: hasTouchCapabilities() ? 'click' : 'mouseenter',
    });
    setlistElement.classList.add(HTML_CLASS_NAME_PROCESSED);
  } catch (error) {
    setlistElement.classList.add(HTML_CLASS_NAME_ERROR);
    return console.error(error);
  } finally {
    setlistElement.classList.remove(HTML_CLASS_NAME_PROCESSING);
  }
}

export function initializeSetlistCode(api) {
  // add button to Editing Content menu (...?)
  api.addToolbarPopupMenuOptionsCallback(() => ({ action: 'insertSetlist', icon: 'list', label: 'setlist.title' }));
  ComposerController.reopen({
    actions: {
      insertSetlist() { // matches action prop passed to addToolbarPopupMenuOptionsCallback
        this.get('toolbarEvent').applySurround(
          '[setlist]',
          '[/setlist]',
          'setlist_text', // locale string js.composer.setlist_text
          { multiline: false, useBlockMode: false }
        );
      },
    },
  });

  // convert nodes back to bbcode
  addTagDecorateCallback(function (text) {
    log('addTagDecorateCallback', text, this.element);
    if ([...this.element.classList].includes(HTML_CLASS_NAME)) {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
    }
  });

  addBlockDecorateCallback(function (text) {
    log('addBlockDecorateCallback', text, this.element);
    if (this.element.name === 'div' && [...this.element.classList].includes(HTML_CLASS_NAME)) {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
      return text.trim();
    }
  });

  // decorate "cooked" content (after it's been rendered)
  // https://github.com/discourse/discourse/blob/1526d1f97d46/app/assets/javascripts/discourse/app/lib/plugin-api.js#L369
  api.decorateCookedElement(function(cookedElement) {
    cookedElement.querySelectorAll(`.${HTML_CLASS_NAME}`).forEach((setlistElem) => {
      log('decorateCookedElement...', setlistElem);
      setlistElem.classList.add(HTML_CLASS_NAME);
      if (REGEX_DATE_FORMAT.test(setlistElem.innerText)) {
        const removeListeners = (elem) => {
          elem.removeEventListener('click', clickHandler);
          elem.removeEventListener('keydown', keydownHandler);
        };
        const clickHandler = () => {
          removeListeners(setlistElem);
          doTheSetlist(setlistElem);
        };
        const keydownHandler = ({key}) => {
          if (key === 'Enter') {
            removeListeners(setlistElem);
            doTheSetlist(setlistElem);
          }
        };
        setlistElem.addEventListener('click', clickHandler);
        setlistElem.addEventListener('keydown', keydownHandler);
      } else {
        setlistElem.classList.add(HTML_CLASS_NAME_INVALID)
      }
    });
  }, {
    afterAdopt: true, // decorate html content after it is adopted by the main `document` (not in a detached DOM)
    id: HTML_CLASS_NAME,
  });
}

export default {
  name: PLUGIN_NAME,
  initialize(container) {
    const {kglwSetlist_enabled} = container.lookup('site-settings:main');
    if (kglwSetlist_enabled)
      withPluginApi('1.3.0', initializeSetlistCode);
  },
};
