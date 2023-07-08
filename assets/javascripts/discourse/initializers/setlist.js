import { withPluginApi } from 'discourse/lib/plugin-api';
import ComposerController from 'discourse/controllers/composer';
import { addBlockDecorateCallback, addTagDecorateCallback } from 'discourse/lib/to-markdown';

const PLUGIN_NAME = 'setlist'; // TBD Does this have to match the filename?
const HTML_CLASS_NAME = 'kglwSetlist';
const HTML_CLASS_NAME_PROCESSED = 'kglwSetlistServed';
const REGEX_DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})(?!#(\d))?$/ // TODO check date format... ...set class `kglwSetlist-invalid` if no good

function log(...msgs) {
  console.log('%cKGLW', 'color:chartreuse;background:black;padding:0.2rem;border-radius:1rem', ...msgs)
}

async function doTheSetlist(setlistElement) {
  log('do the setlist!', fetch, setlistElement);
  if (!fetch)
    return console.error('no fetch...');
  setlistElement.classList.remove(HTML_CLASS_NAME);
  const date = setlistElement.innerHTML;
  const showData = (await (await fetch(`https://kglw.net/api/v1/shows/showdate/${date}.json`)).json()).data
  const setlistData = (await (await fetch(`https://kglw.net/api/v1/setlists/showdate/${date}.json`)).json()).data
  log('doTheSetlist', {showData, setlistData});
  const setlist = setlistData.map(song => `${song.songname}${song.transition}`).join('')
  setlistElement.attributes.title = `${showData.showdate} @ ${showData.venuename}\n\n${setlist}`
  setlistElement.classList.add(HTML_CLASS_NAME_PROCESSED);
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
        log('insertSetlist...', this, ...arguments); // this is okay... but it doesn't get cooked??
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
    const { name, attributes } = this.element;
    if (name === 'div' && attributes.class === HTML_CLASS_NAME_PROCESSED) {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
      return text.trim();
    }
  });

  // decorate "cooked" content (after it's been rendered)
  // https://github.com/discourse/discourse/blob/1526d1f97d46/app/assets/javascripts/discourse/app/lib/plugin-api.js#L369
  api.decorateCookedElement(function(cookedElement) {
    log('decorateCookedElement...', cookedElement);
    cookedElement.querySelectorAll(`.${HTML_CLASS_NAME}`).forEach((elem) => {
      log('decorateCookedElement...', elem);
      elem.addEventListener('click', () => {
        doTheSetlist(elem);
      });
      elem.addEventListener('keydown', ({key}) => {
        if (key === 'Enter')
          doTheSetlist(elem);
      });
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
