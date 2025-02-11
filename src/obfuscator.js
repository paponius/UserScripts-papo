/* jshint esversion: 6 */


/* 
   This script will anonymize a web page before saving or printing it.
   It will search all Nodes of a web page for predefined keyword strings
   and replace them with random characters.
   This is done in text nodes, comments, element attribute's names and values, and browser's omnibox.

   It's functioning only as a UserScript now, as this file contains GM specific calls (Menu)
   and as there are no buttons yet to obf/deobf on a Panel.
   It is fully functional. With limitation to features below in TODO. Some might be one day implemented.

   TODO:
   allow escape ',' in input

   disable input box, while obfuscated?

   add notice panel - saying e.g. 'obfuscated', flashes
   add status panel - showing if it's now 'obfuscated', watermark
   add 'obfuscate'/deobf on CP panel

   - limiting obf to URI/text/prop can be useful

   - Obfuscating value of a property based on its valuename would make sense
     i.e. if a property is called Johnny, it's value even if unreadable might be privacy sensitive

   - changes to some elements's properties breaks page: script/style/id/class/ more?
     make table of substitutes, replace all following occurrences with the same random for these props
	 or just don't process: style, TEXT NODE within style element?

   - rand length - give choice to add [from-to] length for obfus for each 

   - maybe even node name should be checked

   - Should also check `processing instruction`? or maybe just do the same as with a text node
	//  attributes
	//  text nodes
	//  processing instruction  `<? xxx`
	//  comments
	//  CDATA:  `<![CDATA[`
	//    probably not needed, as "should not be used within HTML. They are considered comments..."

   - enable regex or glob. in text node, just the string itself is replaced. but a user can search just for a part of string to be hidden
 */


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


