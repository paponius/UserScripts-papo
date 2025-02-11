/* jshint esversion: 6 */

/* 
   This script keeps extending session on a web page. Disabling auto log off.
   2023-10 I had problems that it did not work, when the browser tab, or even window was not active, wrote a note in readme:
   > ! Does not work. Browsers do freeze JS on background Tabs.  
   > Probably using a service worker would fix the issue.
   2501 But testing now, it seem to work OK. Maybe browser update?

   Method 1 (from [1])
   Using XHR to access the page, or a specific resource.

   Method 2 (from [1])
   An invisible iFrame, periodically loading the same page inside already loaded page.

   I don't remember what was supposed to be method 3, probably this comment:
   "use an image that you know exists on the remote server, and check it's height" [1]

   Method 4
   use Web Worker for timer, so it will not get frozen.

   TODO:
    - each URI with its own settings and on-off switch
    - option to set ping interval for each
    - option to change method
    - option to select an element for 

      a line in Options for each new URI
      with new being added with "add new (+)" button
      right side of each of them a status light, gray, orange for matched URI but inactive, or green
      left a combo with choice of a ping mode, next to id an optional text box for uri of pinged resource (for such method which does that), and ending with a checkbox

    - status turned red if a page did go offline anyway, this would be detected by getting a value from a selector. (two text input boxes)
      - or from a different uri. or even by entering a JS expression. 
   


   [1] https://stackoverflow.com/questions/849088/using-javascript-for-pinging-a-webapp-to-keep-session-open
 */




var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


