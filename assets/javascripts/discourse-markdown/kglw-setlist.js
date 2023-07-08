// https://meta.discourse.org/t/developers-guide-to-markdown-extensions/66023#the-setup-protocol-3
export function setup(helper) {
  if (!helper.markdownIt)
    return;

  // helper.registerOptions((opts,siteSettings)=>{ // TODO is this needed?
  //   opts.features.['kglwSetlist'] = !!siteSettings.kglwSetlist_enabled;
  // });

  helper.allowList(['span.kglwSetlist']);

  helper.registerPlugin(md => {
    md.inline.bbcode.ruler.push('setlist', {
      tag: 'setlist',
      wrap: 'span.kglwSetlist'
    });
  //   md.inline.push('setlist', (state, silent) => {
  //     
  //   });
  });
}
