/* jshint esversion: 6 */

(function() {
'use strict';

const method = 2;

var pingerStatus;

var statusCur = statusWin('hello', state => { if (state) { pinger(true); } else { pinger(false); } });
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

		elStatusCtrInput.style = "position: fixed;right: 5px;top: 5px;color: white;border-width: 0px;border-radius: 5px;background-color: gray;opacity: 0.5;";

		elStatusCtrInput.onclick = function() {
			if (elStatusCtrInput.checked) { // reports state AFTER the change
				if (callBack(true)) { localStorage.setItem('status', 'true'); }
			} else {
				if (callBack(false)) { localStorage.setItem('status', 'false'); }
			}
			// if(confirm('Enable?')){
				// localStorage.setItem('status', 'true');
				// elStatusCtrInput.remove();
			// }
		};

		elStatusCtrDiv.appendChild(elStatusCtrInput);
		elStatusCtrDiv.appendChild(elStatusCtrLabel);
		document.body.appendChild(elStatusCtrDiv);

		if (localStorage.getItem('status') === null) { // first-time use, start with enabled
			localStorage.setItem('status', 'true');
		}
	} else {
		elStatusCtrInput = document.getElementById('statusCtr');
	}
	initStatusWinDone = true;

	var prevStatus = localStorage.getItem('status');
	if(prevStatus) {
		elStatusCtrInput.checked = true;
		return true;
	} else {
		elStatusCtrInput.checked = false;
		return false;
	}
}

var initPingDone;
function pinger(statusCur) {
	var reloadIframe;
	var refreshTime;

	if (! initPingDone) { initPinger(); }

	// todo: init (on first run), ON/OFF condition blocks
	if (statusCur) {
		if (method === 2) {
			setTimeout(reloadIframe, refreshTime);
		}
	} else {
		if (method === 2) {
			clearTimeout(reloadIframe);
		}
	}

	function initPinger() {
	if (method === 1) {
	    function keepAlive() {
	        var httpRequest = new XMLHttpRequest();
	        httpRequest.open('GET', "/restricted_file_url");
	        httpRequest.send(null);
	    }

	    setInterval(keepAlive, 840000); //My session expires at 15 minutes
	} else if (method === 2) {
	    console.log('The session for this site will be extended automatically via userscript.');

	    var minute = 60*1000;
	    refreshTime = 15 * minute;

	    var iframe = document.createElement("iframe");
	    iframe.style.width = 0;
	    iframe.style.height=0;

	    var loc = window.location;
	    var src = loc.protocol +'//' + loc.host + loc.pathname;
	    src += loc.search ? (loc.search + '&') : '?';
	    src +=  'sessionextendercachebuster=';

	    reloadIframe = function(){
	        var time = new Date().getTime();
	        var lastRefresh = GM_getValue('lastRefresh');
	        var timeSinceLastRefresh = time - lastRefresh;
	        if (!lastRefresh || timeSinceLastRefresh > refreshTime - minute) {
	            console.log('Auto-extending session');
	            iframe.src = src + time;
	            GM_setValue('lastRefresh',time);
	            setTimeout(reloadIframe, refreshTime);

	            setTimeout(function(){
	                // Unload the iframe contents since it might be taking a lot of memory
	                iframe.src='about:blank';
	            },10000);
	        }else{
	            console.log('Another tab/window probably refreshed the session, waiting a bit longer');
	            setTimeout(reloadIframe, refreshTime - timeSinceLastRefresh - minute);
	        }
	    };
	    document.body.appendChild(iframe);
	} else if (method === 3) {}
	initPingDone = true;
	}
} // END function pinger() {


})();
