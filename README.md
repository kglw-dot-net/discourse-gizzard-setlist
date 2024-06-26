This is a [Discourse] plugin which turns a BBcode-style `[setlist]` tag into a [King Gizzard](https://kinggizzardandthelizardwizard.com/) setlist.

It uses the [KGLW.net] public [API](https://kglw.net/api/docs.php) to fetch data.


## Usage

Entering `[setlist]yyyy-mm-dd[/setlist]` (with numbers representing the date) into a post will turn into a click-to-load button, which then turns into a tooltip showing the specified show's setlist (including a link to the full page for the show).

This plugin also adds a button to the Post Editor (in the "more"/gear icon menu), with the text "Gizz Setlist". Clicking it will insert a `[setlist]` example tag with the placeholder text "YYYY-MM-DD". (Initially it will appear red in the preview window, because the placeholder letters are invalid as a date; once you've entered a valid (numerical) date, it will appear with a green border.)

If there are more than one concert on the given day, the first one will be shown by default. To control which one is shown, put a hash/number sign `#` and then a number (for which show of the day) immediately after the date, e.g.: `[setlist]2023/06/08#2[/setlist]`


## Dev setup

Follow [these instructions to set up Discourse locally](https://nspeaks.com/setup-discourse-for-local-development/).  
_tldr: install Docker; clone [`discourse.git`](https://github.com/discourse/discourse.git) and bootstrap with its `d/boot_dev --init`; launch with with its `d/unicorn`_

This plugin can be installed locally via symlinking the repo root into the `discourse/plugins` directory, e.g.: `cd /path/to/discourse && ln -s /path/to/gizzard-setlist plugins`


## Links

* [thread on KGLW.net Forum](https://forum.kglw.net/t/kglw-forum-feature-setlist-popup-code/888)
* https://meta.discourse.org/t/developers-guide-to-markdown-extensions/66023
* https://meta.discourse.org/t/beginners-guide-to-creating-discourse-plugins-part-1/30515
* https://www.broculos.net/2015/09/getting-started-with-discourse.html


[Discourse]: https://discourse.org
[KGLW.net]: https://kglw.net
