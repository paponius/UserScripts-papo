# papo userscripts


## Google I'm Feeling Lucky Redirect Workaround

Immediately redirects when google prompts 'redirection notice'. Used to circumvent google pestering you when querying with I'm Feeling Lucky feature.

a mod from: https://greasyfork.org/en/scripts/390770-workaround-for-google-i-m-feeling-lucky-redirect/code


## keep alive

> ! Does not work. Browsers do freeze JS on background Tabs.  
> Probably using a service worker would fix the issue.

Pings a server, to stay logged-in.

### Useful re-usable parts

injected element hovering over the page with a status display/control

### Install in GM
https://github.com/paponius/papo-userscripts/raw/master/GM/keepalive.user.js


## tandt.posta.sk.js
Changes plain text with link to real clickable 'A' element
modifies URI to represent the currently selected tracking

### Useful re-usable parts

MutationObserver

Handling an iframe. With JS injections in both top and iframe windows
and communication between them.


### Install in GM
https://github.com/paponius/papo-userscripts/raw/master/GM/tandt.posta.sk.user.js

The **tandt.posta.sk.js** does not work with GreaseMonkey, only with alternatives (e.g. TamperMonkey) because of this bug/limitation.
https://github.com/greasemonkey/greasemonkey/issues/2574
