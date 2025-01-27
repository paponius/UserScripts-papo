# papo userscripts


## Google I'm Feeling Lucky Redirect Workaround

Immediately redirects when google prompts 'redirection notice'. Used to circumvent google pestering you when querying with I'm Feeling Lucky feature.

a mod from: https://greasyfork.org/en/scripts/390770-workaround-for-google-i-m-feeling-lucky-redirect/code


## keep alive

Pings a server, to stay logged-in.

> ! 2023 It did not work. Browsers did freeze JS on background Tabs.  
  2025 It just works OK now. Browser updates maybe.  
> Still, maybe it will be a good idea to implement service worker with a timeout guard.



### Useful re-usable parts

injected element hovering over the page with a status display/control

### Install in GM
https://github.com/paponius/papo-userscripts/raw/master/GM/keepalive.user.js


## omnibox_uri_update
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
https://github.com/paponius/papo-userscripts/raw/master/GM/omnibox_uri_update.user.js

The **omnibox_uri_update.js** does not work with GreaseMonkey, only with alternatives (e.g. TamperMonkey) because of this bug/limitation.
https://github.com/greasemonkey/greasemonkey/issues/2574
