/* jshint esversion: 6 */ /* jshint module: true */ /* jshint browser: true */
/* jshint devel: true */ /* jshint debug: true */ /* global DEBUG */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////  ControlPanel.js  //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// v1.2
//
// ControlPanel (CP) module can draw HTML panels with controls. Input fields, or buttons.
// Each instance represents one control in one, or multiple Panels. Current value is exposed and handlers for value change,
// sanations are available.
//
// Can be also used as an Option storage for smaller projects. Extension for localStorage is here below CP class. Others are planned.
// In such case, CP must be initiated and all its items created at start time (it can stay hidden).
// Otherwise Panel can be created on-demand, e.g. when Options menu is requested.
//
// Panel can be used as a permanently shown object. ControlPanel class must in such case always update elements state based
// on current value. In case a separate class is used for Options, it should call either updatePanelValues on a panel always or when such panel is being shown, or updateValue (not currently implemented) on a value.
//
// Panel can't be shown during construction. Panel method `show` must be used. This is because values could have external methods added after the construction. e.g. sanateValue.
//
//
// usage:
// old: var statusCur = statusWin('LABEL', state => { if (state) { DO_WHEN_ON(true); } else { DO_WHEN_OFF(false); } });
// new: var cp = new ControlPanel('checkbox', 'force max quality video', state => { if (state) { hijackXHROpen(true); } else { hijackXHROpen(false); } });
//      var statusCur = cp.status;

// Storage
// Values are stored in instances of ControlPanel class.
// ControlPanel can be extended (as here below), with e.g. localStorage. Then values will be stored there.
// or independent class, e.g. Options could be used, is such case set ControlPanel.getterValue, setterValue to its appropriate methods
//   e.g. ControlPanel.getterValue = function (foo) { return foo + ' bar'; };

// todo:
// - unRealizeValue not available on construction
//   As it is added to already existing instance in next step. How to handle this problem.
//   Can't just add stored value to element during construction, they may not be compatible with the element,
//     or maybe even somehow get saved with realizeValue and so "realized" twice.
//   - that's how it is now, as in my use cases it does not matter.
//   - using a variable 'shownFirstTime'. Run updatePanelValues when Panel is shown first time.
//     But a Panel can be already shown and control is only added later in the code.
//   - instead of adding it directly: `optX.unRealizeValue = () => {}` add it in a wrapper: `optX.addUnRealizer(handlerFunction)`, which would unRealize the value. OK, but is there something better?
//
// used in (my ref): keepalive.js, socnet.js, similar already made in class Panel, in IMDb-Enhanced\content_scripts\imdb-enhanced-links.js, I should join them here.

/**
 * callback: must use {} in handler, or else "state" is returned (not desired 'undefined') 
 */
