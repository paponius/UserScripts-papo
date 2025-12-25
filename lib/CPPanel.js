/* jshint esversion: 6 */ /* jshint module: true */ /* jshint browser: true */
/* jshint devel: true */ /* jshint debug: true */ /* global DEBUG */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  CPPanel.js  ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// v2.1
//
// ControlPanel (CP) creates HTML panels with controls and/or passive html elements. (Input fields, checkboxes, buttons, paragraphs, images).
// The project started as Control Panel to create an Options page, but it can be used to show an information popup.
//
// This project consists of tho classes, CPPanel and CPControl. CPControl can be extended with CPControlWithLocalStorage to keep controls saved.
// (in version 1, this project was called ControlPanel and was in one js file)
// Each instance of CPControl represents one control/passive element. The same instance can be used on multiple Panels.
//
// Different uses
// Panels can be created and used by solely interacting with CPPanel. CPControl class is still required but used only by CPPanel.
//
// In original intend was that CPControl can be used without CPPanel, but that was not yet tested and fully implemented.
// The idea was that control elements are injected into suitable element already present in DOM. e.g. To add a simple checkbox or button.
//
//
// Usage of CPPanel:
//   var panel = new CPPanel(el);
//   var cpText = new CPControl('DESCRIPTION', panel);
//   panel.show();
// or
//   var panel = new CPPanel(el).show();
//   panel.addControl('DESCRIPTION'); (not yet implemented)
//
//   When Panel or Control is permanently shown on a page, CPControl class must keep updating elements state based on current value.
//   In case a separate class is used for Options, it should call either updatePanelValues on a panel always or when such panel is being shown, or updateValue (not currently implemented) on a value. Currently there is no listener on localStorage, but it's planned.
//
// Panel can't be shown during construction. Panel method `show` must be used. This is because values could have external methods added after the construction. e.g. sanateValue.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class CPPanel {
/* jshint ignore:start */ /* browsers support instance vars, but JShint does not know them */
id;
element;
controls = [];
hidden;
static items = [];
static cssPanelInjected = [];

static css = {
	basic: `.cp-hidden { display: none; }`,
	hookedOnBody: `.cp-hooked-on-body.cp-hooked-on-body {
			position: fixed;
			right: 5px;
			* {
				all: revert;
			}
		}`
}

static cssOpenButtonType = {
	basic: `:where(.cp-open-button-basic) {
			all: revert;
			/* width: 50px; */
		}
		:where(.cp-panel) {
			all: revert;
		}
		.cp-panel {
			position: relative;
			top: -12px;
			color: white;
			fill: currentColor;
			z-index: 1;
			font-family: sans-serif;
		}`};

static cssPanelType = {
	options: `
	.cp-options {
		position: relative;
		width: 0;
		height: 0;
	}
	/* most or all of these should probably be moved above */
	.cp-options > div {
		white-space: nowrap;
		position: absolute;
		left: 50px;
		top: 5px;
		border-width: 0px;
		border-radius: 5px;
		background-color: gray;
		/* opacity: 0.5; */
		padding: initial;
		padding-left: 5px;
		z-index: 99999;
		font-size: initial;
		line-height: initial;

		
		label {
			padding-right: 10px;
		}
		input[type="checkbox"] {
			margin: 3px;
		}
		p {
			
		}
	}
`,
	infopanel: `
		.cp-infopanel {
			background: #1f1000;
			border: 1px solid #502900;
			box-shadow: 0 2px 4px rgba(23, 23, 23, 0.6);
			width: 578px;
			padding-left: 39px;
			padding-right: 7px;
		}
`
};
/* jshint ignore:end */

/**
 *
 * @param {null|HTMLElement|function}  elParent    Where to inject Panel element.
 * @param {String}                     typePanel   Name of CSS class to use with this Panel.
 * @param {null|true|String}           openButton  If a button is used to open this panel, optionally the CSS class name for it.
 * @returns this
 */
