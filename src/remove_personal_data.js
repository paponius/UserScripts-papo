/* jshint esversion: 6 */


/* 
   todo change name to web obfuscator
   This script will anonymize a web page before saving or printing it.
   It will search all Nodes of a web page for predefined keyword strings
   and replace them with random characters.
   This is done in text nodes, comments, element attribute's names and values.
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
	// todo:rand length - give choice to add [from-to] length for obfus
	// todo: enable regex or glob. in text node, just the string itself is replaced. but a user can search just for a part of string to be hidden
	// 
var Keys = ['huhu', 'br', 'au', 'zatsdsds'];
// var Keys = ['huhu', 'ddddddddd', 'animddsds', 'zatsdsds'];

// in init should check if any is an empty string and remove it, or it will match positive everywhere
Keys = Keys.filter(item => item !== '');

function randomStr(length) {
	var rand = '',
		curRand ;
	if (length > 8) { //console.error('too much random: ', lenght); }
		rand = randomStr(length - 8);
		length = 8;
	}
	do {
		curRand = Math.random().toString(36).substr(2, length);
	} while (curRand.length !== length);
	return rand + curRand;
}
function randomStringOpt(length, firstJustLetter = false) {
	var str = randomStr(length);
	while (firstJustLetter && !isNaN(str.charAt(0))) {
		str = randomStr(length);
	}
	return str;
}

	// todo:rand length - give choice to add [from-to] length for obfus
	//  maybe even node name should be checked
	//  
	//  attributes
	//  text nodes
	//  processing instruction  <? xxx
	//  comments
	//  CDATA:  <![CDATA[
	//    probably not needed, as "should not be used within HTML. They are considered comments..."
	//  
function hidePropertiesData(element, keys) {
	var saved = {el: null, prop: [], cont: '' };
	// type: typePropItem = {nameOrig: '', valueOrig: '', nameFake: ''};

	// attribute names/values are replaced completely, if they contain the key

	// text nodes don't have attributes, nor a method hasAttributes()
	// todo: is hasAttributes() necessary?
	if (element.attributes && element.hasAttributes()) {
		// can't use let here. no idea why. script will crash.
		for (var attr of element.attributes) {
			console.log(attr.specified);
			console.log(attr.name);
			console.log(attr.value);
			let test = 'te';
			keys.forEach(key => {
				console.log(key);
				console.log(attr);
				console.log(test);
				if (key === '') { return; } // empty string would match everything
				let valueOrig = null;
				let nameFake = null;
				// probably no need to check if name, value exist, but to be on a safe side
				// change value first, as propertyname can't be changed in-place
				if (attr.value && attr.value.includes(key)) {
					valueOrig = attr.value;
					attr.value = randomStr(attr.value.length);
				}
				// todo: if the name starts with data- keep that part, or just change the key part?
				// todo: what about attr, which mod will break page, i.e. id, class, style...?
				if (attr.name && attr.name.includes(key)) {
					nameFake = randomStringOpt(attr.name.length, !!'firstJustLetter');
					// nameOrig = attr.name;
					element.setAttribute(nameFake, attr.value);
					element.removeAttribute(attr.name);
				}
				if (nameFake || valueOrig) {
					saved.prop.push({nameOrig: attr.name, valueOrig: valueOrig, nameFake: nameFake});
				}
			});
		}
	}
	// can't use .textContent, as that includes all children, for HTML, it's the whole page
	switch (element.nodeType) {
		// also: style, script, title, body,...
		case Node.ELEMENT_NODE:
			// debugger;
			break;
		case Node.TEXT_NODE:
		case Node.COMMENT_NODE:
		case Node.CDATA_SECTION_NODE: // check if it contain .data property, if .I'll use data property here
			console.log(element.parentNode);
			// debugger;
	
			if (element.data) {
				keys.forEach(key => {
					if (!element.data.includes(key)) { return; }
					// debugger;
					let rand = randomStr(key.length);
					saved.cont = element.data;
					element.data = element.data.replaceAll(key, rand);
				});
			}

			break;
		case Node.DOCUMENT_NODE: // 9
			console.log('DOCUMENT_NODE');
			break;
		case Node.DOCUMENT_TYPE_NODE: // 10
			console.log('DOCUMENT_TYPE_NODE');
			break;
		default:
			debugger;
			break;
	}

	// if (saved.propName.length !== 0 || saved.propValue.length !== 0 || !!saved.cont) {
	if (saved.prop.length !== 0 || !!saved.cont) {
		saved.el = element;
		SavedElements.push(saved);
	}
}

function Xobfuscate(node) {
	for (let childNode of node.childNodes) {
		if (! childNode) { debugger; alert('does this happen?'); continue; }
		// if (childNode.nodeType !== 1) { debugger; }
		hidePropertiesData(node, Keys);

		if (childNode.childNodes.length > 0) {
			obfuscate(childNode);
		}
	}
}
function obfuscate(node) {
	hidePropertiesData(node, Keys);

	// todo:  should process the content of all element? e.g. a style, TEXT NODE within style element?
	//        offer Option, 'also include script/style/id/class, for these a random value should be selected on beginning and replacing all instances of one key with the same random
	//

	console.log(node.tagName);
	if (DEBUG && node.tagName == 'BODY') {
		console.log(node.childNodes);
		debugger;
	}

	for (let childNode of node.childNodes) {
		// it's a live collection, it will not try to iterate non-existing node
		// if (! childNode) { debugger; alert('does this happen?'); continue; }

		obfuscate(childNode);
	}
}

/* method B:
const nodeIterator = document.createNodeIterator(
  document.body,
  NodeFilter.SHOW_ELEMENT,
  (node) =>
    node.nodeName.toLowerCase() === "p"
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT,
);
const pars = [];
let currentNode;

while ((currentNode = nodeIterator.nextNode())) {
  pars.push(currentNode);
}
 */

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
	debugger;

    // document.querySelectorAll(removedElementsSelector).forEach(element => {
    //   const placeHolderElement = document.createElement(element.tagName);
    //   elements.set(placeHolderElement, element);
    //   element.parentElement.replaceChild(placeHolderElement, element);
    // });

	obfuscate(document);
	// obfuscate(document.body);
	// obfuscate(unsafeWindow.document);
	// obfuscate();
  });

addEventListener("single-file-on-after-capture-request", () => {
    // Array.from(elements).forEach(([placeHolderElement, element]) => {
    //   placeHolderElement.parentElement.replaceChild(element, placeHolderElement);
    // });
    // elements.clear();
  });
// ---

if (DEBUG) { console.log('<SCRIPTNAME>: ENDED'); }

})();
