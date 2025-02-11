// This is a GreaseMonkey User Script file.
// It contains only the Metadata Block.
// All JavaScript code is in separate files, to make development more portable and easier.
//
// There is no safety or performance difference.
// External JS files (included using require Key here) are cached. They are downloaded only once per version change.
// Included external JS files can be inspected in GM (or Tamper Monkey). If the external file is changed it will not be updated
//  unless a version of this main script changes.
// With manual update you can always inspect all files and they'll stay the same until next update.
// With automatic updates, someone can insert nefarious code in main JS script the same same way as in external JS files.


// ==UserScript==
// @name           obfuscator
// @namespace      https://github.com/paponius/
// @description    obfuscator
// @author         papo
// @version        1.0.0
// @license        GPLv2
// @icon           https://www.shareicon.net/download/2015/09/17/102669_anonymous.ico
// Icon "anonymous icon", Author: Aha-Soft, DL from: https://www.shareicon.net/anonymous-102669, CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/deed.en)

// @match          *://*/*
// YYY match          *://*.yyy.com/yyy/yyy*/*

// ###run-at     document-start
//
// all possible: document-start -> document-end (default) -> document-idle
// tampermonkey has more, but if used in GreaseMonkey, script will silently fail. e.g. document-body

//// GRANT - PERMISSIONS
// @grant          GM_registerMenuCommand

//// PROJECT FILES
// @require        https://github.com/paponius/UserScripts-papo/raw/master/lib/ControlPanel.js
// @require        https://github.com/paponius/UserScripts-papo/raw/master/src/obfuscator.js?v0.9.1

// ==/UserScript==
