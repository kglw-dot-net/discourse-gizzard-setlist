import { withPluginApi } from 'discourse/lib/plugin-api';
import ComposerController from 'discourse/controllers/composer';
import { addTagDecorateCallback } from 'discourse/lib/to-markdown';

const PLUGIN_NAME = 'kglw-setlist';
const HTML_CLASS_NAME = 'kglwSetlist';
// const HTML_CLASS_NAME_PROCESSED = 'kglwSetlistProcessed';

async function doTheSetlist(setlistElement) {
  console.log('do the setlist!', fetch);
  const date = setlistElement.innerHTML;
  const result = (await fetch(`https://kglw.net/api/v1/setlists/showdate/${date}.json`)).json()
  global.console.log({result});
  const showData = result.data.map(song => `${song.songname}${song.transition}`).join('')
  setlistElement.innerHTML = showData
}

function renderSetlist(cookedElement) {
  cookedElement.querySelectorAll(`.${HTML_CLASS_NAME}`).forEach((s) => {
    doTheSetlist(s);
    s.classList.remove(HTML_CLASS_NAME);
    s.classList.add('spoiled');
  });
}

export function initializeSetlistCode(api) {
  // add button to Editing Content menu (...?)
  api.addToolbarPopupMenuOptionsCallback(() => ({ action: 'insertSetlist', icon: 'list', label: 'setlist.title' }));
  ComposerController.reopen({
    actions: {
      insertSetlist() { // matches action prop passed to addToolbarPopupMenuOptionsCallback
        this.get('toolbarEvent').applySurround('[setlist]', '[/setlist]',
          'setlist_text',
          { multiline: false, useBlockMode: false }
        );
      },
    },
  });

  addTagDecorateCallback(function () {
    global.console.log('aTDC', this.element);
    if (this.element.attributes.class === 'spoiled') {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
    }
  });

  // decorate "cooked" content (after it's been rendered)
  // https://github.com/discourse/discourse/blob/1526d1f97d46/app/assets/javascripts/discourse/app/lib/plugin-api.js#L369
  api.decorateCookedElement(renderSetlist, { id: PLUGIN_NAME }); // what's this ID for?
}

export default {
  name: PLUGIN_NAME,
  initialize() {
    const siteSettings = container.lookup('site-settings:main');
    if (siteSettings.kglwSetlist_enabled)
      withPluginApi('1.3.0', initializeSetlistCode);
  },
};