class ControlPanel {

/* jshint ignore:start */ /* browsers support instance vars, but JShint does not know them */
elInput;  // needed to be able to assign value. Elements has it too, but as a child on unstable location.
elLabel;  // todo: remove. not needed.
elements;
type;
strMessage;
strValueName;
idPanel;
valueDefault;
// must not define those here, which are defined as methods below. (as undefined from this line will be used instead of method from a prototype)
// sanateInput;  // method. check/fix bad input, such which would break realizeValue()
// sanateValue;  // method. check/fix bad input. Out of range, not allowed values.
//realizeValue; // method. convert user readable/writable value to a real one, usable in the program.
//unRealizeValue; // method. reverse --"--. must be present when realizeValue is used
callBack;     // method. does not check value, but acts on it, if program needs an immediate action. e.g. it's a button - command

// Private Properties. (#<varname> not supported yet in browsers)
_value; // or should always get value from storage if storage is used?
_realState; // 2501 this should just be a getter, calling getRealValue(), queryProgramvalue, or something like that
_realStateShow;

static isInit = false;
static items = [];
static itemsByName = {};
static getterValue = null; // can be set to e.g. a method of another class to get value from e.g. class Options
static setterValue = null; // --"--
static panels = {};
static cssPanel = {
	Options: `
	.cp-options {
		all: revert;
		position: fixed;
		right: 5px;
		top: 5px;
		color: white;
		font-family: sans-serif;
		border-width: 0px;
		border-radius: 5px;
		background-color: gray;
		/* opacity: 0.5; */
		padding: initial;
		padding-left: 5px;
		z-index: 99999;
		font-size: initial;
		line-height: initial;

		* {
			all: revert;
		}
		label {
			padding-right: 10px;
		}
		input[type="checkbox"] {
			margin: 3px;
		}
		p {
			
		}
	}
`
};
static cssHidden = `
	.cp-hidden.cp-hidden {
		display: none;
	}
`;
/* jshint ignore:end */

// only type, strMessage are not optional
constructor(type, strMessage, defaultValue, callBack, strValueName, typePanel, idPanel = 0) {
	var elStatusCtrInput;
	this.type = type;
	this.strMessage = strMessage;
	this.valueDefault = defaultValue; // undefined will be later cast to false
	this.callBack = callBack;
	this.idPanel = idPanel;
	this.strValueName = strValueName;
	if (!strValueName) {
		// debugger;
		let strVNfull = strMessage.replaceAll(' ','').replaceAll('"','').replaceAll('\\','').replaceAll('\n','').replaceAll('\t','');
		let i = 6;
		if (i > strVNfull.length) { i = strVNfull.length; }
		do {
			if (i > strVNfull.length) { throw "[ControlPanel] Can't get unique ValueName for control: " + strMessage + ' '; }
			this.strValueName = strVNfull.substr(0,i++);
		} while (ControlPanel.itemsByName[this.strValueName]);
	}
	// no. we don't need it to be parse-able now
	// try { JSON.parse('{"'+this.strValueName+'": "0"}'); } catch (e) { throw '[ControlPanel] ValueName: ' + this.strValueName + ' is not valid'; }
	ControlPanel.init();

	if (!ControlPanel.panels[idPanel]) {
		ControlPanel.panels[idPanel] = ControlPanel.createPanel(idPanel, typePanel);
	}
	switch (type) {
	 	case 'checkbox':
	 		ControlPanel.panels[idPanel].addItem(this.createCheckbox());
	 		break;
 		case 'text':
	 		ControlPanel.panels[idPanel].addItem(this.createTextElement());
 			break;
		case 'paragraph':
			ControlPanel.panels[idPanel].addItem(this.createParagraphElement());
			break;
	 	default:
	 		// statements_def
	 		break;
	 }
	// ControlPanel.items.push(this);
	ControlPanel.itemsByName[this.strValueName] = this;
}


createCheckboxElement() {
}

createCheckbox() {
	// todo: based on something, enable showing of realState bullet
	this._realStateShow = true;


	this.elInput = document.createElement('INPUT');
	this.elInput.type = 'checkbox';
	this.elInput.id = 'statusCtr';
	this.elInput.name = 'statusCtr';

	this.elLabel = document.createElement('LABEL');
	// this.elLabel.type = 'label';
	this.elLabel.htmlFor = "statusCtr";
	this.elLabel.innerHTML = this.fillRealState() + this.strMessage;

	this.elInput.onclick = () => {
		// check if "false". if callback has no return statement, undefined is returned.
		// "false" is returned when callback function say it can't change the value, so the checkbox is returned to previous state
		// the callback function can't be shortened to e.g. `state => myvar = state` without "{}", as it would return "state" value
		if (this.elInput.checked) { // "checked" value represents new state, HTML added check-mark and changed 'checked'
			if (!this.callBack || this.callBack(true) !== false) { this.value = true;
			} else { this.elInput.checked = false; }
		} else {
			if (!this.callBack || this.callBack(false) !== false) { this.value = false;
			} else { this.elInput.checked = true; }
		}
	};

	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(this.elLabel);
	this.elWrapper.appendChild(this.elInput);

	// this.elements = [this.elLabel, this.elInput];
	this.elements = [this.elWrapper];

	this.elInput.checked = this.value;

	ControlPanel.items.push(this);
	return this;
} // END createCheckbox


createTextElement() {
	this.elInput = document.createElement('INPUT');
	this.elInput.type = 'text';
	this.elInput.id = this.strValueName;
	this.elInput.name = this.strValueName;
	this.elInput.placeholder = 'enter text';

	this.elLabel = document.createElement('LABEL');
	// this.elLabel.type = 'label';
	this.elLabel.htmlFor = this.strValueName;
	this.elLabel.innerHTML = this.strMessage;


	this.elInput.addEventListener('change', (event) => {
		console.log('Event: change', event);
		var tmpValue = this.elInput.value;
		// debugger;
		if (this.sanateInput) {
			tmpValue = this.sanateInput(tmpValue);
			if (tmpValue === null) { return; } // todo: wrong user input. paint input red. maybe run some errorCallback
		}
		if (this.realizeValue) {
			tmpValue = this.realizeValue(tmpValue);
			if (tmpValue === null) { return; } // todo: --"--
		}
		if (this.sanateValue) {
			tmpValue = this.sanateValue(tmpValue);
			if (tmpValue === null) { return; } // todo: --"--
		}
		if (this.callBack && this.callBack(tmpValue) === false) { return; } // todo: --"--

		this.value = tmpValue;
	});

	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(this.elLabel);
	this.elWrapper.appendChild(this.elInput);

	// this.elements = [this.elLabel, this.elInput];
	this.elements = [this.elWrapper];

	// todo this is wrong. value must be assigned when the panel is shown, not created,
	// also, unRealizeValue is not available during instance creation
	// Maybe allow this.unRealizeValue be undefined and then check `if(this.unRealizeValue)` here
	// also read Note on top
	this.elInput.value = this.unRealizeValue(this.value);

	ControlPanel.items.push(this);
	return this;
} // END createTextElement


createParagraphElement() {
	this.elP = document.createElement('P');
	this.elP.id = this.strValueName;
	this.elP.innerHTML = this.strMessage;

	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(this.elP);

	this.elements = [this.elWrapper];

	ControlPanel.items.push(this);
	return this;
}


// '&#x2022; '  // big: '&#x2B24; '
fillRealState() {
	if (!this._realStateShow) { return ''; }
	if (this._realState) {
		return '<span style="color: green;">&#x2022;&nbsp</span>';
	} else {
		return '<span style="color: red;">&#x2022;&nbsp</span>';
	}
}

get value() {
	if (ControlPanel.getterValue) { return ControlPanel.getterValue(this.strValueName); }
	return this._value;
}

