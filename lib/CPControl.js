/* jshint module: true */
/* global DEBUG, LOG */
/* globals CPPanel */

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
// Separate external method of storing can be used by overriding CPControl.getterValue, setterValue to other methods.
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
// - to work without CPPanel. see stub method injectToDoc
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * callback: must use {} in handler, or else "state" is returned (not desired 'undefined') 
 */
class CPControl {

/* jshint ignore:start */ /* browsers support instance vars, but JShint does not know them */
elInput;  // needed to be able to assign value. Elements has it too, but as a child on unstable location.
elLabel;       // now used for status of checkbox with status, but it will be removed later
elWrapper;     // [HTMLElement] todo, remove don't need
valuesEl;      // Object with elements which are modified by `value` setter. todo:instead of elInput and elLabel
elements = []; // [Array] of all elements which are children of Panel
type;
payload;       // [String|Object] text or data for the Control
cid;           // [Special String] used for ID and storage
idPanel;       // ID of panel. not used. probably remove, as there is the whole Panel object in `panel`
elParent;      // element on document to which this CPControl is hooked
panels = new Set(); // CPPanels where this Control is used (instance is used when this or elParent is assigned)
valueDefault;  // default, initial value, where apply
// must not define those here, which are defined as methods below. (as undefined from this line will be used instead of method from a prototype)
// sanateInput;  // method. check/fix bad input, such which would break realizeValue()
// sanateValue;  // method. check/fix bad input. Out of range, not allowed values.
//realizeValue; // method. convert user readable/writable value to a real one, usable in the program.
//unRealizeValue; // method. reverse --"--. must be present when realizeValue is used
callBack;     // method. does not check value, but acts on it, if program needs an immediate action. e.g. it's a button - command

#value; // or should always get value from storage if storage is used?
_realState; // 2501 this should just be a getter, calling getRealValue(), queryProgramvalue, or something like that
_realStateShow;

static isInit = false;
static items = [];
static itemsByCid = {};
static getterValue = null; // can be set to e.g. a method of another class to get value from e.g. class Options
static setterValue = null; // --"--
//static strict = true;      // true: no checks, more difficult to debug; false: check and tries to fix

static cssHidden = `
	.cp-hidden.cp-hidden {
		display: none;
	}
`;
/* jshint ignore:end */

// only type, payload are not optional

/**
 * [constructor description]
 * @method constructor
 * @param  {String|Object}        payload         [description]
 * @param  {String}               type            [description]
 * @param  {CPPanel|Node|null}    panelOrElParent This Control is on CPPanel, on a Node, or not used
 * @param  {String|Object}        valueDefault    [description]
 * @param  {function}             callBack        [description]
 * @param  {String}               cid             Internal name of the control. w/o: " ", '"', "\", new lines ...
 * @return {CPControl}                            [description]
 */
// todo: constructor(payload, type, valueDefault, callBack, panelOrElParent, cid) {
constructor(payload, type, panelOrElParent, valueDefault, callBack, cid) {
	this.type = type;
	this.payload = payload;
	this.valueDefault = valueDefault; // undefined will be later cast to false
	this.callBack = callBack;
	this.id = CPControl.items.push(this) - 1;

	/// generate cid if it was not provided (todo also used for element id, maybe more suitable, all lower case with _)
	this.cid = cid;
	if (!cid) {
		// todo: if (payload instanceof Object) stringify, remove "[{01:" from beginning
		if (payload instanceof Object) { throw '[CPControl] for now cid is compulsory where payload is not a String'; }
		let strVNfull = payload.replaceAll(' ','').replaceAll('"','').replaceAll('\\','').replaceAll('\n','')
			.replaceAll('\t','');
		let i = 6; // just because 6 seems reasonable
		if (i > strVNfull.length) { i = strVNfull.length; } // msg is shorter than 6
		do {
			if (i > strVNfull.length) { this.cid = strVNfull + this.id; break; }
			// if (i > strVNfull.length) { throw "[CPControl] Can't get unique ValueName for control: " + payload; }
			this.cid = strVNfull.substr(0,i++);
		} while (CPControl.itemsByCid[this.cid]);
	}
	// it doesn't need it to be parse-able now
	// try { JSON.parse('{"'+this.cid+'": "0"}'); } catch (e) { throw '[CPControl] cid: ' + this.cid + ' is not valid';}

	CPControl.itemsByCid[this.cid] = this;

	// removed: when this Control was created without panel, new panel was created for it.

	CPControl.init();
	// err: CPControl.expandResourceUrl();
	this.expandPayloadUrl();

	if (panelOrElParent) {
		this.build();
		if (panelOrElParent instanceof CPPanel) {
			this.panels.add(panelOrElParent);
			panelOrElParent.addControlInstance(this);
		} else if (panelOrElParent instanceof Node) {
			this.elParent = panelOrElParent;
			this.injectToDoc();
		} else { throw '[CPControl] wrong value for panelOrElParent'; }
	}

	/// can't decide if this block will be here or in CPPanel (addControlInstance()). Now I think it belongs there.
	// if (panel) {
	// 	panel.controls.push(this);
	// 	for (let el of this.elements) {
	// 		panel.element.appendChild(el);
	// 	}
	// }
	return this;
}

build() {
	switch (this.type) {
		case 'checkbox':
			this.createCheckbox();
			break;
		case 'button':
			this.createButton();
			break;
		case 'text': // todo change typename to text input
			this.createTextElement();
			break;
		case 'paragraph':
			this.createParagraphElement();
			break;
		case 'widgetAndTextVertical':
			this.createWidgetAndTextVertical();
			break;
		default:
			throw '[CPControl] unknown control type';
	}
}

///// create<Control>
// elWrapper (DIV) is added for no specific reason. As the control could be anything, it seems better to wrap it into DIV, so that panel element will have identical children

// todo: add method will common instructions. which will be called from each create* below

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
	this.elLabel.htmlFor = 'statusCtr';
	this.elLabel.innerHTML = this.fillRealState() + this.payload;

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
	var elBtn = document.createElement('BUTTON');
	// elBtn.type = '';
	elBtn.innerHTML = this.payload;
	elBtn.onclick = () => {
		this.callBack();
	};
	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(elBtn);
	this.elements = [this.elWrapper];
	return this;
} // END createButton


