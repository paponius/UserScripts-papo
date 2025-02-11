/* jshint esversion: 6 */
/* jshint debug: true */

/* 
   This script shows the date of a page modification.
   Now the data is read from request header only, maybe will find some other common places.
   Today, many pages are dynamically generated and the value just shows current time, or is missing all together.
 */


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );

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

// actually, this is probably not necessary, the date is already in document property (see below)
// format of this result: Thu, 06 Feb 2025 00:53:12 GMT
function getDateFromRequestHeader() {
	var req = new XMLHttpRequest();
	req.open('HEAD', document.location, true); // only need header now
	// req.open('GET', document.location, true);
	req.send(null);
	/* req.onload = () => {
		var headers = req.getAllResponseHeaders().toLowerCase();
		var bg = (headers.indexOf('last-modified:') + 14);
		if (bg !== 13) { // -1 + 14
			datesPage['last-modified'] = headers.substring(bg, headers.indexOf('\n', bg)).trim('');

			// show directly in GM menu
			const menu_command_heLM = GM_registerMenuCommand("last-modified: " + datesPage['last-modified']);
		}
		// console.log(headers);
	}; */
	req.onload = () => {
		var headerLastModified = req.getResponseHeader("Last-Modified"); // A valid GMTString date or null
		if (headerLastModified !== null) {
			datesPage['Last-Modified'] = headerLastModified;

			// show directly in GM menu
			const menu_command_heLM = GM_registerMenuCommand("Last-Modified: " + datesPage['Last-Modified']);
		}
		// console.log(headers);
	};
}
// '02/06/2025 01:53:12'
function getDate() {
	if (document.lastModified === null) { return false; }
	datesPage['Last-Modified'] = document.lastModified; 
	// show directly in GM menu
	const menu_command_heLM = GM_registerMenuCommand("Last-Modified: " + datesPage['Last-Modified']);
}


//// get date
const menu_command_id_1 = GM_registerMenuCommand("Show page dates", event => {
	getDate();
}, {
  accessKey: "d",
  // autoClose: false, // true as the menu does not appear while the menu is open
  title: 'Try to get dates fro various places of a web page.'
});


})();

// ouside of the IIFE wrapper, if code in IIFE "return"-s, this will be still shown
if (DEBUG) { console.log('SCRIPTNAME.js: ENDED'); }
