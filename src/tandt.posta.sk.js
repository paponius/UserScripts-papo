/* jshint esversion: 6 */


(function() {
'use strict';
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


// Waiting for this part to appear
// <div><div class="text-small lg:text-base font-medium">Odkaz na zásielku</div>
// <div class="break-words text-small font-normal">https://tandt.posta.sk/zasielky/XX123456789SK</div></div>

// \Documents\coding\JS\Solutions\MutationObserver\MutationObserver.js
function regMutationObserver() {
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	new MutationObserver(mutations => {
		if (DEBUG) { console.log('tandt.posta.sk.js: regMutationObserver: fired'); }

		for (let m of mutations) {
			if (m.addedNodes.length === 0) { continue; } // looking for added only, not removed

			let elements = [];
			for (let par of m.addedNodes) {
				if (!(par instanceof HTMLElement)) { continue; } // could be #Text, than it will error
				if (par instanceof HTMLStyleElement) { continue; } // Style does not have children
				let tmp = par.getElementsByTagName('div');
				let tmp_arr = Array.prototype.slice.call(tmp); // converts HTMLCollection to regular Array
				elements = elements.concat(tmp_arr);
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


if (DEBUG) {
	console.log('tandt.posta.sk.js: host: ', window.location.host);
	if (window.top === window.self) { // alternative to determine if in an iframe
		console.log('tandt.posta.sk.js: window.top === window.self');
	} else { console.log('tandt.posta.sk.js: window.top !== window.self'); }
}

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

if (DEBUG) { console.log('tandt.posta.sk.js: ENDED tandt.posta.sk.js'); }
})();