constructor(elParent = null, typePanel = 'options', openButton) {
	var elPanel = document.createElement('DIV');
	CPPanel.addCSS(CPPanel.css['basic']);
	CPPanel.addCSS(CPPanel.cssPanelType[typePanel]);
	elPanel.classList.add('cp-panel');
	elPanel.classList.add('cp-' + typePanel);
	elPanel.classList.add('cp-hidden');

	/// close button
	var elCloseBtn = document.createElement('DIV');
	// copied from a dialog on a Google result page
	elCloseBtn.innerHTML = `<span style="position:absolute; left:11px; top:13px; width:20px; height:20px;">
		<svg focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></span>`;
	elPanel.appendChild(elCloseBtn);
	elCloseBtn.addEventListener('click', () => this.hide());

	switch (true) {
		case elParent === null:
			this.injectTop(elPanel);
			break;
		case elParent instanceof HTMLElement:
			elParent.appendChild(elPanel);
			break;
		case elParent instanceof Function:
			elParent(elPanel);
			break;
		default:
			throw '[CPControl] wrong elParent';
	}

	this.element = elPanel;
	this.elParent = elParent;

	this.id = CPPanel.items.push(this) - 1;
	// just testing. is assigning instances directly into class good method?
	CPPanel[this.id] = this;
	elPanel.setAttribute('data-id', this.id);

	// element = elPanel;
	this.hidden = true;

	// open button
	if (openButton) {
		this.createOpenButton(openButton);
	}


	return this;
}

createOpenButton(openButton) {
	if (openButton === true) { openButton = 'basic'; }
	var elOpenButton = document.createElement('BUTTON');
	// todo which to use
	// elOpenButton.textContent = 'Enh';
	elOpenButton.innerHTML = 'Enh';
	CPPanel.addCSS(CPPanel.cssOpenButtonType[openButton]);
	elOpenButton.classList.add('cp-open-button-' + openButton);
	elOpenButton.addEventListener('click', event => {
		if (this.hidden) { this.show();
		} else { this.hide(); }
	});

	this.elParent.appendChild(elOpenButton);
	this.elOpenButton = elOpenButton
}

show() {
	// for now, no need to: if (!this.hidden) { return; }
	this.updatePanelValues();
	this.element.classList.remove('cp-hidden');
	if (this.elOpenButton) { this.elOpenButton.classList.add('cp-hidden'); }
	this.hidden = false;
}

hide() {
	if (this.hidden) { return; }
	this.element.classList.add('cp-hidden');
	if (this.elOpenButton) { this.elOpenButton.classList.remove('cp-hidden'); }
	this.hidden = true;
}

addControlInstance(control) {
	this.controls.push(control);
	for (let el of control.elements) {
		this.element.appendChild(el);
	}
}

addItem(strMessage, type, defaultValue, callBack, strValueName) {
	//            strMessage, type, panel, defaultValue, callBack, strValueName
	new CPControl(strMessage, type, this, defaultValue, callBack, strValueName);
}


// todo: this should be called if values could be modified externally and panel is shown.
//  e.g. listener on localStorage for updates on other Tabs

// strValueName: optional, if undefined, all values are updated
updatePanelValues(strValueName) {
	this.controls.some(item => {
		if (!strValueName || item.strValueName === strValueName) {
			// not good, e.g. checkbox needs `.checked`  item.elInput.value = item.unRealizeValue(item.value);

			// it looks silly, but it's a getter which can get value from a Storage and setter, which can set it in an element
			item.value = item.value;
			if (strValueName) { return true; } // to end some()
		}
	});
}

// find suitable location and inject. when elParent is not specified in createPanel
injectTop(element) {
	// if (document.body) {
	// 	document.body.appendChild(elPanel);
	// } else {
	// 	document.head.parentElement.insertBefore(elPanel, document.head.nextSibling);
	// }

	// a page could have a frameset instead of <body>, then document.body would target the frameset
	switch (document.body.tagName.toUpperCase()) {
		case 'BODY':
			document.body.appendChild(element);
			break;
		case 'FRAMESET':
			document.body.parentElement.insertBefore(element, document.body);
			break;
		default:
			console.error('[CPControl] unknown page structure');
			debugger;  // jshint ignore:line
			break;
	}
	CPPanel.addCSS(CPPanel.css['hookedOnBody']);
	element.classList.add('cp-hooked-on-body');
}


//// static

static create(elParent = null, typePanel = 'options', openButton) {
	return new this(elParent, typePanel, openButton);
}

static addCSS(css) {
	if (this.cssPanelInjected.includes(css)) { return; }
	const elStyle = document.createElement('style');
	elStyle.textContent = css;
	elStyle.setAttribute('cp-panel', '');
	document.head.appendChild(elStyle); // todo should find correct head
	this.cssPanelInjected.push(css);
}
} // END class
