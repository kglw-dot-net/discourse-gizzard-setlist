import { withPluginApi } from 'discourse/lib/plugin-api';
import ComposerController from 'discourse/controllers/composer';
import { addTagDecorateCallback } from 'discourse/lib/to-markdown';

function renderSetlist(...args) {
  console.log('we did it', ...args);
}

export function initializeSetlistCode(api) {
  // add button to Editing Content menu (...?)
  api.addToolbarPopupMenuOptionsCallback(() => ({ action: 'insertSetlist', icon: 'list', label: 'setlist.title' }));
  ComposerController.reopen({
    actions: {
      insertSetlist() {
        this.get('toolbarEvent').applySurround(
          '[setlist]',
          '[/setlist]',
          'setlist_text',
          { multiline: false, useBlockMode: false }
        );
      },
    },
  });

  addTagDecorateCallback(function () {
    if (this.element.attributes.class === 'setlist') {
      this.prefix = '[setlist]';
      this.suffix = '[/setlist]';
    }
  });

  // decorate "cooked" content (after it's been rendered)
  // https://github.com/discourse/discourse/blob/1526d1f97d46/app/assets/javascripts/discourse/app/lib/plugin-api.js#L369
  api.decorateCookedElement(renderSetlist, { id: 'kglw-setlist' });
}

export default {
  name: 'setlist',
  initialize() {
    console.log('lets goooooooo', fetch);
    withPluginApi('1.3.0', initializeSetlistCode);
  },
};
