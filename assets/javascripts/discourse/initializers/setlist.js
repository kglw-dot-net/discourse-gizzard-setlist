import loadScript from 'discourse/lib/load-script';
import { withPluginApi } from 'discourse/lib/plugin-api';
import ComposerController from 'discourse/controllers/composer';
import { addBlockDecorateCallback, addTagDecorateCallback } from 'discourse/lib/to-markdown';

const PLUGIN_NAME = 'setlist'; // TBD Does this have to match the filename?
const HTML_CLASS_NAME = 'kglwSetlist';
const HTML_CLASS_NAME_DECORATED = `${HTML_CLASS_NAME}-decorated`;
const HTML_CLASS_NAME_DECORATING = `${HTML_CLASS_NAME}-decorating`;
const HTML_CLASS_NAME_ERROR = `${HTML_CLASS_NAME}-error`;
const HTML_CLASS_NAME_INVALID = `${HTML_CLASS_NAME}-invalid`;
const HTML_CLASS_NAME_PROCESSED = `${HTML_CLASS_NAME}-processed`;
const HTML_CLASS_NAME_PROCESSING = `${HTML_CLASS_NAME}-processing`;
const REGEX_DATE_FORMAT = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})(?:#(?<which>\d))?$/;
const API_BASE = 'https://kglw.net/api/v2';

/*
 * The backend stores post data as html: 'check out <span class="kglwSetlist">2023/10/07</span> it was fun'
 * The Editor interface has had a new BBCode button added to support converting `<span class="kglwSetlist">...</span>` => `[setlist]...[/setlist]` in editor, and vice versa (other JS file)
 * This file configures some markdown treatments, including converting `<span class="kglwSetlist">...</span>` => `[setlist]...[/setlist]`; and controls how `<span class="kglwSetlist">2023/10/07</span>` is rendered in a browser to viewers — e.g. requesting data and building an interactive component using Tippy
 */

const trigger = (navigator.maxTouchPoints > 1 || 'ontouchstart' in window) // https://github.com/discourse/discourse/blob/8e63244e72f/app/assets/javascripts/discourse/app/lib/d-tooltip.js#L7C1-L9C2
  ? 'click'
  : 'hover';

async function buildInteractiveSetlistComponent(setlistElement) {
  if (!fetch)
    return console.error('no fetch...');
  setlistElement.classList.add(HTML_CLASS_NAME_PROCESSING);
  const matches = setlistElement.innerHTML.match(REGEX_DATE_FORMAT);
  if (matches.length !== 5)
    return console.error('regex match does not look right', setlistElement.innerHTML, REGEX_DATE_FORMAT);
  try {
    const {year, month, day, which = 1} = matches.groups // note, these are all strings...
    const whichNum = Number(which)
    const date = `${year}-${month}-${day}`
    const [p1, p2] = await Promise.all([
      fetch(`${API_BASE}/shows/showdate/${date}.json`),
      fetch(`${API_BASE}/setlists/showdate/${date}.json`)
    ]);
    const [d1, d2] = await Promise.all([
      p1.json(),
      p2.json()
    ])
    const {showdate, venuename, city, state, country, permalink} = d1.data[whichNum - 1]; // `-1` bc arrays are 0-indexed but "whichNum" is not
    const setlistData = d2.data;
    const setlistObject = setlistData.reduce((obj,{showorder, setnumber, position, songname, transition},idx)=>{
      if (showorder !== whichNum)
        return obj;
      if (!obj[setnumber])
        obj[setnumber] = [];
      obj[setnumber][position] = songname + transition;
      return obj;
    }, {})
    const setlist = Object.entries(setlistObject).reduce((setlistStr,[whichSet,tracksArr])=>{
      if (tracksArr) return setlistStr + `<br/><b>${whichSet === 'e' ? 'Encore' : `Set ${whichSet}`}:</b> ` + tracksArr.join('');
      return setlistStr;
    }, '')
    if (window.Popper && window.tippy) {
      window.tippy(setlistElement, {
        content: `<a href="https://kglw.net/setlists/${permalink}" target="_blank" rel="noopener">${showdate} @ ${venuename} (${city}, ${state || country})</a>${setlist}`,
        placement: 'top-start',
        duration: 0,
        theme: 'translucent',
        interactive: true,
        allowHTML: true,
        onTrigger(_instance, _event) {
          if (!window.Popper)
            console.debug('[kglwSetlist] onTrigger: no Popper...');
        },
        onShow(_instance) {
          if (!window.Popper) {
            console.debug('[kglwSetlist] onShow: no Popper...');
            return false;
          }
        },
      }).show();
    } else {
      console.debug('[kglwSetlist] tippy/Popper not found?', {
        tippy: window.tippy,
        Popper: window.Popper,
        setlistElement,
        setlistData
      });
    }
    setlistElement.classList.add(HTML_CLASS_NAME_PROCESSED);
  } catch (error) {
    setlistElement.classList.add(HTML_CLASS_NAME_ERROR);
    return console.error(error);
  } finally {
    setlistElement.classList.remove(HTML_CLASS_NAME_PROCESSING);
  }
}

export function initializeSetlistCode(api) {
  // add button to toolbar above the editing toolbar (editor button bar)
  ComposerController.reopen({
    actions: {
      insertSetlist() {
        this.get('toolbarEvent').applySurround(
          '[setlist]',
          '[/setlist]',
          'setlist_text', // locale string js.composer.setlist_text
          { multiline: false, useBlockMode: false }
        );
      },
    },
  });

  // convert (inline) nodes back to bbcode
  addTagDecorateCallback(function (text) {
    if ([...this.element.classList].includes(HTML_CLASS_NAME)) {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
    }
  });

  // convert (block) nodes back to bbcode
  addBlockDecorateCallback(function (text) {
    if (this.element.name === 'div' && [...this.element.classList].includes(HTML_CLASS_NAME)) {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
      return text.trim();
    }
  });

  // client-side behavior, after HTML has been rendered
  // https://github.com/discourse/discourse/blob/1526d1f97d46/app/assets/javascripts/discourse/app/lib/plugin-api.js#L369
  api.decorateCookedElement(function(cookedElement) {
    cookedElement.querySelectorAll(`.${HTML_CLASS_NAME}`).forEach((setlistElem) => {
      setlistElem.classList.add(HTML_CLASS_NAME_DECORATING);
      if (REGEX_DATE_FORMAT.test(setlistElem.innerText)) {
        const removeListeners = (elem) => {
          elem.removeEventListener(trigger, pointerHandler);
          elem.removeEventListener('keydown', keyboardHandler);
        };
        const pointerHandler = () => {
          removeListeners(setlistElem);
          buildInteractiveSetlistComponent(setlistElem);
        };
        const keyboardHandler = ({key}) => {
          if (key === 'Enter') {
            removeListeners(setlistElem);
            buildInteractiveSetlistComponent(setlistElem);
          }
        };
        setlistElem.addEventListener(trigger, mouseHandler);
        setlistElem.addEventListener('keydown', keyboardHandler);
      } else {
        setlistElem.classList.add(HTML_CLASS_NAME_INVALID)
      }
      setlistElem.classList.remove(HTML_CLASS_NAME_DECORATING);
      setlistElem.classList.add(HTML_CLASS_NAME_DECORATED);
    });
  }, {
    afterAdopt: true, // decorate html content after it is adopted by the main `document` (not in a detached DOM)
    id: HTML_CLASS_NAME,
  });

  // load scripts
  // TODO only load if there's a setlist on the page...
  const [s1, s2] = await Promise.all([
    loadScript('https://unpkg.com/popper.js@1.16.1/dist/umd/popper.min.js'), // dependency of Tippy.js
    loadScript('https://unpkg.com/tippy.js@5.2.1/dist/tippy-bundle.iife.min.js'), // note using v5, not latest v6
  ]);
  global.console.debug('scripts...', {s1, s2});
}

export default {
  name: PLUGIN_NAME,
  initialize(container) {
    const {kglwSetlist_enabled} = container.lookup('site-settings:main');
    if (kglwSetlist_enabled)
      withPluginApi('1.3.0', initializeSetlistCode);
  },
};
