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
   state on-off must be stored per domain
   option to change method
   option to select an element for 

   [1] https://stackoverflow.com/questions/849088/using-javascript-for-pinging-a-webapp-to-keep-session-open
 */




var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


(() => {
'use strict';

if (DEBUG) { console.log('keepalive.js: GM_info', GM_info); }
if (DEBUG) { debugger; }

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

// this shouldn't be needed when @noframes meta is used
if (isIFrame()) {
	if (DEBUG) { console.log('SCRIPTNAME: Attempted to start in an iFrame'); }
	return;
}


const method = 2;
var minutesRefresh = 14;
if (DEBUG) { minutesRefresh = 1; }

var statusCur = statusWin('Keep-alive', state => { if (state) { pinger(true); } else { pinger(false); } });
pinger(statusCur);


var initStatusWinDone;
function statusWin(strMessage, callBack) {
	var elStatusCtrInput;

	if (! initStatusWinDone) {
		var elStatusCtrDiv = document.createElement('DIV');

		elStatusCtrInput = document.createElement('INPUT');
		elStatusCtrInput.type = 'checkbox';
		elStatusCtrInput.id = 'statusCtr';
		elStatusCtrInput.name = 'statusCtr';

		var elStatusCtrLabel = document.createElement('LABEL');
		elStatusCtrLabel.type = 'label';
		elStatusCtrLabel.htmlFor = "statusCtr";
		elStatusCtrLabel.innerHTML=strMessage;

		elStatusCtrDiv.style = "position: fixed;right: 5px;top: 5px;color: white;border-width: 0px;border-radius: 5px;background-color: gray;opacity: 0.5; padding-left: 5px;";

		elStatusCtrInput.onclick = function() {
			if (elStatusCtrInput.checked) { // "checked" represents new/changed value
				// if callback has no return statement, undefined is returned.
				if (callBack(true) !== false) { localStorage.setItem('feature745', 'ON'); }
			} else {
				if (callBack(false) !== false) { localStorage.setItem('feature745', 'OFF'); }
			}
		};

		elStatusCtrDiv.appendChild(elStatusCtrLabel);
		elStatusCtrDiv.appendChild(elStatusCtrInput);

		// if (document.body) {
		// 	document.body.appendChild(elStatusCtrDiv);
		// } else {
		// 	document.head.parentElement.insertBefore(elStatusCtrDiv, document.head.nextSibling);
		// }

		// a page could have a frameset instead of <body>, then document.body would target the frameset
		switch (document.body.tagName.toUpperCase()) {
			case 'BODY':
				document.body.appendChild(elStatusCtrDiv);
				break;
			case 'FRAMESET':
				document.body.parentElement.insertBefore(elStatusCtrDiv, document.body);
				break;
			default:
				// statements_def
				break;
		}

		if (localStorage.getItem('feature745') === null) { // first-time use, start with enabled
			localStorage.setItem('feature745', 'ON'); // don't use bool, stores only String
		}
	} else {
		elStatusCtrInput = document.getElementById('statusCtr');
	}
	initStatusWinDone = true;

	if(localStorage.getItem('feature745') === 'ON') {
		elStatusCtrInput.checked = true;
		return true;
	} else {
		elStatusCtrInput.checked = false;
		return false;
	}
}


// define e.g.: const method = 2;
// define e.g.: const minutesRefresh = 14;
var initPingDone;
var tm;
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


})();
