/* jshint esversion: 6 */

/* 
This script will add full tracking link into the browser's URI (omnibox)
After entering the tracking number, the page will show text: "Odkaz na zásielku" and the following sibling element will have the correct full URI in its content. But this is shown in an iFrame.

This script will register a mutation observer in that iFrame, www.posta.sk, and custom event listener in the main frame tandt.posta.sk.
When the element containing the full URI appears, an event is fired which is handled in main frame and it will change the URI.
 */

// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );

(function() {
'use strict';

function isIFrame() {
	if (DEBUG) { console.debug('SCRIPTNAME: host: ', window.location.host); }
	if (window.top !== window.self) {
		if (DEBUG) { console.log('SCRIPTNAME: Running in an iFrame'); }
		return true;
	}
	if (DEBUG) { console.log('SCRIPTNAME: Not running in an iFrame'); }
	return false;
}

!!isIFrame();


// Waiting for this part to appear
// <div><div class="text-small lg:text-base font-medium">Odkaz na zásielku</div>
// <div class="break-words text-small font-normal">https://tandt.posta.sk/zasielky/XX123456789SK</div></div>

// \Documents\coding\JS\Solutions\MutationObserver\MutationObserver.js
function regMutationObserver() {
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	new MutationObserver(mutations => {
		if (DEBUG) { console.count('tandt.posta.sk.js: regMutationObserver: fired'); }

		for (let m of mutations) {
			if (m.addedNodes.length === 0) { continue; } // looking for added only now, not removed/changed

			let elements = [];
			for (let node of m.addedNodes) {
				// maybe check if not m.target.tagName === "HEAD"
				if (!(node instanceof HTMLElement)) { continue; } // Processing a #Text node will error
				if (node instanceof HTMLStyleElement) { continue; } // Style does not have children

				if (node.tagName === 'div') { elements.push(node); }
				let tmp = node.getElementsByTagName('div');
				let tmp_arr = Array.prototype.slice.call(tmp); // converts HTMLCollection to regular Array
				elements = elements.concat(tmp_arr); // merge two Arrays
			}

			if (DEBUG && elements.length !== 0) {
				console.log('tandt.posta.sk.js: regMutationObserver: ',m.type , ' | new links:', elements.length, ' | on target: ', m);
			}

			for (const el of elements) {
				if (el.textContent === 'Odkaz na zásielku') {
					const link = el.nextElementSibling.textContent;
					if (DEBUG) { console.log('tandt.posta.sk.js: Link: ', link); }

					// add A element, move text into it
					el.nextElementSibling.textContent = '';
					const elA = document.createElement('a');
					elA.setAttribute('href', link);
					elA.textContent = link;
					el.nextElementSibling.appendChild(elA);
					// or: el.replaceWith, but would be more work/is more intrusive
 					window.top.postMessage ({ 'operation': 'fulllink', 'data': link }, '*'); // obj: page already uses messages, need to distinguish
				}
			}
		}
	})
	.observe(document, {
		subtree: true,
		childList: true
	});
}


var waitPageReady = function () {
	if (DEBUG) { console.log('tandt.posta.sk.js: START waitPageReady()'); }

	if (document.readyState !== 'complete') {
		window.addEventListener('load', waitPageReady);
		if (DEBUG) { console.log('tandt.posta.sk.js: STOP waitPageReady(): page not ready.'); }
		return;
	}

	if (DEBUG) { console.log('tandt.posta.sk.js: waitPageReady(): page loaded'); }
	regMutationObserver();
};


switch (window.location.host) {
	case 'tandt.posta.sk': // main page
		window.addEventListener ("message", evt => {
			if (DEBUG) { console.log('tandt.posta.sk.js: message: ', evt); }
			if (evt.data.operation ===  'fulllink') {
				if (DEBUG) { console.log('tandt.posta.sk.js: Link received by main page: ', evt.data.data); }
				history.replaceState(null, document.title, evt.data.data + location.search + location.hash);
			}				
		}, false);

		break;
	case 'www.posta.sk': // iframe
		waitPageReady();
		break;
	default:
		if (DEBUG) { console.error('tandt.posta.sk.js: unexpected domain: ', window.location.host); }
		break;
}

if (DEBUG) { console.log('tandt.posta.sk.js: ENDED'); }
})();
