/* jshint esversion: 6 */ /* jshint module: true */ /* jshint browser: true */
/* jshint devel: true */ /* jshint debug: true */ /* global DEBUG */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////  CPControl.js  ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// v2.1
//
// Description is in CPPanel.js
//
//
// todo: This class was intended to work without CPPanel, but that was never tested yet and it most likely will not work as is.
//
// usage:
//   var cp = new CPControl('checkbox', 'force max quality video', state => { if (state) { hijackXHROpen(true); } else { hijackXHROpen(false); } });
//   var statusCur = cp.status;
//
// this currently does not apply
// simple use:  var myOption = new CPControl('DESCRIPTION').show();
// later to get or set control value: `myOption.value`

// Storage
// Current user values are stored in instances of CPControl class. Along with handlers to run when a value change.
// CPControl can be extended (as here below), with e.g. localStorage. Then values will be stored there.
// or independent class, e.g. Options could be used, is such case set CPControl.getterValue, setterValue to its appropriate methods
//   e.g. CPControl.getterValue = function (foo) { return foo + ' bar'; };

// todo:
// - unRealizeValue not available on construction
//   As it is added to already existing instance in next step. How to handle this problem.
//   Can't just add stored value to element during construction, they may not be compatible with the element,
//     or maybe even somehow get saved with realizeValue and so "realized" twice.
//   - that's how it is now, as in my use cases it does not matter.
//   - using a variable 'shownFirstTime'. Run updatePanelValues when Panel is shown first time.
//     But a Panel can be already shown and control is only added later in the code.
//   - instead of adding it directly: `optX.unRealizeValue = () => {}` add it in a wrapper: `optX.addUnRealizer(handlerFunction)`, which would unRealize the value. OK, but is there something better?
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * callback: must use {} in handler, or else "state" is returned (not desired 'undefined') 
 */
class CPControl {

/* jshint ignore:start */ /* browsers support instance vars, but JShint does not know them */
elInput;  // needed to be able to assign value. Elements has it too, but as a child on unstable location.
elLabel;  // todo: remove. not needed.
elements;
type;
strMessage;
strValueName;
idPanel;
panel;
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
static panels = {}; // v2 todo remove
//static strict = true;      // true: no checks, more difficult to debug; false: check and tries to fix

static cssHidden = `
	.cp-hidden.cp-hidden {
		display: none;
	}
`;
/* jshint ignore:end */

// only type, strMessage are not optional

/**
 * [constructor description]
 * @method constructor
 * @param  {[type]}                       type           [description]
 * @param  {[type]}                       strMessage     [description]
 * @param  {[type]}                       defaultValue   [description]
 * @param  {[type]}                       callBack       [description]
 * @param  {[type]}                       strValueName   Internal name of the control. no: " ", '"', "\", new lines ...
 * @param  {[type]}                       typePanel      [description]
 * @param  {null|HTMLElement|function}    injectionPoint null: BODY, function: injection method
 * @param  {Number}                       idPanel        [description]
 * @return {[type]}                                      [description]
 */
constructor(strMessage, type, panel, defaultValue, callBack, strValueName, typePanel, injectionPoint) {
	var elStatusCtrInput;
	this.type = type;
	this.strMessage = strMessage;
	this.valueDefault = defaultValue; // undefined will be later cast to false
	this.callBack = callBack;
	this.id = CPControl.items.push(this) - 1;

	this.strValueName = strValueName;
	if (!strValueName) {
		// debugger;
		let strVNfull = strMessage.replaceAll(' ','').replaceAll('"','').replaceAll('\\','').replaceAll('\n','').replaceAll('\t','');
		let i = 6; // just because 6 seems reasonable
		if (i > strVNfull.length) { i = strVNfull.length; } // msg is shorter than 6
		do {
			if (i > strVNfull.length) { this.strValueName = strVNfull + this.id; break; }
			// if (i > strVNfull.length) { throw "[CPControl] Can't get unique ValueName for control: " + strMessage + ' '; }
			this.strValueName = strVNfull.substr(0,i++);
		} while (CPControl.itemsByName[this.strValueName]);
	}
	// no. we don't need it to be parse-able now
	// try { JSON.parse('{"'+this.strValueName+'": "0"}'); } catch (e) { throw '[CPControl] ValueName: ' + this.strValueName + ' is not valid'; }
	CPControl.itemsByName[this.strValueName] = this;

	if (!panel) {
		panel = new CPPanel(injectionPoint, typePanel);
	}
	this.panel = panel;

	CPControl.init();


	switch (type) {
	 	case 'checkbox':
	 		panel.addControlInstance(this.createCheckbox());
	 		break;
	 	case 'button':
	 		panel.addControlInstance(this.createButton());
	 		break;
 		case 'text':
	 		panel.addControlInstance(this.createTextElement());
 			break;
		case 'paragraph':
			panel.addControlInstance(this.createParagraphElement());
			break;
	 	default:
	 		// statements_def
	 		break;
	 }
}


createCheckboxElement() {
}

// todo 2512 add realState as a separate method. this checkbox will be created without
//           and the realState could be added to any? or at least to a paragraph too
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

	return this;
} // END createCheckbox


createButton() {
	this.element = document.createElement('BUTTON');
	// this.element.type = '';
	this.element.innerHTML = this.strMessage;
	this.element.onclick = () => {
		this.callBack();
	};
	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(this.element);
	this.elements = [this.elWrapper];
	return this;
} // END createButton


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

	return this;
} // END createTextElement


createParagraphElement() {
	this.elP = document.createElement('P');
	this.elP.id = this.strValueName;
	this.elP.innerHTML = this.strMessage;

	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(this.elP);

	this.elements = [this.elWrapper];

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
	if (CPControl.getterValue) { return CPControl.getterValue(this.strValueName); }
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
	if (CPControl.setterValue) { CPControl.setterValue(this.strValueName, value); }
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

//todo, test 
show() {
	this.panel.show();
}
hide() {
	this.panel.hide();
}


//// static

static init() {
	if (this.isInit) { return; }
	// inin init() because only one is needed for all Panels
	// todo 2512 this is twice, CPPanel has already injected it. also I don't understand now why specificity 2
	this.addCSS(this.cssHidden);
	this.isInit = true;
}
static addCSS(css) {
	const elStyle = document.createElement('style');
	elStyle.textContent = css;
	document.head.appendChild(elStyle); // todo should find correct head
}




static addCheckBox(args) {
	return new CPControl('checkbox', ...args);
}

} // END class CPControl


/////////////////////////////////////////////////  CPControlWithLocalStorage  //////////////////////////////////////

// always get value from localStorage, as it can be changed in another Tab.
// note: localStorage listener (if I'll use it here one day) does not fire when value is changed on the same tab
class CPControlWithLocalStorage extends CPControl {

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
