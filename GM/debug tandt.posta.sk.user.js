// Metadata Block allowing debug of Greasemonkey compatible scripts.
// There is no JS code here directly, local JS files are included using @require Key.
// Last 'require' will chain the production version GM user script file.
// In the chained file, Metadata Block is ignored by GM.
// ? what about duplicate require? why is not local JS overloaded by server version?
//
// This development version file loads local files (file://...), they can be edited without need to copy/paste to GM.
// There is no need to update ...?v=1.1 for these file://... pseudo links. "file:" files seems to not be cached in TamperMonkey.
//
//// Install in the browser
// To make it work, you need to allow local access for Tamper Monkey extension.
// Add this script file to browser's GM. Open: file:///C:/Users/Papo/Documents/GitHub/, click *.user.js file.
// Greasemonkey: Seems it can't access "file:" protocol files. There are guides how it is possible, but not since 2017, when extension changed to WebExtension.
//
//// Edit this script file
// Replace all XXXXXX with correct values. (must keep word "DEBUG" somewhere in name, it's presence is detected by a script)
// Optionally replace YYYYYY with values. Enable Keys by replacing YYY with @
// This file itself can be renamed, but doesn't need to be.

// 23-04 compared to version in GM---IMDb-Large-Images from 21-10. This is file is more actual.

// ==UserScript==
// @name           DEBUG - tandt.posta.sk
// YYY namespace      YYYYYY
// YYY description    YYYYYY
// @author         papo
// YYY version        YYYYYY.YYYYYY.YYYYYY  Useless here. Tamper Monkey ignores version change here (because file:?) and does not auto update
// YYY license        YYYYYY

// --- Match Sites
//   match can not be: http?://,  http*://, *://*.google.*/* (OK: *://*.google.com/*)
//   doc: https://developer.chrome.com/docs/extensions/mv3/match_patterns/
// @match          *://tandt.posta.sk/*
// @match          *://www.posta.sk/*
// YYYicon         https://www.google.com/s2/favicons?sz=64&domain=example.com

// --- run-at
//   all possible: document-start -> document-end (default) -> document-idle
//   tampermonkey has more, but if used in GreaseMonkey, script will silently fail. e.g. document-body
// @run-at         document-idle

//// Granting everything in this development version.
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.xmlHttpRequest
// @grant          GM.getResourceUrl
// @grant          GM.deleteValue
// @grant          GM.listValues
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @grant          GM_setClipboard
// @grant          GM.openInTab
// @grant          unsafeWindow
//// In TamperMonkey docs (maybe not supported by GreaseMonkey)
// @grant          window.close
// @grant          window.focus
// @grant          window.onurlchange
//
// GreaseMonkey v4 changed all GM_ objects to one GM object (followed by dot and a property)
// which returns a Promise
// Grant directive must correspond to that, but can also specify both old and new.
// TamperMonkey (v4.13) does not mention GM. or GM object in docs, but it does in "recent changes",
// probably there is support of these new promise oriented functions too.


//// Frameworks
// YYYrequire        https://code.jquery.com/jquery-2.2.0.min.js
// YYYrequire        http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// YYYrequire        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js

//// Project files
// Add local files which you want to debug.
// @require        file://C:\Users\Papo\Documents\GitHub\papo-userscripts\src\tandt.posta.sk.js

//// Chain the production version GM user script
//   this is useless if it does not contain any code. the GM header will not be recognized
// @require        file://C:\Users\Papo\Documents\GitHub\papo-userscripts\GM\tandt.posta.sk.user.js

//// Resources. Name could be anything. To keep compatibility with WebExt, use relative path as a name for the resource as it appears in the project. e.g. res/sites.json
// YYYresource       extension_pages/options.html file://C:\path\to\file

// YYYconnect        *
// YYYnoframes
// ==/UserScript==

