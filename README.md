# UserScripts [papo]


## Google I'm Feeling Lucky Redirect Workaround

Immediately redirects when google prompts 'redirection notice'. Used to circumvent google pestering you when querying with I'm Feeling Lucky feature.

a mod from: https://greasyfork.org/en/scripts/390770-workaround-for-google-i-m-feeling-lucky-redirect/code


## obfuscator

Removes personal information from a web page before it is saved or printed.  
Data is removed from visible parts, but also from element's attributes and comments.  
Works nicely with SingleFile, where personal data is hidden only during the save process and restored after save.  

Not fully completed:
- restore is not yet fully implemented  
- input dialog is not provided
- manual action button not present

In SingleFile, Option must by manually enabled: https://github.com/gildas-lormeau/SingleFile/wiki/How-to-execute-a-user-script-before-a-page-is-saved

### Install in GM
https://github.com/paponius/UserScripts-papo/raw/master/GM/obfuscator.user.js


## GitHub enhancer

Adds **Size** to file lists.  
There are Extensions for this, I just thought it would be simple and wanted to have something small for this. Turns out it wasn't. To compare with other available solutions:  
[+] faster. size shows immediately. No delay browsing GitHub. The same dir-change time as without this.
[+] animation as other cells on line. Size info is actually usually waiting to show, as it is nicer if it shows together with date and commit msg info.
[+] without page fragmentation during load
[+] smaller
[+] no setInterval/setTimeout
[+] open source with explanations
[-] no support of private git (yet)
[-] no dir sizes (yet)
[-] no total repo size


## keep alive

Pings a server, to stay logged-in.

> ! Note: There is a horrible side-effect with method 2, this would (sometimes?) refresh page and remove unfinished text from forms. Also moves page up to top.

> ! 2023 It did not work. Browsers did freeze JS on background Tabs.  
  2025 It just works OK now. Browser updates maybe.  
> Still, maybe it will be a good idea to implement service worker with a timeout guard.

The *URI* accepts both String or Regexp patterns.  
Multiple patterns (for multiple URI) are separated by a comma.  
Escape comma with '\'. (not yet implemented)  
Also possible to escape leading '/' by '\', so it won't be recognized as a regexp,
but there are very few cases where it would matter.  
The pattern would have to be accepted as a valid regexp completely,
meaning it would have to end with '/', or a 'g' or 'c'... preceded by a '/'. (as valid regexp can)
Non leading '/' must not be escaped.

### Useful re-usable parts

Test String against String or Regexp pattern, while deducting if inputed pattern was meant as a String or Regexp pattern partially by itself.

### Install in GM
https://github.com/paponius/UserScripts-papo/raw/master/GM/keepalive.user.js


## Show page dates
Shows the date of a page modification.
Now the data is read from request header only, maybe will find some other common places.
Today, many pages are dynamically generated and the value just shows current time, or is missing all together.


### Install in GM
https://github.com/paponius/UserScripts-papo/raw/master/GM/page_date.user.js


## Omnibox URI update
After some action on a page, the page shows a specific content accessible using a direct URI. But the page does not update its OmniBox (Browser Address Bar) to this direct URI.
This would fix that. Now such page can be shared, or bookmarked.
This script is VERY manual.
Interesting in this solution is, the data is obtained from an iFrame, where it is shown using JS after an action.
Because of that it needs an MutationObserver and EventListener.

### Useful re-usable parts

MutationObserver

Handling an iframe. With JS injections in both top and iframe windows
and communication between them.


### Install in GM
https://github.com/paponius/UserScripts-papo/raw/master/GM/omnibox_uri_update.user.js

The **omnibox_uri_update.js** does not work with GreaseMonkey, only with alternatives (e.g. TamperMonkey) because of this bug/limitation.
https://github.com/greasemonkey/greasemonkey/issues/2574



## enable_spellcheck_where_disabled

### Install in GM
https://github.com/paponius/UserScripts-papo/raw/master/GM/enable_spellcheck_where_disabled.user.js?v0.9
