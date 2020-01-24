 
/*
    Depend.js
    version 2.1
*/

"use strict"

var pageFunctions;
var initializedFunctions;

function init(event, pageFunc) {
    if (!!initializedFunctions) {
        pageFunctions = initializedFunctions;
    } else if (!!pageFunc) {
        initializedFunctions = pageFunc;
        pageFunctions = initializedFunctions;
    } else {
        pageFunctions = {
            show: function (element) {
                element.classList.remove('hidden');
                element.removeAttribute('hidden');
            },
            hide: function (element) {
                element.classList.add('hidden');
                element.setAttribute('hidden', true);
            },
            enabled: function (element) {
                element.removeAttribute('disabled');
            },
            disabled: function (element) {
                element.setAttribute('disabled', true);
            },
            optional: function (element) {
                element.removeAttribute('required');
                element.previousElementSibling.classList.add('hidden');
            },
            required: function (element) {
                element.setAttribute('required', 1);
                element.previousElementSibling.classList.remove('hidden');
            }
        }
    }

    let dependents = document.querySelectorAll("[depend]");
    let n = dependents.length;
    let forms = [];
    var form;
    for (let i = 0; i < n; i++) {
        form = getParentByTagName(dependents[i], 'form');
        if (forms.indexOf(form) == -1) {
            forms.push(form);
        }
    }
    forms.forEach(function (value) {
        new Depend(value, pageFunctions);
    });
}

function getParentByTagName(node, tagname) {
    var parent;
    if (node === null || tagname === '') return;
    parent = node.parentNode;
    tagname = tagname.toUpperCase();
    while (parent.tagName !== "HTML") {
        if (parent.tagName === tagname) {
            return parent;
        }
        parent = parent.parentNode;
    }
    return parent;
}

class Depend {

    constructor(form, pageFunctions) {
        this.triggerListeners = new Map();
        this.listenedElements = [];
        this.form = form;
        this.dependents = form.querySelectorAll("[depend]");
        this.executed = [];
        this.visited = [];
        let n = this.dependents.length;
        this.behaviorProperties = {
            show: {
                priority: 1,
                oposite: 'hide',
                continue: true
            },
            hide: {
                priority: 1,
                oposite: 'show',
                continue: false
            },
            enabled: {
                priority: 2,
                oposite: 'disabled',
                continue: true
            },
            disabled: {
                priority: 2,
                oposite: 'enabled',
                continue: false
            },
            optional: {
                priority: 4,
                oposite: 'required',
                continue: true
            },
            required: {
                priority: 4,
                oposite: 'optional',
                continue: true
            }
        };
        this.behaviorFunctions = {
            show: function (element) {
                pageFunctions.show(element);
            },
            hide: function (element) {
                pageFunctions.hide(element);
            },
            enabled: function (element) {
                pageFunctions.enabled(element);
            },
            disabled: function (element) {
                pageFunctions.disabled(element);
            },
            optional: function (element) {
                pageFunctions.optional(element);
            },
            required: function (element) {
                pageFunctions.required(element);
            }
        }
        for (let i = 0; i < n; i++) {
            this.dependents[i].d_expression;
            this.dependents[i].d_expression = this.dependents[i].getAttribute('depend');
            this.dependents[i].Depend = this;
            this.initFieldState(this.dependents[i]);
            this.executed = [];
            this.visited = [];
            this.expressionFieldState(this.dependents[i]);
        }
        this.addListeners();
    }

    implementDependencies() {
        if (this.dependents) {
            let n = this.dependents.length;
            this.executed = [];
            this.visited = [];
            for (let i = 0; i < n; i++) {
                this.expressionFieldState(this.dependents[i]);
            }
        }
    }

    expressionFieldState(element) {
        if(this.executed.indexOf(element) != -1){
            return;
        }
        let n, i;
        if(this.triggerListeners.get(element))
        {
            if(this.visited.indexOf(element) != -1){
                console.error("Deadlock detected!" );
                console.error("Depend.js can not execute the logical expression!" );
                throw "Dependencies have to be changed!"
            }
            this.visited.push(element);
            n = this.triggerListeners.get(element).length
            for(let i = 0; i < n; i ++){
                this.expressionFieldState(this.triggerListeners.get(element)[i]);
            }
        }
        this.element = element;
        let func = this.extractFunctions(element.d_expression);
        n = func.length;
        let logic;
        let logicArray = [];
        for (let i = 0; i < n; i++) {
            func[i] = func[i].trim();
            logic = this.extractLogic(func[i]);
            if(logic)
            {
                logicArray.push(logic);
            }
        }
        if (this.checkForOposites(logicArray)) {
            logicArray = this.sortLogicArray(logicArray);
            let n = logicArray.length;
            for (let i = 0; i < n; i++) {
                this.execute(element, logicArray[i]);
                this.executed.push(element);
                this.triggerListeners.get(element);
                if (!(this.behaviorProperties[logicArray[i][0]].continue == logicArray[i][1])) {
                    break;
                }
            }
        }
    }

