// This is a GreaseMonkey user script file.
// It contains only the Metadata Block.
// All JavaScript code is in separate files, to make development more portable and easier.
//
// JS files included using require Key are downloaded only once while version Key here is the same.
// Grease Monkey (and alternatives) will download and cache all included files, joined all in one.
// There is no speed or bandwidth use difference to a method where all JS code is written in this one file.
// And the same is with transparency. Included external files can be inspected in GM (or Tamper Monkey) editor in separate tabs.

// ==UserScript==
// @name         remove_personal_data
// @namespace      YYY
// @description  remove_personal_data
// @author         papo
// @version        0.9.0
// @license        GPLv2
// ###icon           https://www.google.com/s2/favicons?sz=64&domain=posta.sk

// @match          *://*/*
// YYY match          *://*.yyy.com/yyy/yyy*/*

// ###run-at     document-start
//
// all possible: document-start -> document-end (default) -> document-idle
// tampermonkey has more, but if used in GreaseMonkey, script will silently fail. e.g. document-body

//// GRANT - PERMISSIONS
// @grant        none
// ###grant        GM.getValue
// ###grant        GM.setValue
// ###grant        GM.xmlHttpRequest
// ###grant        GM.getResourceUrl
// ###grant        GM.deleteValue
// ###grant        GM.listValues
// ###grant        GM_getValue
// ###grant        GM_setValue
// ###grant        GM_xmlhttpRequest
//
// Add only required permissions. If any is added, "@grant none" must be removed.

//// FRAMEWORKS
// ###require      https://code.jquery.com/jquery-2.2.0.min.js
// ###require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js

//// PROJECT FILES
// #require      http://ponius.com/GM/XXX/XXX.js?v0.9
// @require      https://github.com/paponius/papo-userscripts/raw/master/src/remove_personal_data.js?v0.9

// ###resource     sites.json http://www.ponius.com/iel/sites.json
// ###resource     res/imdb-enhanced-links.css http://www.ponius.com/iel/res/imdb-enhanced-links.css
// ###resource     extension_pages/options.html http://www.ponius.com/iel/extension_pages/options.html
//
// Name of a resource could be anything. To keep compatibility with WebExt, use relative path as a name for the resource as it appears in the project. e.g. res/sites.json

// @connect      *
// Used by GM_xmlhttpRequest. Define more specific values, for user's peace of mind.

// ###noframes
// UserScript will not run in iFrames

// ==/UserScript==