  get status() { // remove, only `get value`
	switch (this.type) {
	 	case 'checkbox':
	 		return this.elInput.checked;
	 	default:
	 		// statements_def
	 		break;
	 }
  }

	get realState() { return this._realState; } // jshint ignore:line
	set realState(value) {
		this._realState = value;
		this.elLabel.innerHTML = this.fillRealState() + this.strMessage;
	}


set value(value) {
	this._value = value;
	if (ControlPanel.setterValue) { ControlPanel.setterValue(this.strValueName, value); }
	// debugger;
	switch (this.type) {
		case 'checkbox':
			this.elInput.checked = value;
			break;
		case 'text':
			// debugger;
			this.elInput.value = this.unRealizeValue(value);
			break;
	}
}


// sanateValue() {

// }
realizeValue(value) {
	return value;
}
unRealizeValue(value) {
	return value;
}

//// static

static init() {
	if (this.isInit) { return; }
	// inin init() because only one is needed for all Panels
	this.addCSS(this.cssHidden);
	this.isInit = true;
}
static addCSS(css) {
	const elStyle = document.createElement('style');
	elStyle.textContent = css;
	document.head.appendChild(elStyle); // todo should find correct head
}

static createPanel(id, type = 'Options') {
	var elPanel = document.createElement('DIV');
	this.addCSS(this.cssPanel[type]);
	elPanel.classList.add('cp-options');
	elPanel.classList.add('cp-hidden');

	//// adding to DOM
	// if (document.body) {
	// 	document.body.appendChild(elPanel);
	// } else {
	// 	document.head.parentElement.insertBefore(elPanel, document.head.nextSibling);
	// }

	// a page could have a frameset instead of <body>, then document.body would target the frameset
	switch (document.body.tagName.toUpperCase()) {
		case 'BODY':
			document.body.appendChild(elPanel);
			break;
		case 'FRAMESET':
			document.body.parentElement.insertBefore(elPanel, document.body);
			break;
		default:
			// statements_def
			break;
	}

	//// del
	// function show(obj) {
	// 	elPanel.classList.remove('cp-hidden'); obj.hidden = false;
	// }
	// function hide(obj) {
	// 	elPanel.classList.add('cp-hidden'); obj.hidden = true;
	// }

	// can't use arrow function where `this` value, as this return object, is required
	// todo: test: are closure vars, `id`, `elPanel` from the `this` Panel, or must use this.id, this.element
	return {
		id: id,
		element: elPanel,
		items: [],

		//// bad: `this` is ControlPanel. because in `()=>{}` `this` from time of running `createPanel()` is used,
		////      within `function() {}`, `this` is parent of called object (as desired).
		// show: () => { elPanel.classList.remove('cp-hidden'); this.hidden = false; },
		// show: () => { ((obj) => { elPanel.classList.remove('cp-hidden'); obj.hidden = false; })(this) },
		// show: () => { return ((obj) => { elPanel.classList.remove('cp-hidden'); obj.hidden = false; })(this) },
		//// runs during executing of `createPanel()`
		// show: ((obj) => { elPanel.classList.remove('cp-hidden'); obj.hidden = false; })(this),
		//// OK
		// show: function () { return show(this); },

		// show: function () { return (panel => {
		// 	debugger;
		// 	this.updatePanelValues();
		// 	elPanel.classList.remove('cp-hidden');
		// 	panel.hidden = false;
		// })(this); },
		show: function () {
			// for now, we don't need to: if (!this.hidden) { return; }
			this.updatePanelValues();
			elPanel.classList.remove('cp-hidden');
			this.hidden = false;
		},    // todo: check panel.hidden, don;t add another class cp-hidden if this is called twice
		hide: function () {
			if (this.hidden) { return; }
			elPanel.classList.add('cp-hidden');
			this.hidden = true;
		},
		hidden: true,
		addItem: function (instance) {
			this.items.push(instance);
			for (let el of instance.elements) {
				elPanel.appendChild(el);
			}
		},

		// todo: this should be called if values could be modified externally and panel is shown.
		//  e.g. listener on localStorage for updates on other Tabs

		// strValueName: optional, if undefined, all values are updated
		updatePanelValues: function(strValueName) {
			this.items.some(item => {
				if (!strValueName || item.strValueName === strValueName) {
					// not good, e.g. checkbox needs `.checked`  item.elInput.value = item.unRealizeValue(item.value);
					// it looks silly, but it's a getter which can get value from a Storage and setter, which can set it in an element
					item.value = item.value;
					if (strValueName) { return true; } // to end some()
				}
			});
		}
	}; // END return
}




static addCheckBox(args) {
	return new ControlPanel('checkbox', ...args);
}

} // END class ControlPanel