    execute(element, command) {
        if (command[1]) {
            this.behaviorFunctions[String(command[0])](element);
        } else {
            this.behaviorFunctions[this.behaviorProperties[String(command[0])].oposite](element);
        }
    }

    sortLogicArray(logicArray) {
        var behaviorProperties = this.behaviorProperties;
        logicArray.sort(function (a, b) {
            return behaviorProperties[a[0]].priority - behaviorProperties[b[0]].priority;
        });
        return logicArray;
    }

    checkForOposites(logicArray) {
        let i, n = logicArray.length;
        let visible = 0;
        let active = 0;
        let rule = 0;
        for (i = 0; i < n; i++) {
            if (logicArray[i][0] == 'show' || logicArray[i][0] == 'hide') {
                visible++;
            }
            if (logicArray[i][0] == 'disabled' || logicArray[i][0] == 'enabled') {
                active++;
            }
            if (logicArray[i][0] == 'optional' || logicArray[i][0] == 'required') {
                rule++;
            }
        }
        if (visible == 2) {
            console.error("Warning: The functions \"show()\" and \"hide()\" are logically opposed. The function \"show()\" is equal to \"!hide()\". Using both in one expression is not logically correct.");
        }
        if (active == 2) {
            console.error("Warning: The functions \"disabled()\" and \"enabled()\" are logically opposed. The function \"disabled()\" is equal to \"!enabled()\". Using both in one expression is not logically correct.");
        }
        if (active == 2) {
            console.error("Warning: The functions \"optional()\" and \"required()\" are logically opposed. The function \"optiona()\" is equal to \"!required()\". Using both in one expression is not logically correct.");
        }
        if (visible < 2 && active < 2 && rule < 2) {
            return true;
        } else {
            return false;
        }
    }

    initFieldState(field) {
        field.d_show = this.getShow(field);
        field.d_enabled = this.getEnabled(field);
        field.d_optional = this.getOptional(field);
        return true;
    }

    getShow(field) {
        let fieldState = field.classList.contains("hidden");
        let labelState = (getParentByTagName(field, 'label').tagName == 'label' && getParentByTagName(field, 'label').contains("hidden"));
        return !(fieldState || labelState);
    }

    getEnabled(field) {
        return !field.hasAttribute("disabled");
    }

    getOptional(field) {
        return !field.hasAttribute("required");
    }

    extractFunctions(expression) {
        var i = 0;
        var level = 0;
        var returnStr = '';
        var symbol;
        while (i < expression.length) {
            symbol = expression[i++];
            switch (symbol) {
                case "[":
                    level++
                    break;
                case "]":
                    level--
                    break;
                case ",":
                    if (level == 0) {
                        symbol = '%';
                    }
            }
            returnStr += symbol;
        }
        return returnStr.split('%');
    }

    extractLogic(oneFunctionExpression) {
        let elements;
        var pattern = /^(show)\->\[(.+)\]$|(hide)\->\[(.+)\]$|(disabled)\->\[(.+)\]$|(enabled)\->\[(.+)\]$|(optional)\->\[(.+)\]$|(required)\->\[(.+)\]$/;
        var result = pattern.exec(oneFunctionExpression);
        var functionData = this.getFunctionData(result);
        var logicArray = this.revealingBrackets(functionData.expression);
        this.getListenedElements(logicArray);
        return [functionData.name, this.logicResult(logicArray)];
    }

    getFunctionData(regExResult) {
        let returnArray = {
            name: '',
            expression: ''
        };
        regExResult.forEach(function (value, key) {
            if (value != undefined) {
                if (behaviorFunctionsList.indexOf(value) != -1) {
                    returnArray.name = value;
                } else {
                    returnArray.expression = value;
                }
            }
        });
        return returnArray;
    }

    revealingBrackets(str) {
        var i = 0;
        var symbol;

        function main() {
            var arr = [];
            var startIndex = i;

            function addWord(carrete_position) {
                var add_i = i;
                if (carrete_position) {
                    add_i = i + carrete_position;
                }
                var push_str = str.slice(startIndex, add_i);
                if (add_i > startIndex && push_str.length > 1) {
                    arr.push(push_str);
                }
            }

            function addNo(s) {
                arr.push(s);
            }

            function addOperator(symbol) {
                arr.push(symbol + symbol);
            }

            while (i < str.length) {
                symbol = str[i++];
                switch (symbol) {
                    case " ":
                        if ((str[i + 1] == '|' && str[i + 2] == '|') ||
                            (str[i + 1] == '&' && str[i + 2] == '&') ||
                            (str[i + 1] == ')')) {
                            addWord();
                            startIndex = i;
                        }
                        break;
                    case "(":
                        arr.push(main());
                        startIndex = i;
                        break;
                    case ")":
                        addWord(-1);
                        return arr;
                        break;
                    case "|":
                        if (str[i] == '|') {
                            addWord(-1);
                            startIndex = i;
                        } else if (str[i - 1] == '|') {
                            addOperator(symbol);
                            startIndex = i;
                        }
                        break;
                    case "&":
                        if (str[i] == '&') {
                            addWord(-1);
                            startIndex = i;
                        } else if (str[i - 1] == '&') {
                            addOperator(symbol);
                            startIndex = i;
                        }
                        break;
                    case "!":
                        addNo(str[i - 1]);
                        startIndex = i;
                        break;
                }
            }
            addWord();
            return arr;
        }
        return main();
    }

