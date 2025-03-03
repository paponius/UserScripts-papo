/* 
  A bit lazy - using a delay, as this does not need to apply immediately after page change.
  There is a lot of re-adding done specially on Issue page, on various parent elements.
  setTimeout 1s turned out to be too long when clicking too fast. Hopefully 500ms is fine.
  Tried to catch all possible DOM changes and gave up to apply the delay instead.
 */

// when opened directly on url: .../issues/new
setTimeout(processPage, 1000);

// when coming from a very different GitHub page, whole BODY content is replaced,
// also need to register elTestParentTP on each fake "page change"
watchElUpdate(document.body, { querySelector: 'body > [data-turbo-body]' }, () => {
	console.log('[github_warn_leaving_edits.js] observer fired: turbo body re-added');
	// in case ReactJS decides to remove [data-turbo-body] again after once loaded, which it does just for fun sometimes
	setTimeout(processPage, 500);

/*
	const elTestParentDataTurboBody = document.querySelector('body > [data-turbo-body]');
	console.log('[github_warn_leaving_edits.js] trying to find [data-turbo-body]');
	if (elTestParentDataTurboBody) {
		console.log('[github_warn_leaving_edits.js] ... registering');
		watchElUpdate(elTestParentDataTurboBody, { class: 'application-main' }, () => {
			processPage();

			const elTestParentReactApp = document.querySelector('react-app');
			console.log('[github_warn_leaving_edits.js] trying to find react-app');
			if (elTestParentReactApp) {
				console.log('[github_warn_leaving_edits.js] ... registering');
				watchElUpdate(elTestParentReactApp, { querySelector: '[data-target="react-app.reactRoot"]'}, processPage);
			}

			const elTestParentTP = document.querySelector('[data-target="react-app.reactRoot"]');
			console.log('[github_warn_leaving_edits.js] trying to find react-app.reactRoot');
			if (elTestParentTP) {
				console.log('[github_warn_leaving_edits.js] ... registering');
				watchElUpdate(elTestParentTP, { classPart: 'IssueCreatePage-module__createPane--'}, processPage);
			}

		});
	}
*/
// 
	// when coming from a page with top part common with Issue app. e.g. from repo root (repo-content-turbo-frame stays)
	setTimeout( () => {
		const elTestParentTP = document.querySelector('#repo-content-turbo-frame'); // todo change to get by ID
		console.log('[github_warn_leaving_edits.js] trying to find repo-content-turbo-frame');
		if (elTestParentTP) {
			console.log('[github_warn_leaving_edits.js] ... registering');
			watchElUpdate(elTestParentTP, { querySelector: '[app-name="issues-react"]'}, () => {
				processPage();
				setTimeout( () => {
					const elTestParent = document.querySelector('[data-target="react-app.reactRoot"]');
					console.log('[github_warn_leaving_edits.js] trying to find react-app.reactRoot C');
					if (elTestParent) {
						console.log('[github_warn_leaving_edits.js] ... registering');
						watchElUpdate(elTestParent, { classPart: 'IssueCreatePage-module__createPane--'}, processPage);
					}
				}, 500);
			});
		}
	}, 500);

	setTimeout( () => {
		const elTestParentTP = document.querySelector('[data-target="react-app.reactRoot"]');
		console.log('[github_warn_leaving_edits.js] trying to find react-app.reactRoot A');
		if (elTestParentTP) {
			console.log('[github_warn_leaving_edits.js] ... registering');
			watchElUpdate(elTestParentTP, { classPart: 'IssueCreatePage-module__createPane--'}, processPage);
		}
	}, 500);
});

// when coming from url: ".../issues", only a child to [data-target="react-app.reactRoot"] element is added
setTimeout( () => {
	const elTestParentTP = document.querySelector('[data-target="react-app.reactRoot"]');
	console.log('[github_warn_leaving_edits.js] trying to find react-app.reactRoot B');
	if (elTestParentTP) {
		console.log('[github_warn_leaving_edits.js] ... registering');
		watchElUpdate(elTestParentTP, { classPart: 'IssueCreatePage-module__createPane--'}, processPage);
	}
}, 500);

function processPage() {
	    const titleSelector = 'input[class*="TextInput"]';
    const commentSelector = 'textarea[class*="Textarea"]';
          const titleField = document.querySelector(titleSelector);
        const commentField = document.querySelector(commentSelector);
		console.log('[github_warn_leaving_edits.js] field present:',titleField, commentField);

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
		if (DEBUG) {
			if (mutations.length && mutations[0].addedNodes.length) {
			}
		}
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