/////////////////////////////////////////////////  ControlPanelWithLocalStorage  //////////////////////////////////////

// always get value from localStorage, as it can be changed in another Tab.
// note: localStorage listener (if I'll use it here one day) does not fire when value is changed on the same tab
class ControlPanelWithLocalStorage extends ControlPanel {

constructor(...args) {
	super(...args);
}

get value() {
	switch (this.type) {
		case 'checkbox':
			switch (localStorage.getItem(this.strValueName)) {
				case null: // first-time use
					// return this.valueDefault !== undefined ? this.valueDefault : false; // `false`, as checkbox does not understand `undefined`
					return !!this.valueDefault; // or to just cast any value to true and false|null|undefined to false
				case 'ON':
				case 'TRUE':
				case 'true':
				case '1':
					return true;
				case 'OFF':
				case 'FALSE':
				case 'false':
				case '0':
					return false;
				default:
					return null;
			}
			break;
		case 'text':
		// debugger;
			let val = localStorage.getItem(this.strValueName);
			if (val === null) { // first-time use
				if (this.valueDefault === undefined) { return '';
				} else { return this.valueDefault; }
			}
			try {
				val = JSON.parse(val);
			} catch (e) { }
			return val;
	}
}

set value(value) {
	// debugger;
	super.value = value;
	// without stringify, it will deserialize objects, but using `value.toString()`: [a,b,c,d] -> 'a,b,c,d', not '["a","b","c","d"]'
	// localStorage.setItem(this.strValueName, value);
	// and just stringify all, will add to a String: '"a,b,c"'.
	// This will stringify also boolean. should we care?
	if (typeof value !== 'string' && !(value instanceof String)) { value = JSON.stringify(value); }

	localStorage.setItem(this.strValueName, value);

	// debugger;

	// test
	// localStorage.setItem('testB', JSON.stringify(value));
	// var testA = localStorage.getItem(this.strValueName);
	// var testB = localStorage.getItem('testB');
	// debugger;
	// debugger;


	return;

	// unused now
	switch (value) {
		case true:
			localStorage.setItem(this.strValueName, 'true');
			break;
		case false:
			localStorage.setItem(this.strValueName, 'false');
			break;
		// case null:
		case undefined:
			localStorage.removeItem(this.strValueName);
			break;
		default:
	}
}

}