createTextElement() {
	this.elInput = document.createElement('INPUT');
	this.elInput.type = 'text';
	this.elInput.id = this.cid;
	this.elInput.name = this.cid;
	this.elInput.placeholder = 'enter text';

	this.elLabel = document.createElement('LABEL');
	// this.elLabel.type = 'label';
	this.elLabel.htmlFor = this.cid;
	this.elLabel.innerHTML = this.payload;


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
	var elP = document.createElement('P');
	elP.id = this.cid;
	elP.innerHTML = this.payload;

	this.elWrapper = document.createElement('DIV');
	this.elWrapper.appendChild(elP);

	this.elements = [this.elWrapper];

	return this;
}

// Not a static icon but a changeable img with different status
// payload is an Object, value of each key is a different img source
createWidgetAndTextVertical() {
	// set some defaults if not provided
	if (!(this.valueDefault instanceof Object)) {
		this.valueDefault = { imgIdx: 0, textBottom: '---' };
	}

	// todo maybe a span with text above the icon, created only if data for it is present
	// if (this.payload['title']) ... .innerHTML = this.payload['title'];
	var elImg = document.createElement('IMG');
	elImg.style.width = '40px';
	elImg.src = this.payload.img[this.valueDefault['imgIdx']];
	elImg.addEventListener('error', evt => evt.target.dispatchEvent(new CustomEvent('resourcefailed', {bubbles: true,
		detail: value => elImg.src = value})));

	var elBottomDiv = document.createElement('DIV');
	elBottomDiv.style.textAlign = 'center';
	elBottomDiv.textContent = this.valueDefault['textBottom'];

	var elDiv = document.createElement('DIV');
	// elDiv.id = this.cid; // ID id not used in Control, and there is no logic on which el it should be.
	elDiv.classList.add('cpc-icon-and-text-vertical');
	elDiv.onclick = () => {
		this.callBack();
	};
	elDiv.appendChild(elImg);
	elDiv.appendChild(elBottomDiv);

	this.valuesEl = {img: elImg, span: elBottomDiv};
	this.elements = [elDiv];
	return this;
}

updateWidgetAndTextVertical(value) {
	if (value === undefined) { return; }
	if (!(value instanceof Object)) { throw '[CPControl] value must be an object'; }
	if (value['imgIdx']) { this.valuesEl.img.src = this.payload.img[value['imgIdx']]; }
	if (value['textBottom']) { this.valuesEl.span.textContent = value['textBottom']; }
}
// END create control elements


expandPayloadUrl() {
	// todo. or instead of img iterate all keys, if this.payload is an object
	if (this.payload && this.payload.img) {
		for (const idx in this.payload.img) {
			let res = this.payload.img[idx];
			if (res.startsWith('http') || res.startsWith('data:')) { continue; }
			this.payload.img[idx] = browser.runtime.getURL(res);
		}
	}
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
	if (CPControl.getterValue) { return CPControl.getterValue(this.cid); }
	if (this.#value !== undefined) { return this.#value; } // jshint ignore:line
	// first-time use
	if (this.valueDefault !== undefined) { return this.valueDefault; }
	return '';
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
		this.elLabel.innerHTML = this.fillRealState() + this.payload;
	}


set value(value) {
	this.#value = value; // jshint ignore:line
	if (CPControl.setterValue) { CPControl.setterValue(this.cid, value); }
	// debugger;
	switch (this.type) {
		case 'checkbox':
			this.elInput.checked = value;
			break;
		case 'text':
			this.elInput.value = this.unRealizeValue(value);
			break;
		case 'widgetAndTextVertical':
			this.updateWidgetAndTextVertical(value);
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

// todo: could be duplicated on multiple panels
addToPanel(pid) {
	var panel = CPPanel.itemsByPid[pid];
	if (!panel) { throw '[CPControl] panel does not exist. panel ID: ' + pid; }
	this.build();
	this.panels.add(panel);
	panel.addControlInstance(this);
}

// todo: for panel-less (without CPPanel) CPControl.
// inject to specified element
injectToDoc () {
	// TODO
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
			switch (localStorage.getItem(this.cid)) {
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

		case 'text': {
			let val = localStorage.getItem(this.cid);
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
}

set value(value) {
	// debugger;
	super.value = value;
	// without stringify, it will deserialize objects, but using `value.toString()`: [a,b,c,d] -> 'a,b,c,d', not '["a","b","c","d"]'
	// localStorage.setItem(this.cid, value);
	// and just stringify all, will add to a String: '"a,b,c"'.
	// This will stringify also boolean. should we care?
	if (typeof value !== 'string' && !(value instanceof String)) { value = JSON.stringify(value); }

	localStorage.setItem(this.cid, value);

	// debugger;

	// test
	// localStorage.setItem('testB', JSON.stringify(value));
	// var testA = localStorage.getItem(this.cid);
	// var testB = localStorage.getItem('testB');
	// debugger;
	// debugger;


	return;

	// unused now
	switch (value) {
		case true:
			localStorage.setItem(this.cid, 'true');
			break;
		case false:
			localStorage.setItem(this.cid, 'false');
			break;
		// case null:
		case undefined:
			localStorage.removeItem(this.cid);
			break;
		default:
	}
}

}