(() => {
'use strict';

const method = 2;
var minutesRefresh = 14;
if (DEBUG) { minutesRefresh = 1; }

// if (DEBUG) { console.log('keepalive.js: GM_info', GM_info); }


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


var initPingDone;
var tm;
/**
 * Pings a web server to keep session unexpired. i.e. user is not logged off
 * @Global/Closure vars/const:
 *   {1|2|3}   method          what method is used;
 *   {Number}  minutesRefresh  e.g. 14;
 *   {Boolean} initPingDone    can be internal. Not pinger's fault if someone wants to run two pingers.
 *   {timer}   tm              timer, I don't think this should be external var. todo move in function
 *  
 * @method pinger
 * @param  {[type]} onOFF [description]
 * @return {[type]}       [description]
 */
function pinger(onOFF) {
	var reloadIframe;
	var keepAlive;
	var refreshTime;

	if (! initPingDone) { initPinger(); }

	if (onOFF) {
		if (DEBUG) { console.log('keepalive.js: Enabling'); }
		if (method === 1) { // not tested
			tm = setInterval(keepAlive, minutesRefresh * 60 * 1000);
		} else if (method === 2) {
			tm = setTimeout(reloadIframe, refreshTime);
		}
	} else {
		if (DEBUG) { console.log('keepalive.js: Disabling'); }
		if (method === 1) { // not tested
			clearInterval(tm);
		} else if (method === 2) {
			clearTimeout(tm);
		}
	}

	function initPinger() {
	if (method === 1) { // not tested
	    keepAlive = function () {
	        var httpRequest = new XMLHttpRequest();
	        // httpRequest.open('GET', "/restricted_file_url");
	        httpRequest.open('GET', "/");
	        httpRequest.send(null);
	    };

	} else if (method === 2) {
	    if (DEBUG) { console.log('keepalive.js: The session for this site will be extended automatically via userscript.'); }

	    var minute = 60*1000;
	    refreshTime = minutesRefresh * minute;

	    var iframe = document.createElement("iframe");
	    iframe.style.width = 0;
	    iframe.style.height = 0;

	    var loc = window.location;
	    var src = loc.protocol +'//' + loc.host + loc.pathname;
	    src += loc.search ? (loc.search + '&') : '?';
	    src +=  'sessionextendercachebuster=';

	    reloadIframe = function () {
	        var time = new Date().getTime();
	        var lastRefresh = localStorage.getItem('keep_alive_lastRefresh');
	        var timeSinceLastRefresh = time - lastRefresh;
	        if (!lastRefresh || timeSinceLastRefresh > refreshTime - minute) {
	            if (DEBUG) { console.log('keepalive.js: Auto-extending session'); }
	            iframe.src = src + time;
	            localStorage.setItem('keep_alive_lastRefresh',time);
	            tm = setTimeout(reloadIframe, refreshTime);

	            setTimeout(function(){
	                // Unload the iframe contents since it might be taking a lot of memory
	                iframe.src='about:blank';
	            },10000);
	        }else{
	            if (DEBUG) { console.log('keepalive.js: Another tab/window probably refreshed the session, waiting a bit longer'); }
	            tm = setTimeout(reloadIframe, refreshTime - timeSinceLastRefresh - minute);
	        }
	    };
	    // setTimeout(reloadIframe, refreshTime);
	    document.body.appendChild(iframe);
	} else if (method === 3) {}
	initPingDone = true;
	}
} // END function pinger() {


//// Snippet testStringOrRegexp v1.0
// how to detect regex in a String and create a regex from a String
// some horrific ideas on
// Here we consider a String starting with '/' to be a regex.
// Let user escape first '/' with '\', if the String should stay String.
// Use everything after last '/' as flags.
// Leave everything else untouched, let `new RegExp` handle or not what user created.
function testStringOrRegexp(needle,haystack) {
	var failedAsRegex = false;
	// charAt can give wrong results for Unicode. Use Array.from:
	var ar = Array.from(needle);
	if (ar[0] === '/') {
		let posLast = ar.lastIndexOf('/');
		if (posLast === 0) {
			failedAsRegex = true;
		} else {
			let p = ar.slice(1, posLast);
			let f = ar.slice(posLast + 1);
			try {
				let rPatt = new RegExp(p.join(''), f.join(''));
				if (rPatt.test(haystack)) { return true; }
			} catch (e) { failedAsRegex = true; }
		}		
	}
	if (ar[0] !== '/' || failedAsRegex) {
		// Remove escape. If escaped '/' by '\' to avoid recognition of String as a regex.
		if (ar[0] === '\\' && ar[1] === '/') { needle = needle.substring(1); }
		if (haystack.includes(needle)) {
			console.log('[keepalive.js] match ',needle);
			return true;
		}
	}
}

function isDomainSelected() {
	var uri = window.location.href;
	for (let needle of optURIs.value) {
		if (testStringOrRegexp(needle, uri)) { return true; }
	}
	return false;
}


const menu_command_options = GM_registerMenuCommand("Options", event => {
	if (ControlPanel.panels[0].hidden) { ControlPanel.panels[0].show();
	} else { ControlPanel.panels[0].hide(); }
}, {
  accessKey: "o",
  autoClose: false,
  title: 'Open Options'
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//// Control Panel
new ControlPanelWithLocalStorage('paragraph', 'Keep-alive<br/>pings a web server to keep user logged in.');

var optKeepAlive = new ControlPanelWithLocalStorage('checkbox', 'Overall Keep-alive', false, state => { if (state) { pinger(true); } else { pinger(false); } });
var optURIs = new ControlPanelWithLocalStorage('text', 'URIs (string or regexp)');
optURIs.sanateValue = (value) => {
	// empty string would match everything
	return value.filter(item => item !== '');
};
optURIs.realizeValue = (value) => {
	return value.split(',').map(item => item.trim());
};
optURIs.unRealizeValue = (value) => {
	if (Array.isArray(value)) { return value.join(','); }
		console.warn('[keepalive.js] bad value');
	return value;
};

// can't exit early, before ControlPanelWithLocalStorage nor GM_registerMenuCommand,
// need to check if URI is listed, need to allow GM menu to let user access Options and add a URI.
if (!isDomainSelected()) { return; }


pinger(optKeepAlive.value);



})();

// ouside of the IIFE wrapper, if code in IIFE "return"-s, this will be still shown
if (DEBUG) { console.log('[keepalive.js] ENDED'); }