(() => {
'use strict';

var SavedElements = [];
var SavedURI;
var isObfuscated = false;
var isChangedURI = false;
const KeysDefault = null; // does not make sense now when this is a shared script
// const KeysDefault = ['huhu', 'br', 'au', 'zatsdsds'];

// Snippet randomStr v1.0
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


// attribute names/values are replaced completely, if they contain the key
function obfuscate(element, keys) {
	var saved = {el: null, prop: [], cont: '' };
	// type: typePropItem = {nameOrig: '', valueOrig: '', nameFake: ''};


	// text nodes don't have attributes, nor a method hasAttributes()
	// todo: is hasAttributes() necessary?
	if (element.attributes && element.hasAttributes()) {
		// can't use `let` here. no idea why. script will crash. (Tab crash)
		for (var attr of element.attributes) {
			// console.log(attr.specified);
			// let test = 'test'; // but using `let` here is OK
			keys.forEach(key => {
				// console.log(test);
				if (key === '') { return; } // empty string would match everything (this is already checked before)
				let valueOrig = null;
				let nameFake = null;
				// probably no need to check if name, value exist, but to be on a safe side
				// change value first, as propertyname can't be changed in-place
				if (attr.value && attr.value.includes(key)) {
					valueOrig = attr.value;
					attr.value = randomStr(attr.value.length);
				}
				// todo: if the name starts with data- keep that part, or just change the Key part?
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
			// todo: maybe add the above `if` here?
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

	if (saved.prop.length !== 0 || !!saved.cont) {
		saved.el = element;
		SavedElements.push(saved);
	}
}

function crawlElement(node) {
	obfuscate(node, optKeys.value);

	// .childNodes includes text nodes and comment nodes
	for (let childNode of node.childNodes) {
		// it's a live collection, it will not try to iterate non-existing node
		// if (! childNode) { debugger; alert('does this happen?'); continue; }

		crawlElement(childNode);
	}
}

/* Method B: (maybe todo and compare speed.)
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

// Method C: getElementsByTagName(), querySelectorAll() would not use document or document.body (without head),
// also it creates static list (not live). But no text nodes. I don't like this method and will not try it here.


function obfuscateOmnibox() {

	///// test
	// var a = window.location.href;
	// var a2 = window.location;

	// Note 2012 in FF "property doesn't update after a window.location to an anchor (#),"
	// Note: If you have a frame, image, or form with name="URL" then this property will be shadowed on the document object
	// var b = document.URL;
	// var c = document.baseURI;
	// var d = history.state; // it's empty if stateObj was not used before
	const stateObj = { foo: "bar" };

	SavedURI = window.location.href;
	var changedURI = SavedURI;
	optKeys.value.forEach(key => {
		if (!SavedURI.includes(key)) { return; }
		isChangedURI = true;
		let rand = randomStr(key.length);
		changedURI = changedURI.replaceAll(key, rand);
	});
	if (isChangedURI) {
		history.replaceState(stateObj, document.title, changedURI);
		// test, will it keep #hash and ?query: + location.search + location.hash);
	}
}


function unObfuscate() {
	for (let sel of SavedElements) {
		if (sel.cont) {
			sel.el = sel.cont;
		}
		if (sel.prop.length !== 0) {
			for (let mod of sel.prop) {
				if (mod.valueOrig) {
					sel.el.setAttribute(mod.nameOrig, mod.valueOrig);
				}
				if (mod.nameFake) {
					// both name and value were obfusc., and value was also stored, it was restored above to orig name, just delete
					if (!mod.valueOrig) {
						sel.el.setAttribute(mod.nameOrig, sel.el.getAttribute(mod.nameFake));
					}
					sel.el.removeAttribute(mod.nameFake);
				}
			}
		}
	}
}

function unObfuscateOmnibox() {
	if (isChangedURI) {
		console.log(history.state); // it's empty if stateObj was not used before
		debugger;
		history.replaceState(null, document.title, SavedURI);
	}
}


dispatchEvent(new CustomEvent("single-file-user-script-init"));

addEventListener("single-file-on-before-capture-request", () => {
	if (optObfWithSingleFile.value && !isObfuscated) {
		obfuscateOmnibox();
		crawlElement(document);
	}
	isObfuscated = true; // or set as a result of success
});

addEventListener("single-file-on-after-capture-request", () => {
	if (optObfWithSingleFile.value && isObfuscated) {
		unObfuscate();
		unObfuscateOmnibox();
	}
	isObfuscated = false; // (also, maybe set as a result of success)
});


//// GM Menu
// event : MouseEvent | KeyboardEvent
const menu_command_id_1 = GM_registerMenuCommand("Obfuscate now", event => {
	if (!isObfuscated) {
		obfuscateOmnibox();
		crawlElement(document);
	}
	isObfuscated = true; // or set as a result of success
}, {
  accessKey: "o",
  autoClose: true,
  title: 'Remove personal data from opened web page.'
});
const menu_command_id_2 = GM_registerMenuCommand("Restore page - un-obfuscate", event => {
	if (isObfuscated) {
		unObfuscate();
		unObfuscateOmnibox();
	}
	isObfuscated = false; // (also, maybe set as a result of success)
}, {
  accessKey: "u",
  autoClose: true,
  title: 'Undo obfuscation.'
});
const menu_command_id_3 = GM_registerMenuCommand("Options", event => {
	if (ControlPanel.panels[0].hidden) { ControlPanel.panels[0].show();
	} else { ControlPanel.panels[0].hide(); }
}, {
  accessKey: "s",
  autoClose: false,
  title: 'Open Options'
});


//// Control Panel
new ControlPanelWithLocalStorage('paragraph', 'Obfuscate will anonymize a web page<br/>before saving or printing it.');

var optObfWithSingleFile = new ControlPanelWithLocalStorage('checkbox', 'Obfuscate during SingleFile save', true);

var optKeys = new ControlPanelWithLocalStorage('text', 'Filter phrases', KeysDefault);
optKeys.sanateValue = (value) => {
	// empty string would match everything
	return value.filter(item => item !== '');
};
optKeys.realizeValue = (value) => {
	return value.split(',').map(item => item.trim());
};
optKeys.unRealizeValue = (value) => {
	if (Array.isArray(value)) { return value.join(','); }
		console.warn('[obfuscator.js] bad value');
	return value;
};


if (DEBUG) { console.log('[obfuscator.js] ENDED'); }
})();
