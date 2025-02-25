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
// @name           GitHub enhancer
// @namespace      https://github.com/paponius/
// @description    For now, adds size column to filelist on github.com
// @author         papo
// @version        1.0.0
// @license        GPLv2
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com

// @match          *://github.com/*

// @run-at     document-end

//// GRANT - PERMISSIONS
// @grant          none

//// PROJECT FILES
// @require        https://github.com/paponius/UserScripts-papo/raw/master/src/github_add_size_filelist.js?v0.9
// #@require        https://github.com/paponius/UserScripts-papo/raw/master/src/github_add_author_email.js?v0.9

// ==/UserScript==
