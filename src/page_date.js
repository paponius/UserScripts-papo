/* jshint esversion: 6 */
/* jshint debug: true */

/* 
   This script ...
 */


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );

// todo: get rid of this. the only way, if really needed, is to create a separate JS file for "log()",
// then click ignore on it in Browser's DevTools.
//
// add script name to console output.
// But the problem is, using filter with script name will in Chrome console
// hide Error messages originated in TM and browser.
// Chome console source is shown as:
// userscript.html?name=DEBUG-<NAME>.user.js&id=5d9cfd47-9d13-4e24-8ad5-a7f1e59a4393:234
// In Firefox the source is the name of the main script file: socnet.user.js:224:22
// in chrome, use "userscript" as the filter.
if (DEBUG) {
	let scrName = GM.info.script.name.substr(8);
	var cons = {
		log: (...args) => console.log('['+scrName+']', ...args),
		error: (...args) => console.error('['+scrName+']', ...args),
		count: (arg) => console.count('['+scrName+'] ' + arg)
	};
}


// IIFE can't be used if project consists of multiple modules-files with shared variables.
// 'use strict' could be outside of the IIFE in GM. As scripts are all wrapped in one function anyway.
(() => {
'use strict';


// Snippet v1.0. determine if running in an iframe
function isIFrame() {
	if (DEBUG) { console.debug('SCRIPTNAME: host: ', window.location.host); }
	if (window.top !== window.self) {
		if (DEBUG) { console.log('SCRIPTNAME: Running in an iFrame'); }
		return true;
	}
	if (DEBUG) { console.log('SCRIPTNAME: Not running in an iFrame'); }
	return false;
}
// alternative is: switch (window.location.host) { case 'DOMAINNAME': // main page

// this shouldn't be needed when @noframes meta is used
if (isIFrame()) {
	if (DEBUG) { console.log('SCRIPTNAME: Attempted to start in an iFrame'); }
	return;
}


// SNIPPET whenPageReady v1.3
// state: [interactive | complete]
var whenPageReady = (handler, state = 'complete') => {
	if (DEBUG) { console.log('SCRIPTNAME: BEGIN whenPageReady()'); }
	var eventName;

	if (state === 'DOMContentLoaded') { state = 'interactive'; }
	if (state === 'load') { state = 'complete'; }
	if (state !== 'interactive' && state !== 'complete') {
		console.warn('SCRIPTNAME: whenPageReady(): wrong STATE argument: ' + state + '. Defaulting to: "complete".');
		state = 'complete';
	}
	if (state === 'interactive') { eventName = 'DOMContentLoaded'; }
	if (state === 'complete') { eventName = 'load'; }

	if (document.readyState !== 'complete' && (state === 'complete' || document.readyState !== 'interactive')) {
		window.addEventListener(eventName, () => whenPageReady(handler, state));
		if (DEBUG) { console.log("SCRIPTNAME: END whenPageReady(): page not ready. (readyState = '" + document.readyState + ', desired: ' + state); }
		return;
	}

	if (DEBUG) { console.log("SCRIPTNAME: END whenPageReady(): page ready (readyState = '" + state + "')"); }
	handler();
};


var datesPage = {};
var req = new XMLHttpRequest();
req.open('GET', document.location, true);
req.send(null);
req.onload = () => {
	var headers = req.getAllResponseHeaders().toLowerCase();
	debugger;
	var bg = (headers.indexOf('last-modified:') + 14);
	datesPage['last-modified'] = headers.substring(bg, headers.indexOf('\n', bg)).trim('');

	// now only this one directly in GM menu
	const menu_command_id_1 = GM_registerMenuCommand("last-modified: " + datesPage['last-modified']);

	console.log(headers);
};



})();

// ouside of the IIFE wrapper, if code in IIFE "return"-s, this will be still shown
if (DEBUG) { console.log('SCRIPTNAME.js: ENDED'); }
