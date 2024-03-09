// https://meta.discourse.org/t/developers-guide-to-markdown-extensions/66023#the-setup-protocol-3
// https://github.com/discourse/discourse/blob/f8964f8f8ff1e386c50f22c804691191f546e9f8/app/assets/javascripts/discourse-markdown-it/src/features/bbcode-inline.js#L152
export function setup(helper) {
  if (!helper.markdownIt)
    return;

  helper.registerOptions((opts, siteSettings) => {
    opts['kglwSetlist'] = !!siteSettings.kglwSetlist_enabled; // field name matches setting name in plugin.rb
  });

  helper.allowList([
    'span.kglwSetlist'
  ]);

  helper.registerPlugin(md => {
    // Adding a single _inline_ rule only.
    // examples: https://github.com/discourse/discourse/blob/f8964f8f8ff1/app/assets/javascripts/discourse-markdown-it/src/features/bbcode-inline.js#L303-L322
    md.inline.bbcode.ruler.push('setlist', {
      tag: 'setlist',
      wrap: 'span.kglwSetlist'
    });
  });
}
