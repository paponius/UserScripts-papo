/* jshint esversion: 11 */
/* Xjshint debug: true */


/* 
// @name           GitHub enhancer
// @namespace      https://github.com/paponius/
// @description    For now, adds size column to filelist on github.com
// @author         papo
// @license        CC-BY-SA-4.0

   This script reads additional data using GitHub API and injects obtained info in the file list on GitHub.com page.
   It adds size of files (for now). Size shows together with other info on a line, and there is no overhead by this script from some periodic scanning.
   Maybe later will add also:
   - downloadable link to a file.
   
   Also possible:
    preview of text/pic... as API contains link to base64 encoded content
    replace icons of dirs/files
   sha not possible. the provided is not standard sha of a file. https://stackoverflow.com/a/39874235/3273963


   This script must run on DOMContentLoaded, but it can (and should) run before 'complete', to draw nicer animation for loading file info.

  Some challenges
    setTimeout is not used, to avoid overhead and add reaction speed.
    Web page on GitHub loads only once. Subsequent navigation to another "page" will only replace the content.
    The whole content of <body> is replaced when page changes between main page (git root) and a path in repo.
    In addition, a parent (reactRoot) holding table is removed and re-added shortly after the page is already loaded
    and shown and also when changing between root and another dir. (for no good reason from user perspective!)
    When changing dirs except from/to root dir, only raws (<tr>) of a <table> are replaced.
    When dir changes, the fileinfo data obtained from API must be reloaded again. (this is not new real page load)


   todo:
   - long filenames? maybe problem?
   - limited API requests, handle when over limit. But I ran hundreds in a minute for a test and didn't hit limit.
     Did not test what will happen. `size = fileInfo.size;` should fail will fileInfo undefined and size will be empty.
   - @270 little situation. Edge case
   - for long lists, when not all files are shown at once, but 'show more' or similar button must be pressed to load more files.
     did not test yet. could just work as tbody observer might catch it.
   - detect if not on tree/'main page' and do something, at least nothing. i.e. don't try to find, register, exit early.
   - private repos
   - dir sizes
   - total repo size
   - someone said, the table is not always <table> but could be a <div>. I did not observe such situation yet.
 */


// For GM. Should be outside of the isolation function, so using DEBUG will not throw when used before this file.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 );