    getListenedElements(logicArray) {
        this.triggerListeners.set(this.element, []);
        let i = 0;
        let n = logicArray.length;
        let elements = [],
            element;
        var buttons, j, m;
        for (i; i < n; i++) {
            if (typeof logicArray[i] == "string") {
                if (!(logicArray[i] == "||" || logicArray[i] == "&&" || logicArray[i] == "!")) {
                    logicArray[i] = logicArray[i].trim();
                    if (logicArray[i].indexOf(':') != -1) {
                        logicArray[i] = logicArray[i].split(':')[0];
                    }
                    try {
                        element = this.form.querySelector(logicArray[i]);
                        if(element) {
                            if (element.tagName == 'OPTION') {
                                elements.push(element.closest('SELECT'));
                                if(element.closest('SELECT').hasAttribute('depend')) {
                                    this.triggerListeners.get(this.element).push(element.closest('SELECT'));
                                }
                            } else if (element.tagName == 'INPUT' || element.tagName == 'SELECT') {
                                if( element.tagName == 'INPUT' && element.type == 'radio' ) {
                                    buttons = this.form.querySelectorAll('[name=' + element.name + ']');
                                    m = buttons.length;
                                    for(j = 0; j < m; j ++) {
                                        if(buttons[j].hasAttribute('depend')) {
                                            this.triggerListeners.get(this.element).push(buttons[j]);
                                        }
                                        elements.push(buttons[j]);
                                    }
                                }
                                else {
                                    if(element.hasAttribute('depend')) {
                                        this.triggerListeners.get(this.element).push(element);
                                    }
                                    elements.push(element);
                                }
                            }
                        }
                        else {
                            elements.push(this.form);
                        }
                    }
                    catch(err){
                        console.error(err.message);
                    }
                }
            }
            else if(Array.isArray(logicArray[i])) {
                this.getListenedElements(logicArray[i]);
            }
        }
        n = elements.length;
        for(let i=0; i<n; i++){
            if(this.listenedElements.indexOf(elements[i]) == -1){
                this.listenedElements.push(elements[i]);
            }
        }
    }

    logicResult(logicArray) {
        let i = 0;
        let n = logicArray.length;
        let str = "";
        for (i; i < n; i++) {
            if (typeof logicArray[i] == "string") {
                if (logicArray[i] == "||" || logicArray[i] == "&&" || logicArray[i] == "!") {
                    str += logicArray[i];
                } else {
                    str += this.getElementBoolean(logicArray[i]);
                }
            } else if (typeof logicArray[i] == "object") {
                str += this.logicResult(logicArray[i])
            }
        }
        return eval(str);
    }

    getElementBoolean(selector) {
        let i, result = false;
        try{
            let elements = this.form.querySelectorAll(selector);

            for (i = 0; i < elements.length; i++) {
                if (elements[i] && elements[i].tagName == "INPUT") {
                    let type = elements[i].getAttribute("type");
                    if (type == "checkbox" && !!elements[i].checked && !elements[i].hidden) {
                        result = true;
                        break;
                    } else if (type == "radio" && !!elements[i].checked && !elements[i].hidden) {
                        result = true;
                        break;
                    } else if (type == "text" && !!elements[i].value && !elements[i].hidden) {
                        result = true;
                        break;
                    }
                }
                else if (elements[i] && elements[i].tagName == "OPTION" && elements[i].selected && !elements[i].closest('SELECT').hidden) {
                    result = true;
                    break;
                }
            }
        }
        catch(err) {
            console.error(err.message);
        }
        return result;
    }

    addListeners() {
        if (this.listenedElements) {
            let i, n = this.listenedElements.length;
            for (i = 0; i < n; i++) {
                let currentElement = this.listenedElements[i];
                currentElement.addEventListener( "change", () => this.implementDependencies() );
            }
        }
    }
}

var behaviorFunctionsList = ['show', 'hide', 'enabled', 'disabled', 'optional', 'required'];

window.addEventListener('DOMContentLoaded', init);
