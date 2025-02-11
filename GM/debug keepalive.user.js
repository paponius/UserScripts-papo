// Metadata Block allowing debug of Greasemonkey compatible scripts.
// There is no JS code here directly, local JS files are included using @require Key.
// Last 'require' will chain the production version GM user script file.
// In the chained file, Metadata Block is ignored by GM.
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
// Replace XXX for quick start. (NAME must have word "DEBUG" somewhere, its presence is detected by the script)
// Replace ### as needed.
// keys starting with ZZZ are useless in this DEBUG version. They are included for description purpose.
// This file itself can be renamed, but doesn't need to be.
//
// template v1.0

// ==UserScript==
// @name           DEBUG - keepalive (any page)
// ZZZ namespace   to avoid conflicts with duplicate names by different authors
// ZZZ description Describe this script
// @author         papo
// ZZZ version     1.0.0  Useless here. Tamper Monkey ignores version change here (because file:?) and does not auto update
// ZZZ license     own
// ###icon           https://www.google.com/s2/favicons?sz=64&domain=example.com

//// Match Sites
// @match          *://*/*
// @match          *://*/db/index.php*
//
// Scheme: "*" matches http and https but not file, ftp, urn. Not valid: "http?", "http*" is in TM doc as valid, but in Google not.
// Host: "www.google.com", "*.google.com" matches also "google.com", or "*". Not valid: "*.google.*"
//       "*" can be followed only by a "." or "/", and if used, it must be the first character.
// Path: "/*", "/foo*", "/foo/bar", "/foo*/*", "/foo*bar". Path must be present. Not sure if "/" is OK.
// There is no Host in "file:///foo*", URN "urn:*"

// ###run-at     document-start
//
// all possible: document-start -> document-end (default) -> document-idle
// tampermonkey has more, but if used in GreaseMonkey, script will silently fail. e.g. document-body


//// GRANT - PERMISSIONS
//   Granting everything in this development version.
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
// @grant          GM_registerMenuCommand
//
// GreaseMonkey v4 changed all GM_ objects to one GM object (followed by dot and a property)
// which returns a Promise
// Grant directive must correspond to that, but can also specify both old and new.
// TamperMonkey (v4.13) does not mention GM. or GM object in docs, but it does in "recent changes",
// probably there is support of these new promise oriented functions too.
//
// grant none
// This will also disable sandbox and GM_ functions, except GM_info property. Probably also unsafeWindow, some window functions.


//// REQUIRE directives. Must be identical to no-debug .user.js file. Use local debuggable or remote files.

//// FRAMEWORKS
// ###require        https://code.jquery.com/jquery-2.2.0.min.js
// ###require        http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ###require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js

//// PROJECT FILES
// Add local files which you want to debug.
// @require        file://C:\Users\Papo\Documents\GitHub\UserScripts-papo\lib\ControlPanel.js
// @require        file://C:\Users\Papo\Documents\GitHub\UserScripts-papo\src\keepalive.js

//// PROJECT.user.js FILE. Chain the production version GM UserScript
//   As the last @require.
//   This is not needed if it does not contain any code. the GM header will not be recognized and processed
//
// @require        file://C:\Users\Papo\Documents\GitHub\UserScripts-papo\GM\keepalive.user.js

//// RESOURCES
// ###resource       extension_pages/options.html file://C:\path\to\file
//
// Name of a resource could be anything. To keep compatibility with WebExt, use relative path as a name for the resource as it appears in the project. e.g. res/sites.json
// ViolentMonkey probably does not like '\' in the path.

// @connect      *
// Used by GM_xmlhttpRequest. Define more specific values, for user's peace of mind.

// ###noframes
// UserScript will not run in iFrames

// ==/UserScript==

// "debugger" command is added here by TamperMonkey > Settings > Debug scripts
console.log('XXX.js: DEBUG SCRIPT meta file');
