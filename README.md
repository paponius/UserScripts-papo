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

	
## keep alive

Pings a server, to stay logged-in.

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
