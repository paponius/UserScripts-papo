/* jshint esversion: 6 */


/* 
   This script ...
 */


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );

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


if (DEBUG) {
	console.log('tandt.posta.sk.js: host: ', window.location.host);
	if (window.top === window.self) { // alternative to determine if in an iframe
		console.log('tandt.posta.sk.js: window.top === window.self');
	} else { console.log('tandt.posta.sk.js: window.top !== window.self'); }
}


(() => { // can't be used if main part is loaded using @require and variables are defined here.
'use strict'; // could be outside of the function in GM. As scripts are all wrapped in one function


// determine if running in an iframe
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

/*
	if (document.readyState !== 'complete') {
		window.addEventListener('load', event => changeIcon(icon, type, sizes, event));
		if (DEBUG) { console.log('changeIcon(): page not ready.'); }
		return;
	}
*/
/*
	if (document.readyState !== 'interactive' && document.readyState !== 'complete') {
		window.addEventListener('DOMContentLoaded', event => changeIcon(icon, type, sizes, event));
		if (DEBUG) { console.log('changeIcon(): page not ready.'); }
		return;
	}
*/

var SavedElements = [];
var Keys = [''];

function randomStr(length) {
	var rand = '';
	if (length > 8) { //console.error('too much random: ', lenght); }
		rand = randomStr(length - 8);
		length = 8;
	}
	do {
		rand += Math.random().toString(36).substr(2, length);
	} while (rand.length === lenght);
	return rand;
}
function hideContentData(element, keys) {
	return keys.some(key => {
		if (element.textContent.includes(key)) { return true; }
	});
}
	// todo:rand length should be just approximately long as orig
function hidePropertiesData(element, keys) {
	// var saved = {el: null, propName: [], propValue: [], cont: '' };
	debugger;
	// TM crashes a tab on: var saved = {};
	var hu = new Object();
	// var saved = new Object();
	// attribute names/values are replaced completely, if they contain the key
	for (let attr of element.attributes) {
		console.log(attr.specified);
		console.log(attr.name);
		console.log(attr.value);
		keys.forEach(key => {
			if (attr.name.includes(key)) {
				let rand = randomStr(attr.name.length);
				saved.propName.push({orig: attr.name, fake: rand});
				attr.name = rand;
			}
			if (attr.value.includes(key)) {
				let rand = randomStr(attr.value.length);
				saved.propValue.push({orig: attr.value, fake: rand});
				attr.value = rand;
			}
		});
	}
	// todo: in content, just the string itself is replaced. but a user can search just for a part of string to be hidden
	if (keys.some(key => {
		if (element.textContent && element.textContent.includes(key)) { return true; }
		})) {
		let rand = randomStr(attr.value.length);
		saved.cont = element.textContent;
		element.textContent.replaceAll(key, rand);
	}
	// if (saved.propName.length !== 0 || saved.propValue.length !== 0 || !!saved.cont) {
	if (saved.propName && saved.propName.length !== 0 || saved.propValue && saved.propValue.length !== 0 || !!saved.cont) {
		saved.el = element;
		SavedElements.push(saved);
	}
}

function hideDataAll(node) {
debugger;
var test = {};
	// hideContentData(node, Keys);
	hidePropertiesData(node, Keys);

	// recurse children
	for (let childNode of node.childNodes) {
		if (! childNode) { continue; }
		if (childNode.childNodes.length > 0) {
			hideDataAll(childNode);
		}
	}
}

// using .childNodes will include text nodes and comment nodes, alt getElementsByTagName(), querySelectorAll() would not
// use document or document.body, depending on the need to check head too
function filterNodes(node, filter) {

}
// ---
// debugger;
const elements = new Map();
const removedElementsSelector = "img";
dispatchEvent(new CustomEvent("single-file-user-script-init"));

addEventListener("single-file-on-before-capture-request", () => {

    document.querySelectorAll(removedElementsSelector).forEach(element => {
      const placeHolderElement = document.createElement(element.tagName);
      elements.set(placeHolderElement, element);
      element.parentElement.replaceChild(placeHolderElement, element);
    });

    debugger;
    var test = {};
	// hideDataAll(document.body);
	// hideDataAll(unsafeWindow.document);
	hideDataAll();
  });

addEventListener("single-file-on-after-capture-request", () => {
    Array.from(elements).forEach(([placeHolderElement, element]) => {
      placeHolderElement.parentElement.replaceChild(element, placeHolderElement);
    });
    elements.clear();
  });
// ---

if (DEBUG) { console.log('<SCRIPTNAME>: ENDED'); }

})();