(() => {
'use strict';

//// experimenting with stopping the script on wrong page
// function isPageWithFiles() {
// var loc = getParsedUriData();
// debugger;
// debugger;

// if (loc.path !== '/') { return false; }
// return true;
// }
// if (!isPageWithFiles()) { return; }

// todo maybe just keep the data in the promise? don't make fileInfoData global?
//      Is having a global worth avoiding repeated await on already resolved Promise?
var fileInfoData, // defined in this main scope, so data will persist until new "page" is detected.
    promFI = null;
injectCSS();


//// -- page loading madness
// When a page loads, either first time by a HTTP request or by recreating the <body> by ReactJS (fake page change),
// shortly after the start the part of a page showing files is removed and re-added. (for no good reason)
// The MAD element on which this happens is different for git root - main page and a page in git path - tree page.
// The reappearance is very fast and not observed by user, but changes made to the file table, as well as added observers
// will not be present on the refreshed partial DOM.
// We can alternatively setTimeout, but we'll not be able to show loading animation and the timeout would have to have
// safe value, and/or be repeated, leading to a delay in showing the injected content and fragmentation during load
// (jumping elements). So it's important to handle the loading madness too.
// This happens so early during real page load, that when DevTools is opened it would slow down this script execution
//  and the madness will not be observed.
// This observer (only one of these two will apply) is needed only once and can be unregistered after one use. But why.
// We can detect which one needs to be applied, if any, by checking window.location, or just querySelector for both cases.
// main git page: if (window.location.pathname.split('/')[3] === undefined) { or [3]/[4] === 'tree/main' and [5] is empty

//// during real - HTTP request page load. on main repo page
// there are 8 [data-target="react-partial.reactRoot"], selector needs .Layout-main
var elTestParentMP = document.querySelector('.Layout-main [data-target="react-partial.reactRoot"]');
if (elTestParentMP) {
	// console.log('[github_add_size_filelist.js] main page observer register');
	watchElUpdate(elTestParentMP, { classPart: 'Box-sc-'}, () => { // alt tagName: 'DIV'
		processPage();
	});
} else { console.error('[github_add_size_filelist.js] no test parent on main page found'); }

//// during real - HTTP request page load. on tree page
// #repo-content-pjax-container is not needed, but finding first element by id is maybe faster?
var elTestParentTP = document.querySelector('#repo-content-pjax-container [data-target="react-app.reactRoot"]');
if (elTestParentTP) {
	// console.log('[github_add_size_filelist.js] tree page observer register');
	watchElUpdate(elTestParentTP, { tagName: 'DIV'}, () => {
		processPage();
	});
}
// regMutationObserver(elTestParent); // to debug what is mutating (external)
processPage();


//// observe fake page load - e.g. from .../tree/..., to main page '' alt. .../tree/main, or the other way around.
// also need to re-add observer as above, as after the fake page load, the madness happens again.
// Again, only one of these, and just for one run is enough, but will try both and just keep them.
watchElUpdate(document.body, { querySelector: 'body > [data-turbo-body]' }, () => {
	console.log('[github_add_size_filelist.js] turbo body re-added observer run');
	promFI = null;
	processPage();

	var elTestParentMP = document.querySelector('.Layout-main [data-target="react-partial.reactRoot"]');
	if (elTestParentMP) {
		watchElUpdate(elTestParentMP, { classPart: 'Box-sc-'}, processPage);
	}
	var elTestParentTP = document.querySelector('#repo-content-pjax-container [data-target="react-app.reactRoot"]');
	if (elTestParentTP) {
		watchElUpdate(elTestParentTP, { tagName: 'DIV'}, processPage);
	}
});


function processPage() {
	const elTable = getTableEl();
	createTHeadColumn(elTable);
	createTBodyColumn(elTable);
	fixFullSpanningRows(elTable);
}

/**
 * Observe an element for child additions, when they match a condition run a handler.
 * @method watchElUpdate
 * @param  {HTMLElement}  elTestParent Observed element
 * @param  {Object}       match        Condition of added child. OR is applied if multiple properties are used.
 *                                     querySelector: a CSS selector query that targets the added element
 *                                     class: full class name
 *                                     classPart: part of a class name. (today crazies add random chars to class names)
 *                                     tagName: UPPERCASE tag name.
 *                                     (add more per need)
 * @param  {function}     handler      Handler function to run.
 * @return {null}                      No return
 */
function watchElUpdate(elTestParent, match, handler) {
	if (DEBUG) { elTestParent.dataset.watchElUpdate = ''; }
	new MutationObserver(mutations => {
		var debugShowTargetOnce = false;
		for (let mut of mutations) {
			for (let node of mut.addedNodes) {
				if (DEBUG) {
					if (!debugShowTargetOnce) {
						console.debug('[github_add_size_filelist.js] *** target:', mut.target);
						debugShowTargetOnce = true;
					}
					console.debug('[github_add_size_filelist.js] ... added node:', node);
				}
				// console.log('[observer] Added:', node);
				if (!node.matches) { continue; } // not HTMLElement (the one below is not needed)
				// if (!(node instanceof HTMLElement)) { continue; } // Processing a #Text node will error
				for (let means in match) {
					switch (means) {
						case 'querySelector':
							if (node.matches(match[means])) { handler(node); }
							break;
						case 'class':
							if (node.classList.contains(match[means])) { handler(node); }
							break;
						case 'classPart':
							if (node.className.includes(match[means])) { handler(node); } // className is String
							break;
						case 'tagName':
							if (node.tagName === match[means]) { handler(node); }
							break;
					}
				}
			}
		}
	})
	.observe(elTestParent, {
		// subtree: true,
		childList: true
	});
}

/*
  Creates a TD in every row <TR> of the table elParent 
 */
function createTBodyColumn(elParent) {
	for (let elTR of elParent.querySelectorAll(':scope .react-directory-row')) {
		createTD(elTR);
	}
	//// register an observer of rows on its parent, tbody
	// for a dir change on GitHub.com, only rows are removed and replaced.
	// This might hopefully cover the case of loading "more items" on demand when the dir is large.
	watchElUpdate(elParent.lastElementChild, {class: 'react-directory-row'}, elTR => {
		createTD(elTR);
	});
}

/*
  Creates a TD cell. Takes neighbor "commit message" TD, clones it, 
 */
async function createTD(elTR) {
	var isLoading;
	if (DEBUG) { console.log('[github_add_size_filelist.js] creating TD on row', elTR); }
	// - get commit TD cell, if page structure did not change, it will have a child element
	const elTDMsg = elTR.getElementsByClassName('react-directory-row-commit-cell')[0];
	if (!elTDMsg || !elTDMsg.firstChild || !elTDMsg.firstChild.classList) { // #text does not have classList
		throw { message: '[github_add_size_filelist.js] can not get TD', obj: elTDMsg }; }
	// if the child element is ".Skeleton", the commit message is loading (and so will the size element)
	// alt: if (elTDMsg.querySelector(':scope > .Skeleton')) { isLoading = true;
	if (elTDMsg.firstChild.classList.contains('Skeleton')) { isLoading = true;
	} else { isLoading = false; }

	// try to get size element, if it exists
	// alt //
	// var elTDSize;
	// for (let el of elTR.children) {
	// 	if (el.classList.contains('react-directory-row-size-cell')) { elTDSize = el; break; }
	// }
	////
	var elTDSize = elTR.getElementsByClassName('react-directory-row-size-cell')[0];

	// if it's already there. if it has the same state (loading/loaded) as msg element, return, if not delete
	if (elTDSize) {
		if ((elTDSize.dataset.loading !== undefined) === isLoading) {
			elTDSize.remove();
		} else {
			if (DEBUG) { console.log('[github_add_size_filelist.js] ... leaving TD as-is. whatever it is.'); }
			return; }
	}

	elTDSize = elTDMsg.cloneNode(true);
	elTDSize.classList.remove('react-directory-row-commit-cell');
	elTDSize.classList.add('react-directory-row-size-cell');
	elTDMsg.after(elTDSize);

	// opt: check if it's already observed (elTDMsg.dataset.observed !== undefined),
	//  but multiple observers on one element are ignored anyways
	// when loading finishes, <div> in <td> is re-added. This new div with real data is naked, but has a child with a class.
	watchElUpdate(elTDMsg, {querySelector: ':has(>.react-directory-commit-message)'}, () => createTD(elTR)); // par. is opt.

	if (isLoading) {
		// async check if have data for this file, preload if not while GitHub row is loading too
		const elA = elTR.getElementsByClassName('Link--primary')[0];
		const fileName = elA.getAttribute('title');
		// preloadFileInfo(fileName);
		void getFileInfo(fileName, true);

		if (DEBUG) { console.log('[github_add_size_filelist.js] ... size TD is cloned with loading animation:', isLoading); }
		return; 
	}

	// construct real size cell (not with loading animation)
	const elDIVSize = document.createElement('div');
	elDIVSize.classList.add('react-directory-row-size');
	elTDSize.replaceChildren(elDIVSize);

	// alt, get file/dir info from fileinfo object
	if (elTR.getElementsByClassName('icon-directory').length) { return; } // it's a dir

	// alt: // const elA = elTR.querySelector(':scope .react-directory-filename-cell a');
	const elA = elTR.getElementsByClassName('Link--primary')[0];
	// alt // const fileName = elA.textContent;
	const fileName = elA.getAttribute('title');
	const fileInfo = await getFileInfo(fileName, false);
	const size = fileInfo.size; // let it error, this thread ends here anyway
	elDIVSize.textContent = (size/1024).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' KB';
	//http://stackoverflow.com/a/17663871/1869660
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#Parameters
}

async function getFileInfo(fileName, preLoad) {
	// will check current URL on each call, as it might be a "new page" (ReactJS changes <body> and mods window.location)
	var fileInfo;
	const uriData = getParsedUriData();
	const apiUri = constructApiUri(uriData);
	// if fileInfoData was already loaded, see if searched file is there and has correct path, delete fileInfoData if not
	if (fileInfoData) {
		fileInfo = fileInfoData.find(entry => entry.name === fileName);
		// check if infoData is from path identical to path of the current url
		if (DEBUG) { console.debug(`[github_add_size_filelist.js] ... fileInfo.path: ${fileInfo?.path}; uriData.path: ${uriData.path}`); }
		if (!fileInfo?.path || !(('/'+fileInfo.path).startsWith(uriData.path))) { console.log('... removed'); fileInfoData = null; promFI = null; }
	}
	if (DEBUG) { console.log(`[github_add_size_filelist.js] ... getFileInfo(); preload: ${preLoad}; getFileInfo loaded: ${!!fileInfoData}`, fileInfoData, 'PromFI:', promFI); }
	// todo: there can be "page change", with pending request promise and still empty fileInfoData,
	//   this will then wait for results of old fiData and will not find a file, or will find namesake from other dir!
	if (!fileInfoData) {
		if (promFI === null || promFI.isRejected) {
			promFI = getFileInfoData(apiUri); // can't chain catch here, as it will not return modded promise obj.
			promFI.catch( e => console.error('e',e));
		}
		fileInfoData = await promFI; // waits for promise created two lines above, or during earlier run of getFileInfo()
		fileInfo = fileInfoData.find(entry => entry.name === fileName);
		if (DEBUG) { console.log(`[github_add_size_filelist.js] fileInfoData written. Path: ${fileInfo?.path}`, fileInfoData); }
	}
	return fileInfo;
}

function getFileInfoData(apiUri) {
	var isResolved = false,
	    isRejected = false,
	    promise = new Promise((resolve, reject) => {
	    if (DEBUG) { console.log('[github_add_size_filelist.js] fetching fileInfoData'); }
		fetch(apiUri)
			.then(response => response.json())
			.then(json => {
				if (Array.isArray(json)) {
					isResolved = true;
					resolve(json);
				} else {
					isRejected = true;
					reject(json);
				}
			})
			.catch(e => { console.error(e); isRejected = true; reject(e); });
	});
	Object.defineProperty(promise, 'isResolved', { get() { return isResolved; } });
	Object.defineProperty(promise, 'isRejected', { get() { return isRejected; } });
	return promise;
}

async function preloadFileInfo(fileName) {

}

function getTableEl() {
	// listChildren(document.body, 3); // debug
	return document.getElementById('folders-and-files').nextElementSibling;
}

// using (commit) Message TH as a template. as it's closest to what's desired for Size
function createTHeadColumn(elParent) {
	const elTHMsg = elParent.querySelector(':scope thead th:nth-last-of-type(2)'); // alt: th.hide-sm
	const elTHSize = elTHMsg.cloneNode(true);
	elTHSize.style.width = '80px';
	elTHSize.style.textAlign = 'right';
	elTHSize.firstElementChild.setAttribute('title', 'Size');
	elTHSize.firstElementChild.firstElementChild.textContent = 'Size';
	elTHMsg.after(elTHSize);
	// console.log('Table parent:', elParent, 'reference TH element (commit message):', elTHMsg, 'new Size TH element:', elTHSize);
}

function injectCSS() {
	const style = document.createElement("style");
	style.textContent = `.react-directory-row-size {
			color: var(--fgColor-muted, var(--color-fg-muted));
			text-align: right;
			white-space: nowrap;
		}`;
	document.head.appendChild(style);
}

// a message parading as a table row on top, optional "View all files" as last row. This would catch any new full-spanning. 
function fixFullSpanningRows(elParent) {
	for (let el of elParent.querySelectorAll('td[colspan="3"]')) {
		el.setAttribute('colspan','4');
	}
}

function constructApiUri(uriData) {
	const {owner, repo, urlType, ref, path} = uriData;
	if (urlType && urlType !== 'tree') { // main page: urlType: ''
		console.error('[github_add_size_filelist.js] not tree or main-page: '+urlType);
		debugger;  // jshint ignore:line 
	}
	//Create the URL to query GitHub's API: https://developer.github.com/v3/repos/contents/#get-contents
	//Example:
	//  https://api.github.com/repos/Sphinxxxx/vanilla-picker/contents/src/css?ref=382231756aac75a49f046ccee1b04263196f9a22
	const apiPath = ['https://api.github.com/repos', owner, repo, 'contents'],
		  apiUri = apiPath.join('/') + path + (ref ? '?ref=' + ref : '');
	if (DEBUG) { console.debug('[github_add_size_filelist.js] apiUri', apiUri); }
	return apiUri;
}

// get API data from uri. from: https://stackoverflow.com/a/38675567/3273963
// also from there, the `toLocaleString` to format size value
//
//Parse the current GitHub repo url. Examples:
//  Repo root:           /Sphinxxxx/vanilla-picker
//  Subfolder:           /Sphinxxxx/vanilla-picker/tree/master/src/css
//  Subfolder at commit: /Sphinxxxx/vanilla-picker/tree/382231756aac75a49f046ccee1b04263196f9a22/src/css
//  Subfolder at tag:    /Sphinxxxx/vanilla-picker/tree/v2.2.0/src/css
//
function getParsedUriData() {
	//If applicable, the name of the commit/branch/tag is always the 4th element in the url path.
	//Here, we put that in the "ref" variable:
	const [/* Leading slash */, owner, repo, urlType, ref, ...pathArr] = window.location.pathname.split('/');
	var path = '/' + pathArr.join('/');
	return {owner, repo, urlType, ref, path};
}

})();

// outside of the IIFE wrapper, if code in IIFE "return"-s, this will be still shown
if (DEBUG) { console.log('[github_add_size_filelist.js]: ENDED'); }
