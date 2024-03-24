This is a [Discourse] plugin which turns a BBcode-style `[setlist]` tag into a [King Gizzard](https://kinggizzardandthelizardwizard.com/) setlist.

It uses the [KGLW.net] public [API](https://kglw.net/api/docs.php) to fetch data.


## Usage

Entering `[setlist]` (date) `[/setlist]` tag into a post will turn into a click-to-load button which turns into a tooltip showing the specified show's setlist, with a link to the full page for the show.

A button will be added to the post editor (in the "more"/gear icon menu), with the text "Gizz Setlist". Clicking it will insert a `[setlist]` example tag with the placeholder text "YYYY-MM-DD". (In the preview window, it will initially be red because the letters are an invalid date; once you've entered a valid (numerical) date, it will appear with a green border.)

If there are more than one concert on the given day, the first one will be shown by default; control which one is shown by appending e.g. `#2` to the date: `[setlist]2023/06/08#2[/setlist]`


## Links

* https://meta.discourse.org/t/developers-guide-to-markdown-extensions/66023
* https://meta.discourse.org/t/beginners-guide-to-creating-discourse-plugins-part-1/30515
* https://www.broculos.net/2015/09/getting-started-with-discourse.html


[Discourse]: https://discourse.org
[KGLW.net]: https://kglw.net
