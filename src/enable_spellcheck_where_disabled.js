/* jshint esversion: 6 */
/* jshint debug: true */


/* 
   This script ...
 */


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


// IIFE can't be used if project consists of multiple modules-files with shared variables.
// 'use strict' could be outside of the IIFE in GM. As scripts are all wrapped in one function anyway.
(() => {
'use strict';


// TODO: Uncaught (in promise) ReferenceError: Cannot access 'window' before initialization
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


function removeSpellDisableAttr() {
	if (DEBUG) { console.log('enable_spellcheck_where_disabled.js: STARTED removeSpellDisableAttr'); }
	for (let el of document.querySelectorAll('[spellcheck="false"]')) {
		el.removeAttribute("spellcheck");
	}
}


//// GM Menu
// event : MouseEvent | KeyboardEvent
const menu_command_id_1 = GM_registerMenuCommand("Enable spellcheck on delayed elements", event => {
	removeSpellDisableAttr();
}, {
  accessKey: "s",
  // autoClose: true,
  title: 'Spell check is enabled always when this script is ON. But sometimes elements are created later, on some user action. This option will enable spellcheck on said elements.'
});


whenPageReady(removeSpellDisableAttr);

// if this script should work on any page, observers can't be used.
// the next best thing is to run again couple of times later
setTimeout(removeSpellDisableAttr, 5000);
setTimeout(removeSpellDisableAttr, 10000);

})();

// outside of the IIFE wrapper, if code in IIFE "return"-s, this will be still shown
if (DEBUG) { console.log('enable_spellcheck_where_disabled.js: ENDED'); }
