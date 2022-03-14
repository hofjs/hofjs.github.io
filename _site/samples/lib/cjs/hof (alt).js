"use strict";
// https://github.com/prateek3255/typescript-react-demo-library
Object.defineProperty(exports, "__esModule", { value: true });
exports.css = exports.html = exports.list = exports.item = exports.HofHtmlElement = void 0;
// Adapt bind to preserve function body instead of returning [native code] if function is bound which is
// important because _makeDerivedVariablesObservable requires function body to setup observability
(function () {
    const originalBind = Function.prototype.bind;
    // Only adapt if extension has not already been applied
    if (originalBind.toString().includes("[native code]"))
        Function.prototype.bind = function () {
            const result = originalBind.apply(this, arguments);
            result.toString = () => this.toString();
            return result;
        };
}());
// Shim replaceAll if not supported on browser by using a simplified implementation
// that provides all required functionality for this framework
(function () {
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function (find, replace) {
            let s = '', index, next;
            while (~(next = this.indexOf(find, index))) {
                s += this.substring(index, next) + replace;
                index = next + find.length;
            }
            return s + this.substring(index);
        };
    }
}());
class AttributeExpression {
    constructor(execute, bindVariableNames, template) {
        this.execute = execute;
        this.bindVariableNames = bindVariableNames;
        this.template = template;
    }
}
class CachedListData {
    constructor(listParentElementName, listParentElementRenderOnEmptyList, listProperty, listDerived, listFunction, listReferencedProps, listItemVariable, listIndexVariable, listItemUpdatedVariable, listElementTemplateFunction, listElementTemplateSize) {
        this.listParentElementName = listParentElementName;
        this.listParentElementRenderOnEmptyList = listParentElementRenderOnEmptyList;
        this.listProperty = listProperty;
        this.listDerived = listDerived;
        this.listFunction = listFunction;
        this.listReferencedProps = listReferencedProps;
        this.listItemVariable = listItemVariable;
        this.listIndexVariable = listIndexVariable;
        this.listItemUpdatedVariable = listItemUpdatedVariable;
        this.listElementTemplateFunction = listElementTemplateFunction;
        this.listElementTemplateSize = listElementTemplateSize;
    }
}
class CachedContentData {
    constructor(contentTemplateFunction, updatedVariable) {
        this.contentTemplateFunction = contentTemplateFunction;
        this.updatedVariable = updatedVariable;
    }
}
class ListData {
    constructor(listParentElement, listParentElementIndex, listCurrentData) {
        this.listParentElement = listParentElement;
        this.listParentElementIndex = listParentElementIndex;
        this.listCurrentData = listCurrentData;
    }
}
class HofHtmlElement extends HTMLElement {
    constructor(tagName = 'div') {
        super();
        this._instanceId = 0;
        this._tagName = null;
        this._root = null;
        this._shadow = null;
        this._properties = {}; // Global properties (of component)
        this._derivedProperties = {}; // All derived properties with their function definition
        this._allBindVariables = null; // All bind variables with their current values
        this._allBindExpressions = {}; // All bind variable expressions used in templates
        this._observersForBindVariable = new Map(); // Map<BindVariableName, Map<DOMElement, AttributeName[]>>
        this._observerExpressions = new Map(); // Map<DOMElement, Map<AttributeName, AttributeExpression>>
        this._renderIteration = -1; // Each rendering process increments id (rendering of a list of n elements means n incrementations, each update an additional one)
        this._lists = new Map();
        this._static = null;
        this.templates = [];
        this.styles = null;
        this.init = null;
        this.dispose = null;
        // Only calculate properties of HofHtmlElement first time
        if (HofHtmlElement.PARENT_PROPERTIES == null)
            HofHtmlElement.PARENT_PROPERTIES = Object.getOwnPropertyNames(this);
        this._static = this.constructor;
        if (typeof this._static._cached == "undefined") {
            this._static._cached = false;
            this._static._cachedInstanceId = 0;
            this._static._cachedLists = new Map();
            this._static._cachedTemplates = [];
            this._static._cachedPropertyReferences = new Map();
        }
        this._instanceId = this._static._cachedInstanceId++;
        this._tagName = tagName;
        this._root = document.createElement(this._tagName);
        this._shadow = this.attachShadow({ mode: "open" });
        this._shadow.appendChild(this._root);
        this._makeDerivedPropertyFunctions();
    }
    connectedCallback() {
        var _a;
        // Apply styles if provided
        if (this.styles != null) {
            const styles = document.createElement("style");
            styles.innerHTML = this.styles;
            this._shadow.appendChild(styles);
        }
        // Make component properties observable including derived properties
        this._makeComponentPropertiesObservable();
        this._restoreDerivedPropertyFunctions();
        // If HofHtmlElement is used in plain HTML markup and not within other HofHtmlElement,
        // full render has to be called because no other HofHtmlElement manages call to render
        if (this._isRootHofHtmlElement())
            this.render();
        (_a = this.init) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    disconnectedCallback() {
        var _a;
        (_a = this.dispose) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    render() {
        // This method only gets called one time for each component instance to
        // make initial full rendering and setup observability
        // Templates are only calculated once for each component class because
        // they are the same for each instance of a component
        if (!this._static._cached) { // First instance of component class used in html?
            this._static._cached = true;
            this._renderAndCacheTemplates();
        }
        else // Second instance of component class used in html?
            this._renderCachedTemplates();
        HofLogging.logInitialRendering(this, 0, this._properties);
        HofLogging.logInitialRendering(this, 0, this._derivedProperties);
        // Property references are no longer needed because resolving is completed
        this._static._cachedPropertyReferences = null;
    }
    _renderAndCacheTemplates() {
        // Replace string template with function that returns string
        if (typeof this.templates == "string") {
            const implementation = this._static.toString();
            const implementationWithTemplateFunction = implementation.replace(/templates\s*=\s*html\s*`/m, "static templates = () => html`");
            if (implementationWithTemplateFunction != implementation)
                this.templates = new Function("return " + implementationWithTemplateFunction)().templates;
            else
                throw Error("String templates are only allowed if you assign an html`` expression! If you require more features, assign a lambda expression such as () => someExpression.");
        }
        // Array of render statements (templates = [...])?
        if (Array.isArray(this.templates))
            for (const template of this.templates)
                this._renderAndCacheTemplate(template);
        else // Only one render statement (templates = ...)
            this._renderAndCacheTemplate(this.templates);
    }
    _renderAndCacheTemplate(template) {
        if (template["bind"]) // item render function?
            this._renderAndCacheContent(template);
        else { // list render function?
            const listPropertyName = this._findPropertyForValue(template["list"]);
            const restoredGetter = Object.getOwnPropertyDescriptor(this, listPropertyName).get;
            const listParentElementName = template["parentElement"];
            const renderParentElementOnEmptyList = template["renderParentElementOnEmptyList"];
            // Derived property? -> Resolve
            const listPropertyFunction = this._derivedProperties[listPropertyName] ?
                restoredGetter : new Function(`return this.${listPropertyName};`);
            // Render list
            this._renderAndCacheList(listPropertyFunction, template["htmlRenderFunc"], listParentElementName, renderParentElementOnEmptyList);
        }
    }
    _renderCachedTemplates() {
        for (const cachedTemplate of this._static._cachedTemplates)
            if ("contentTemplateFunction" in cachedTemplate)
                this._renderCachedContent(cachedTemplate);
            else if ("listElementTemplateFunction" in cachedTemplate)
                this._renderCachedList(cachedTemplate);
            else
                throw Error("Unsupported cached template!");
    }
    _isRootHofHtmlElement() {
        // Look for HofHtmlElements above this HofHtmlElement
        for (let node = this; node; node = node.parentNode)
            if (node.toString() === "[object ShadowRoot]" && node["host"] instanceof HofHtmlElement)
                return false; // HofHtmlElement that contains this HofHtmlElement was found
        // No HofHtmlElement was found above this element -> this element is root HofHtmlElement
        return true;
    }
    _makeDerivedPropertyFunctions() {
        // Replace derived properties (properties with only a getter) with functions that return getter
        // to identify properties by their value in method _findPropertyForValue (simple values do not
        // work because they can be "" or [] which is not unique, however function references are unique)
        const prototype = Object.getPrototypeOf(this);
        for (const name of Object.getOwnPropertyNames(prototype).filter(name => name != "constructor")) {
            if (Object.getOwnPropertyDescriptor(prototype, name).get) {
                Object.defineProperty(this, name, {
                    get: function () { return Object.getOwnPropertyDescriptor(prototype, name).get; },
                    configurable: true
                });
                this._derivedProperties[name] = Object.getOwnPropertyDescriptor(prototype, name).get;
            }
        }
    }
    _restoreDerivedPropertyFunctions() {
        const prototype = Object.getPrototypeOf(this);
        for (const listPropertyName of Object.keys(this._derivedProperties)) {
            const propDesc = Object.getOwnPropertyDescriptor(prototype, listPropertyName);
            if (this._derivedProperties[listPropertyName]) {
                if (propDesc.get) {
                    Object.defineProperty(this, listPropertyName, {
                        get: this._derivedProperties[listPropertyName]
                    });
                    return Object.getOwnPropertyDescriptor(prototype, listPropertyName).get.bind(this);
                }
            }
        }
    }
    _findPropertyForValue(propertyValue) {
        if (propertyValue == null)
            return null;
        for (const name of Object.getOwnPropertyNames(this))
            if (propertyValue == this._static._cachedPropertyReferences.get(name))
                return name;
        for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
            if (propertyValue == this._static._cachedPropertyReferences.get(name))
                return name;
        throw Error("Property could not be resolved! If you used a private property with leading #, "
            + "please replace it with _, because private properties are currently not supported within templates!");
    }
    _makeComponentPropertiesObservable() {
        // Replace all public simple properties with getters and setters,
        // so that access can be intercepted and observability can be realized
        this._forEachNonDerivedProperty((prop, obj) => {
            const initialValue = obj[prop];
            // Save initial property value for later property resolving
            if (this._static._cachedPropertyReferences && !this._static._cachedPropertyReferences.has(prop))
                this._static._cachedPropertyReferences.set(prop, initialValue);
            // Replace property with observability supporting property
            Object.defineProperty(this, prop, {
                get: function () { return this.getBindVariable(prop, initialValue); },
                set: function (value) {
                    const oldValue = this.getBindVariable(prop, initialValue);
                    if (this._callBindVariableBeforeChangedHook(this, prop, value, oldValue)) {
                        this.setBindVariable(prop, value);
                        this._callBindVariableAfterChangedHook(this, prop, value, oldValue);
                    }
                },
                enumerable: true,
                configurable: true
            });
        });
    }
    getBindVariable(name, initialValue = undefined) {
        var _a, _b;
        if (this._allBindVariables)
            return this._allBindVariables[name];
        return (_b = (_a = this._properties[name]) !== null && _a !== void 0 ? _a : this.getAttribute(name)) !== null && _b !== void 0 ? _b : initialValue;
    }
    setBindVariable(name, value) {
        const oldValue = this.getBindVariable(name);
        // Update property in case of complex object (because part of it has changed) or on value change of simple property or on collection action
        if (typeof (oldValue) == "object" || typeof (value) == "object" || oldValue != value || value["lastActionMethod"]) {
            // Only update property if it was changed and not only subproperty
            if (!value.lastActionPropertyPath) {
                // Process initial element-property setter calls (cache for time after template
                // has been constructed and further binding variables are available)
                this._properties[name] = value;
                // Update properties including local binding variables
                if (this._allBindVariables)
                    this._allBindVariables[name] = value;
            }
            HofLogging.logPropertyUpdate(this, name, value);
        }
        // Make new objects observable
        if (this._allBindVariables)
            this._makeBindVariableObservable(name);
        // Inform observers on property update
        this._updatePropertyObservers([name, value]);
        // Render update
        this._renderUpdate(name, value, oldValue);
    }
    _renderAndCacheContent(html) {
        const expression = html.toString();
        // Extract variable names for updated from template function, e.g. (updated) => ...
        // (parameter has to be identified by =>, because some browsers/node return parameter without brackets in function.toString())
        const [updatedVariable] = expression.substring(0, expression.indexOf("=>"))
            .replace("(", "").replace(")", "").split(",").map(x => x.trim());
        const cachedContentData = new CachedContentData(html, updatedVariable);
        this._renderCachedContent(cachedContentData);
        this._static._cachedTemplates.push(cachedContentData);
    }
    _renderCachedContent(cachedContentData) {
        const locals = {};
        if (cachedContentData.updatedVariable) {
            let initValue = false;
            locals[cachedContentData.updatedVariable] = initValue;
            if (cachedContentData.updatedVariable in this)
                throw Error(`Lambda parameter for updated state must not be named like existing property of component! `
                    + `If you want to keep property name "${cachedContentData.updatedVariable}", use another lambda parameter name.`);
            Object.defineProperty(this, this._calculateRenderingIterationAwareUniqueName(cachedContentData.updatedVariable), {
                get: function () { const oldValue = initValue; if (!initValue)
                    initValue = true; return oldValue; }
            });
        }
        this._renderFull(this._root, cachedContentData.contentTemplateFunction, locals);
    }
    _renderAndCacheList(listFunction, listElementTemplateFunction, listParentElementName, listParentElementRenderOnEmptyList) {
        const expression = listElementTemplateFunction.toString();
        // Extract variable names for item and index from list element template function, e.g. (person, index) => ...
        // (list parameter has to be identified by =>, because some browsers/node return parameter without brackets in function.toString())
        const [listItemVariable, listIndexVariable, listItemUpdatedVariable] = expression.substring(0, expression.indexOf("=>"))
            .replace("(", "").replace(")", "").split(",").map(x => x.trim());
        // Support derived properties as list parameters
        const listExpression = listFunction.toString();
        // Calculate variable names
        const listReferencedProps = [];
        for (const [, prop] of listExpression.matchAll(/this\.(\w+)/gm))
            listReferencedProps.push(prop);
        const listDerived = listExpression.startsWith("get ");
        const listProperty = listDerived
            ? listFunction.name.substring(4).trim() // derived property name
            : listReferencedProps[0];
        const cachedListData = new CachedListData(listParentElementName, listParentElementRenderOnEmptyList, listProperty, listDerived, listFunction, listReferencedProps, listItemVariable, listIndexVariable, listItemUpdatedVariable, listElementTemplateFunction, 0);
        cachedListData.listElementTemplateSize = this._renderCachedList(cachedListData);
        // Create entry for list properties
        for (const listProp of listReferencedProps) {
            const cachedLists = this._static._cachedLists;
            if (!cachedLists.has(listProp))
                cachedLists.set(listProp, []);
            cachedLists.get(listProp).push(cachedListData);
        }
        this._static._cachedTemplates.push(cachedListData);
    }
    _getFilteredProperties(propNames) {
        return Object.fromEntries(Object.entries(this._allBindVariables).filter(([key,]) => propNames.includes(key)));
    }
    _renderCachedList(cachedListData) {
        const listData = cachedListData.listFunction.call(this);
        // Add observability for list changes to this HofHtmlElement
        this._addBindExpressionForLists(cachedListData.listDerived ? cachedListData.listReferencedProps : [cachedListData.listProperty]);
        let i = 0;
        const locals = {};
        const listParentElement = document.createElement(cachedListData.listParentElementName);
        for (const listItem of listData) {
            locals[cachedListData.listItemVariable] = listItem;
            locals[cachedListData.listItemVariable]._observableUniqueName = this._calculateRenderingIterationAwareUniqueName(cachedListData.listItemVariable);
            if (cachedListData.listIndexVariable)
                locals[cachedListData.listIndexVariable] = i;
            if (cachedListData.listItemUpdatedVariable)
                locals[cachedListData.listItemUpdatedVariable] = false;
            this._renderFull(listParentElement, cachedListData.listElementTemplateFunction, locals);
            i++;
        }
        // Render parent element depending on list size
        if (cachedListData.listParentElementRenderOnEmptyList || listData.length > 0)
            this._root.appendChild(listParentElement);
        const listParentElementIndex = this._root.childNodes.length;
        // Create entry for list properties
        for (const listProp of cachedListData.listReferencedProps) {
            if (!this._lists.has(listProp))
                this._lists.set(listProp, []);
            this._lists.get(listProp).push(new ListData(listParentElement, listParentElementIndex, [...listData]));
        }
        const listElementTemplateSize = i > 0
            ? listParentElement.childNodes.length / i
            : this._parseHTML(cachedListData.listElementTemplateFunction, locals)[0].length;
        return listElementTemplateSize;
    }
    _addBindExpressionForLists(listProps) {
        for (const listProp of listProps) {
            if (!(listProp in this._allBindExpressions))
                this._allBindExpressions[listProp] = [];
            this._allBindExpressions[listProp].push("length");
        }
    }
    _calculateBindVariables() {
        let result = {};
        this._forEachNonDerivedProperty((prop, obj) => result[prop] = obj[prop]);
        this._allBindVariables = result;
    }
    _forEachNonDerivedProperty(func) {
        for (const name of Object.getOwnPropertyNames(this).filter(p => !HofHtmlElement.PARENT_PROPERTIES.includes(p))) {
            const propDesc = Object.getOwnPropertyDescriptor(this, name);
            if (!propDesc.get || propDesc.configurable)
                func(name, this);
        }
        const prototype = Object.getPrototypeOf(this);
        for (const name of Object.getOwnPropertyNames(prototype).filter(p => p != "constructor")) {
            if (!Object.getOwnPropertyDescriptor(prototype, name).get)
                func(name, prototype);
        }
    }
    _convertToTemplateExpression(buildFunction) {
        let expression = buildFunction.toString();
        // Support quotes within attribute expressions
        for (const [, match] of expression.matchAll(/(html`[\s\S]*`\s*\}\s*)"/g))
            expression = expression.replace(match, match.replaceAll("\"", "&quot;"));
        // Check if template function is a regular function or an arrow function and calculate start of expression
        const isRegularFunction = expression.startsWith("function");
        const expressionStart = isRegularFunction ? expression.indexOf("return") : expression.indexOf("=>");
        if (expressionStart == -1)
            throw Error(`Render function definition '${expression}' is not valid! It has to be of type arrow function (optionalParams) => string or of type function() { return string }.`);
        // Extract function body and interpret as expression
        expression = isRegularFunction
            ? expression.substring(expressionStart + 6, expression.lastIndexOf("}"))
            : expression.substring(expressionStart + 2);
        expression = expression.trim();
        // Remove tagged template literal prefix if html`` is used
        expression = expression.replaceAll(HofHtmlElement.HTML_TAGGED_TEMPLATE_REGEX, "`");
        // If expression is template literal, return content
        if (expression.startsWith("`") && expression.endsWith("`"))
            expression = expression.substring(1, expression.length - 1);
        else // If expression is regular code, wrap it into template literal tokens
            expression = "${" + expression + "}";
        return expression.trim();
    }
    _parseHTML(htmlFunction, locals) {
        const html = this._convertToTemplateExpression(htmlFunction);
        // First call of render?
        if (this._allBindVariables == null)
            this._calculateBindVariables();
        const allBindVariables = this._allBindVariables;
        const [template, bindVariableNames] = this._calculateTemplateAndBindVariableNames(html, allBindVariables, locals);
        this._calculateBindings(template, bindVariableNames);
        let temp = document.createElement('template');
        temp.innerHTML = template;
        const elements = temp.content.childNodes;
        this._renderIteration++;
        return [elements, allBindVariables, bindVariableNames];
    }
    _makeBindVariableObservable(bindVariableName) {
        // Don't make derived properties observable because they are updated in case referenced bind variables update
        if (this._derivedProperties[bindVariableName])
            return;
        for (const bindingExpression of this._allBindExpressions[bindVariableName])
            this._makeBindVariableStructureObservable(bindVariableName, bindingExpression);
    }
    _makeBindVariableStructureObservable(bindVariableName, bindingExpression) {
        const o = this._allBindVariables[bindVariableName];
        const props = bindingExpression.split(/[.\[]/).filter(prop => prop != "");
        // Walk through property path and make subproperties observable
        let propObj = o;
        let propertyPath = bindVariableName;
        for (let i = 0; i < props.length; i++) {
            let lastProp = props[i];
            // Array index property path?
            if (lastProp.endsWith("]")) {
                lastProp = lastProp.substring(0, lastProp.length - 1);
                propertyPath += `[${props[i]}`;
            }
            else // Regular object property path?
                propertyPath += `.${props[i]}`;
            if (typeof propObj == "undefined")
                return;
            if (typeof propObj == 'object') {
                if (!Array.isArray(propObj) && propertyPath.includes(".") && propObj[lastProp].bind)
                    propObj[lastProp] = propObj[lastProp].bind(propObj);
                // Do not observe function references
                if (propObj[lastProp]["bind"])
                    continue;
                // Observe arrays and objects
                if (!Array.isArray(propObj))
                    this._makeObjectObservable(propObj, lastProp, bindVariableName, propertyPath);
                else if (props[i].endsWith("]"))
                    this._makeObjectObservable(propObj, lastProp, bindVariableName, propertyPath.startsWith("[") ? propertyPath : propertyPath.replace("]", ""));
                else
                    this._makeArrayObservable(propObj, lastProp, bindVariableName, propertyPath);
            }
            propObj = propObj[lastProp];
        }
    }
    _callBindVariableBeforeChangedHook(obj, prop, newValue, oldValue) {
        // Initial call / property not yet resolved -> dont execute hook
        if (typeof oldValue == "string" && oldValue.startsWith("$"))
            return true;
        const hookMethodName = `${prop}BeforeChanged`;
        if (obj[hookMethodName]) {
            const ret = obj[hookMethodName](newValue, oldValue);
            if (typeof ret != "undefined" && ret == false)
                return false;
            return true;
        }
        return true;
    }
    _callBindVariableAfterChangedHook(obj, prop, newValue, oldValue) {
        // Initial call / property not yet resolved -> dont execute hook
        if (typeof oldValue == "string" && oldValue.startsWith("$"))
            return;
        const hookMethodName = `${prop}AfterChanged`;
        if (obj[hookMethodName])
            obj[hookMethodName](newValue, oldValue);
    }
    _callBindVariableBeforePropertyChangedHook(obj, prop, subProp, newValue, oldValue) {
        // Initial call / property not yet resolved -> dont execute hook
        if (typeof oldValue == "string" && oldValue.startsWith("$"))
            return true;
        const hookMethodName = `${prop}BeforePropertyChanged`;
        if (obj[hookMethodName]) {
            const ret = obj[hookMethodName](subProp, newValue, oldValue);
            if (typeof ret != "undefined" && ret == false)
                return false;
            return true;
        }
        return true;
    }
    _callBindVariableAfterPropertyChangedHook(obj, prop, subProp, newValue, oldValue) {
        // Initial call / property not yet resolved -> dont execute hook
        if (typeof oldValue == "string" && oldValue.startsWith("$"))
            return;
        const hookMethodName = `${prop}AfterPropertyChanged`;
        if (obj[hookMethodName])
            obj[hookMethodName](subProp, newValue, oldValue);
    }
    _makeObjectObservable(obj, observerProperty, componentProperty, propertyPath) {
        let _value = obj[observerProperty];
        const self = this;
        // Register new observer if not already registered
        this._registerNewObserver(obj, observerProperty, this, componentProperty, propertyPath);
        // Replace property with property that calls all registered observers
        if (!Object.getOwnPropertyDescriptor(obj, observerProperty).set && !Object.getOwnPropertyDescriptor(obj, observerProperty).get) {
            Object.defineProperty(obj, observerProperty, {
                get: function () { return _value; }.bind(this),
                set: function (v) {
                    const newValue = v;
                    const oldValue = obj[observerProperty];
                    self._applyValueAndNotifyObservers(obj, observerProperty, componentProperty, newValue, oldValue, false, () => _value = v);
                }.bind(this),
                enumerable: true,
                configurable: true
            });
            // Adapt binding for methods in properties, so methods use this of surrounding object literal
            // if (propertyPath.includes(".") && obj[observerProperty].bind)
            //     obj[observerProperty] = obj[observerProperty].bind(obj);
        }
    }
    _makeArrayObservable(arr, observerProperty, componentProperty, propertyPath) {
        const self = this;
        if (!this._registerNewObserver(arr, observerProperty, this, componentProperty, propertyPath)) {
            arr._emit = function (index, items, deletedItems, action) {
                // Use partial rendering only for change or delete operations with 1 element
                if (items.length == 0)
                    this.lastActionMethod = "DELETE";
                else if (index == null)
                    this.lastActionMethod = "ADD";
                else if (items.length == 1)
                    this.lastActionMethod = "EDIT";
                this.lastActionIndex = index !== null && index !== void 0 ? index : this.length;
                const newValue = items[items.length - 1];
                const oldValue = deletedItems[deletedItems.length - 1];
                ;
                // Return last added, updated or deleted element
                this.lastActionObject = newValue !== null && newValue !== void 0 ? newValue : oldValue;
                self._applyValueAndNotifyObservers(this, observerProperty, componentProperty, newValue, oldValue, true, action);
                // Reset action
                this.lastActionMethod = null;
                this.lastActionIndex = null;
                this.lastActionObject = null;
                this.lastActionPropertyPath = null;
                return this;
            };
            arr.push = function (...items) {
                arr._emit(null, items, [], () => Array.prototype.push.call(this, ...items));
                return arr.length;
            };
            arr.splice = function (index, deleteCount, ...items) {
                const deletedItems = this.slice(index, index + deleteCount);
                if (deleteCount <= 1)
                    arr._emit(index, items, deletedItems, () => Array.prototype.splice.call(this, index, deleteCount, ...items));
                return deletedItems;
            };
            arr.edit = function (index, el) { return this.splice(index, 1, el); };
            arr.delete = function (index) { return this.splice(index, 1); };
            arr.filter = function (predicate) {
                const result = Array.prototype.filter.call(this, predicate);
                // Keep lastActionIndex etc. to enable partial rerendering of filtered/mapped arrays
                result.lastActionMethod = this.lastActionMethod;
                result.lastActionIndex = this.lastActionIndex;
                result.lastActionDerived = true;
                return result;
            };
        }
    }
    _applyValueAndNotifyObservers(obj, observerProperty, componentProperty, newValue, oldValue, arrayNotification, action) {
        if (!this._callBindVariableBeforeChangedHook(obj, observerProperty, newValue, oldValue)
            || !this._callBindVariableBeforePropertyChangedHook(this, componentProperty, observerProperty, newValue, oldValue))
            return;
        action();
        obj._observers.get(observerProperty).forEach((componentDetails, component) => {
            componentDetails.forEach((componentPropertyPaths, componentProperty) => {
                componentPropertyPaths.forEach(componentPropertyPath => {
                    // On arrays if length property is changed, array ist changed, so adapt
                    // property path to match expressions depending on array instead of array.length property
                    if (arrayNotification)
                        componentPropertyPath = componentPropertyPath.replace(".length", "");
                    let bindVariableValue = component.getBindVariable(componentProperty);
                    if (bindVariableValue) {
                        if (!arrayNotification)
                            bindVariableValue.lastActionMethod = "SET";
                        bindVariableValue.lastActionPropertyPath = componentPropertyPath;
                        // Don't assign componentProperty, but use setBindVariable (because bound locals
                        // are not exposed as public properties but are observed as bind variables, e.g. person__it0, person__it1, ...)
                        // component[componentProperty] = bindVariableValue;
                        component.setBindVariable(componentProperty, bindVariableValue);
                        if (!arrayNotification)
                            bindVariableValue.lastActionMethod = null;
                        bindVariableValue.lastActionPropertyPath = null;
                    }
                });
            });
        });
        this._callBindVariableAfterPropertyChangedHook(this, componentProperty, observerProperty, newValue, oldValue);
        this._callBindVariableAfterChangedHook(obj, observerProperty, newValue, oldValue);
    }
    _registerNewObserver(obj, observerProperty, component, componentProperty, componentPropertyPath) {
        let propertyAlreadyObserved = true;
        if (!obj._observers)
            obj._observers = new Map();
        if (!obj._observers.has(observerProperty)) {
            obj._observers.set(observerProperty, new Map());
            propertyAlreadyObserved = false;
        }
        if (!obj._observers.get(observerProperty).has(component))
            obj._observers.get(observerProperty).set(component, new Map());
        if (!obj._observers.get(observerProperty).get(component).has(componentProperty))
            obj._observers.get(observerProperty).get(component).set(componentProperty, []);
        const objObserverList = obj._observers.get(observerProperty).get(component).get(componentProperty);
        if (!objObserverList.includes(componentPropertyPath))
            objObserverList.push(componentPropertyPath);
        return propertyAlreadyObserved;
    }
    _calculateBindings(htmlFunction, bindVariableNames) {
        for (let bindVariableName of bindVariableNames) {
            const propertyPathRegex = new RegExp(`(${bindVariableName})(([\\.\\[][\\w\\]]+)+)`, 'g');
            const propertyIndexRegex = new RegExp(`\\[\\s*(${bindVariableName})(([\\.\\[][\\w\\]]+)+)`, 'g');
            if (!(bindVariableName in this._allBindExpressions))
                this._allBindExpressions[bindVariableName] = [];
            this._calculateBinding(htmlFunction, bindVariableName, propertyPathRegex);
            this._calculateBinding(htmlFunction, bindVariableName, propertyIndexRegex);
            this._makeBindVariableObservable(bindVariableName);
        }
    }
    _calculateBinding(htmlFunction, bindVariableName, regexp) {
        for (const [, , expression] of htmlFunction.matchAll(regexp)) {
            const expr = expression.startsWith(".") ? expression.substring(1) : expression;
            // No real subproperty, e.g. this.value[this.value.length-1] instead of this.value[0].name or this.value[0]["name"]
            if (expression.match(/\[\s*[^"0-9]/) != null)
                continue;
            if (!this._allBindExpressions[bindVariableName].includes(expr))
                this._allBindExpressions[bindVariableName].push(expr);
        }
    }
    _renderFull(parentElement, htmlFunction, locals) {
        const [elements, bindVariables, bindVariableNames] = this._parseHTML(htmlFunction, locals);
        const lastExistingElement = parentElement.childNodes.length;
        while (elements.length > 0) // Elements are extracted from source at appendChild, therefore always first element
            parentElement.appendChild(elements[0]);
        // Incrementally process only those elements recursively that have not been processed via
        // previous renderList or renderContent method within the same render method, so that the
        // same elements are not processed multiple times and added to the observables data structure.
        for (let index = lastExistingElement; index < parentElement.childNodes.length; index++)
            this._processElementBinding(parentElement.childNodes[index], bindVariables, bindVariableNames);
    }
    _removeObserversForBindVariable(bindVariableToDelete) {
        // Remove observer expressions
        if (this._observersForBindVariable.has(bindVariableToDelete))
            for (const [comp] of this._observersForBindVariable.get(bindVariableToDelete)) {
                for (const [attr, expr] of this._observerExpressions.get(comp))
                    if (expr.bindVariableNames.includes(bindVariableToDelete))
                        this._observerExpressions.get(comp).delete(attr);
                if (this._observerExpressions.get(comp).size == 0)
                    this._observerExpressions.delete(comp);
            }
        // Remove observers for bind variable
        this._observersForBindVariable.delete(bindVariableToDelete);
        // Remove bind variable
        delete this._allBindVariables[bindVariableToDelete];
        // Remove all bind expressions for bind variable
        delete this._allBindExpressions[bindVariableToDelete];
    }
    _calculateArrayChange(value, oldValue) {
        if (value.length > oldValue.length)
            value.lastActionMethod = "ADD";
        else if (value.length < oldValue.length)
            value.lastActionMethod = "DELETE";
        else
            value.lastActionMethod = "EDIT";
        // Compare arrays
        const maxArray = value.lastActionMethod == "DELETE" ? oldValue : value;
        for (let i = 0; i < maxArray.length; i++)
            if (value[i] != oldValue[i]) {
                value.lastActionIndex = i;
                value.lastActionObject = maxArray[i];
                // Return calculated action details
                return value;
            }
        // No update action required because arrays are identical
        value.lastActionMethod = "NONE";
        return value;
    }
    _renderUpdate(listProp, value, oldValue) {
        // If oldValue or initial value is of type array and this component
        // is a list component, do partial rendering (otherwise no action is required
        // because if no list is involved, no new html tags have to be created and
        // simple property update and existing dom element attribute update are enough)
        if (Array.isArray(oldValue) && this._lists.size > 0) {
            let elementsBeforeShift = 0;
            // Update all lists depending on changed property, if property is used in rendered list
            if (this._lists.has(listProp))
                for (let i = 0; i < this._lists.get(listProp).length; i++) {
                    elementsBeforeShift = this._renderListUpdate(this._lists.get(listProp)[i], this._static._cachedLists.get(listProp)[i], value, elementsBeforeShift);
                    this._lists.get(listProp)[i].listParentElementIndex += elementsBeforeShift;
                }
        }
    }
    _renderListUpdate(listData, cachedListData, value, elementsBeforeShift) {
        // If rendered list does not map directly to original array because of intermediate mapping, filtering etc.
        // action properties such as value.lastActionIndex are not available or cannot be used and have to be
        // calculated by applying comparison between elements of old and new mapped array
        const renderDerivedValue = cachedListData.listDerived || value.lastActionDerived;
        if (renderDerivedValue) {
            const lastActionIndexBeforeMapping = value.lastActionIndex;
            // Apply mapping function
            value = cachedListData.listFunction.call(this);
            // Caluclate array changes if not complete array reassignment was triggered
            if (typeof lastActionIndexBeforeMapping != "undefined")
                value = this._calculateArrayChange(value, listData.listCurrentData);
        }
        // Change in list does not regard rendered content (e.g. no change in already rendered items)?
        if (value.lastActionMethod == "NONE")
            return elementsBeforeShift;
        // Partial rendering of added, updated or deleted element
        if (typeof value.lastActionIndex != "undefined") {
            this._renderListElementUpdate(listData, cachedListData, value);
            HofLogging.logRenderUpdate(this, cachedListData.listProperty, value, renderDerivedValue ? "Partial (search) rerender" : "Partial (index) rerender");
        }
        else { // Full rerendering, because Array was not modified by adding, deleting or updating one item, but by reassigning a new array  
            // Remove all old elements
            value.lastActionMethod = "DELETE";
            for (let i = 0; i < listData.listCurrentData.length; i++) {
                value.lastActionIndex = 0;
                value.lastActionObject = listData.listCurrentData[i];
                this._renderListElementUpdate(listData, cachedListData, value);
            }
            // Insert new array elements
            value.lastActionMethod = "ADD";
            for (let i = 0; i < value.length; i++) {
                value.lastActionIndex = i;
                this._renderListElementUpdate(listData, cachedListData, value);
            }
            // Reset, so next list has some data
            value.lastActionMethod = undefined;
            value.lastActionIndex = undefined;
            value.lastActionObject = undefined;
            HofLogging.logRenderUpdate(this, cachedListData.listProperty, value, "Full rerender");
        }
        // Save copy to allow comparison with old value on next update for mapped arrays and to support full rendering
        // on assignment of a new array instead of adding, editing or deleting one element of array
        listData.listCurrentData = [...value];
        // Update list parent element depending on list element size
        return this._renderListParentUpdate(listData, cachedListData, elementsBeforeShift);
    }
    _renderListParentUpdate(listData, cachedListData, elementsBeforeShift) {
        const oldRootElementCount = this._root.childNodes.length;
        // Only change rendering if parent element should be rendered based on list size
        if (!cachedListData.listParentElementRenderOnEmptyList) {
            // If list is empty, remove parent element, because no empty ul-elements etc are allowed
            // and if list is not empty but parent element not rendered, add it
            if (listData.listParentElement.childNodes.length == 0) {
                if (this._root.contains(listData.listParentElement))
                    this._root.removeChild(listData.listParentElement);
            }
            else {
                if (!this._root.contains(listData.listParentElement)) {
                    if (this._root.childNodes[listData.listParentElementIndex + elementsBeforeShift])
                        this._root.insertBefore(listData.listParentElement, this._root.childNodes[listData.listParentElementIndex + elementsBeforeShift]);
                    else
                        this._root.appendChild(listData.listParentElement);
                }
            }
        }
        return this._root.childNodes.length - oldRootElementCount + elementsBeforeShift;
    }
    _renderListElementUpdate(listData, cachedListData, value) {
        // Remove node
        if (value.lastActionMethod == "DELETE") {
            this._removeObserversForBindVariable(value.lastActionObject._observableUniqueName);
            // Remove all nodes of item at index
            const elementChangeIndex = value.lastActionIndex * cachedListData.listElementTemplateSize;
            for (let i = 0; i < cachedListData.listElementTemplateSize; i++)
                listData.listParentElement.childNodes[elementChangeIndex].remove();
        }
        else {
            const locals = {};
            locals[cachedListData.listItemVariable] = value[value.lastActionIndex];
            locals[cachedListData.listItemVariable]._observableUniqueName = this._calculateRenderingIterationAwareUniqueName(cachedListData.listItemVariable);
            if (cachedListData.listIndexVariable)
                locals[cachedListData.listIndexVariable] = value.lastActionIndex;
            if (cachedListData.listItemUpdatedVariable)
                locals[cachedListData.listItemUpdatedVariable] = true;
            // Parse new html for added or updated content
            const [elements, bindVariables, bindVariableNames] = this._parseHTML(cachedListData.listElementTemplateFunction, locals);
            cachedListData.listElementTemplateSize = elements.length;
            const elementChangeIndex = value.lastActionIndex * cachedListData.listElementTemplateSize;
            for (let i = 0; i < cachedListData.listElementTemplateSize; i++) {
                // Add or replace html (elements are extracted from source at appendChild, therefore always first element)
                if (value.lastActionMethod == "ADD") {
                    if (listData.listParentElement.childNodes[value.lastActionIndex])
                        listData.listParentElement.insertBefore(elements[0], listData.listParentElement.childNodes[elementChangeIndex + i]);
                    else
                        listData.listParentElement.appendChild(elements[0]);
                    this._processElementBinding(listData.listParentElement.childNodes[elementChangeIndex + i], bindVariables, bindVariableNames);
                }
                else if (value.lastActionMethod == "EDIT") {
                    listData.listParentElement.replaceChild(elements[0], listData.listParentElement.childNodes[elementChangeIndex + i]);
                    this._processElementBinding(listData.listParentElement.childNodes[elementChangeIndex + i], bindVariables, bindVariableNames);
                }
            }
        }
    }
    _makeDerivedVariablesObservable(path, variableName, variableBody, html, functionWrappedGetter) {
        // Make derived bind variables observable by adding referenced bind variables to template
        let referencedBindVariableNames = "/* references: ";
        for (const [, referencedBindVariableName] of variableBody.matchAll(HofHtmlElement.REFERENCED_BIND_VARIABLE_NAMES_REGEX))
            referencedBindVariableNames += `${path}.${referencedBindVariableName.replace("this.", "")}; `;
        referencedBindVariableNames += "*/";
        return html.replaceAll(new RegExp(`([^\\w])${path}\\.${variableName}([^\\w])`, "g"), `$1(${path}${functionWrappedGetter ? "()" : ""}.${variableName} ${referencedBindVariableNames} )$2`);
    }
    _calculateRenderingIterationAwareUniqueName(name) {
        return name + "__it" + (this._renderIteration + 1);
    }
    _calculateTemplateAndBindVariableNames(html, props, locals) {
        // Determine all binding variables
        const bindVariables = Object.keys(props);
        // Add additional local variables to binding
        if (locals) {
            for (let [variableName, variableValue] of Object.entries(locals)) {
                let uniqueBindVariableName = this._calculateRenderingIterationAwareUniqueName(variableName);
                props[uniqueBindVariableName] = variableValue;
                bindVariables.push(uniqueBindVariableName);
                // Replace variables with unique name (needs be done incrementally instead of
                // global matching regex, because global matching regex selects to much
                // with one pattern and as a consequence would pass on some matches)
                let replacedHtml = html;
                do {
                    html = replacedHtml;
                    // Local "updated" variable that references global derived property?
                    if (uniqueBindVariableName in this)
                        uniqueBindVariableName = "this." + uniqueBindVariableName;
                    replacedHtml = html.replace(new RegExp(`([{][^{}]*[^\\w]|[{])${variableName}([^\\w])`), `$1${uniqueBindVariableName}$2`);
                } while (replacedHtml.length != html.length);
            }
        }
        // Make derived global bind variables observable
        const regexp = new RegExp('this((\\.\\w+)*)\\.(\\w+)[^\\w(]', 'g');
        let prop = null;
        for (const [, path, , expr] of html.matchAll(regexp)) {
            let propObj = props;
            if (path) {
                const properties = path.split(".");
                for (prop of properties)
                    if (prop != "")
                        propObj = propObj[prop] || this._derivedProperties[prop].call(this);
            }
            if (this._derivedProperties[prop]) // Derived property of component (function wrapped to support propertyReferences)?
                html = this._makeDerivedVariablesObservable(`this${path}`, expr, this._derivedProperties[prop].toString(), html, false);
            else if (path && Object.getOwnPropertyDescriptor(propObj, expr).get && !Object.getOwnPropertyDescriptor(propObj, expr).set) // Derived component of nested/store object property (not wrapped)?
                html = this._makeDerivedVariablesObservable(`this${path}`, expr, Object.getOwnPropertyDescriptor(propObj, expr).get.toString(), html, false);
        }
        // Encode html tags within expressions because otherwise the parser parses them as separate elements
        // (e.g. <div>() => `${this.persons.length > 0 ? "<h2>Filtered list</h2>" : ""}</div> would be parsed as div and h2 tags)
        html = this._escapeTagsInExpressions(html);
        return [html, bindVariables];
    }
    _escapeTagsInExpressions(html) {
        const stringTokens = ["\"", "'", "`"];
        for (let stringToken of stringTokens) {
            let stringExpressions = html.match(new RegExp(`${stringToken}[^${stringToken}]+${stringToken}`, "g"));
            if (stringExpressions)
                for (let match of stringExpressions)
                    if (match.includes("<"))
                        html = html.replace(match, match.replaceAll("<", "&lt;"));
        }
        return html;
    }
    _processElementBinding(element, bindVariables, bindVariableNames) {
        // Support databinding expressions in attributes (regular DOM elements)
        if ("attributes" in element)
            Array.from(element.attributes).forEach((attr) => {
                if (attr.nodeValue.includes("${"))
                    this._processBindingExpression(element, bindVariables, bindVariableNames, attr.nodeName, attr.nodeValue);
            });
        // Support databinding expressions within tags (TextNodes)
        if ("data" in element) {
            if (element.data.includes("${"))
                this._processTextNodeBinding(element, bindVariables, bindVariableNames, element.data);
        }
        // Edit child elements recursively
        if ("childNodes" in element)
            for (const childElement of Array.from(element.childNodes))
                this._processElementBinding(childElement, bindVariables, bindVariableNames);
        // Render elements with render support      
        if (element instanceof HofHtmlElement)
            element.render();
    }
    _processTextNodeBinding(textNode, bindVariables, bindVariableNames, expr) {
        // Replace text nodes with span elements to support rendering of html content by expressions
        if (textNode.parentNode) {
            var replacementNode = document.createElement('span');
            textNode.parentNode.insertBefore(replacementNode, textNode);
            textNode.parentNode.removeChild(textNode);
            this._processBindingExpression(replacementNode, bindVariables, bindVariableNames, "innerHTML", expr);
        }
        else
            this._processBindingExpression(textNode, bindVariables, bindVariableNames, "data", textNode.data);
    }
    _processBindingExpression(element, bindVariables, bindVariableNames, attr, expr) {
        var _a;
        // Build callable expression to (re)calculate value of attribute based on depending binding variables  
        let attributeExpression = null;
        try {
            attributeExpression = this._buildCallableExpression(attr, expr, bindVariableNames);
        }
        catch (e) {
            throw Error(`Expression '${expr}' of [${element.nodeName}].${attr} cannot be resolved. `
                + `Perhaps you have forgotten some double quotes around attribute ${attr} in template of component [${this.nodeName}] `
                + `or you used double quotes within double quotes of an element attribute, e.g. <element attr="\${ "" }"></element>. `
                + `Double quotes within template literals are currently not supported. Use single quotes or backticks instead!`);
        }
        // Save attribute expression for later execution on bind variable changes
        if (!this._observerExpressions.has(element))
            this._observerExpressions.set(element, new Map());
        this._observerExpressions.get(element).set(attr, attributeExpression);
        // Rebind this of subproperties to parent property
        for (let bindVariableName of attributeExpression.bindVariableNames)
            if ((_a = bindVariables[bindVariableName]) === null || _a === void 0 ? void 0 : _a.bind)
                bindVariables[bindVariableName] = bindVariables[bindVariableName].bind(this); // pass this from parent to child on callbacks that are passed down
        // Determine current values
        const bindVariableValues = this._getBindVariableValues(attributeExpression.bindVariableNames);
        // Get current value of element attribute by evaluating expression
        let value = attributeExpression.execute(...bindVariableValues);
        // Check if attribute expression could be resolved
        // (expression must always return value or null)
        if (typeof value == "undefined")
            throw Error(`Cannot resolve component template expression ${attributeExpression.template}! Please check if all referenced properties are defined within your component implementation!`);
        if (value === null || value === void 0 ? void 0 : value["bind"]) // If value is function, then bind
            value = value.bind(this);
        // Set value
        element[attr] = value;
        // Register combination of element and attribute as observer for each bind variable name
        if (value != null && !value["bind"]) // Do not observe functions
            this._registerElementAttributeAsObserverForBindVariables(element, attr, bindVariables, attributeExpression.bindVariableNames);
    }
    _buildCallableExpression(attr, expr, bindVariableNames) {
        // If expression is the only expression, do not interpret it as string,
        // but evaluate directly so that references to functions can be assigned to properties
        if (attr == "data" || expr.lastIndexOf("${") > 0 || expr.lastIndexOf("}") < expr.length - 1)
            expr = "`" + expr + "`";
        else
            expr = expr.replaceAll("${", "").replaceAll("}", "");
        let referencedBindVariables = [];
        for (const bindVariableName of bindVariableNames) {
            if (expr.includes(bindVariableName))
                referencedBindVariables.push(bindVariableName);
        }
        // Currently, in addition to the local variables (additional variables passed to renderContent/renderList),
        // the WebComponent's properties are also passed as local variables to the WebComponent's attribute function,
        // which is not really necessary, but facilitates the generic handling
        return new AttributeExpression(new Function(...referencedBindVariables, "return " + expr).bind(this), referencedBindVariables, expr);
    }
    _registerElementAttributeAsObserverForBindVariables(element, attr, bindVariables, referencedBindVariableNames) {
        // Add combination of element and attribute to observer structure
        for (let bindVariableName of referencedBindVariableNames) {
            if (!this._observersForBindVariable.has(bindVariableName))
                this._observersForBindVariable.set(bindVariableName, new Map());
            const variableObservable = this._observersForBindVariable.get(bindVariableName);
            if (!variableObservable.has(element))
                variableObservable.set(element, []);
            if (bindVariables[bindVariableName].bind)
                bindVariables[bindVariableName] = bindVariables[bindVariableName].bind(this); // pass this from parent to child on callbacks that are passed down
            variableObservable.get(element).push(attr);
        }
    }
    _getBindVariableValues(bindVariableNames) {
        let result = [];
        for (const b of bindVariableNames)
            result.push(this._allBindVariables[b]);
        return result;
    }
    _updatePropertyObservers(bindVariable) {
        const [bindVariableName, bindVariableValue] = bindVariable;
        // Render partially only if element has already been created (Setters should also be able to be called before component
        // has been created for the first time, which is why state setters only change state here, but have no effect on UI yet).
        if (this._observersForBindVariable.has(bindVariableName)) {
            for (const [element, attrs] of this._observersForBindVariable.get(bindVariableName).entries()) {
                // Remove removed components from bindings
                if (typeof this._observerExpressions.get(element) == "undefined") {
                    this._observersForBindVariable.get(bindVariableName).delete(element);
                    continue;
                }
                ;
                for (const attrName of attrs) {
                    const attrExpr = this._observerExpressions.get(element).get(attrName);
                    if (!bindVariableValue.lastActionPropertyPath || attrExpr.template.includes(bindVariableValue.lastActionPropertyPath)) {
                        // Reevaluate binding expression
                        const bindVariableValues = this._getBindVariableValues(attrExpr.bindVariableNames);
                        const newValue = attrExpr.execute(...bindVariableValues);
                        // Always propagate changes in properties to all observer elements and propagate changes in subproperties only
                        // if subproperty is included in binding expression / template (e.g. if data.selectedPerson.name is changed, only
                        // attributes with bindings to data, data.selectedPerson and data.selectedPerson.name, but e.g. not on data.selectedPerson.age).
                        if (typeof newValue.lastActionIndex != "undefined" || !bindVariableValue.lastActionPropertyPath || attrExpr.template && attrExpr.template.includes(bindVariableValue.lastActionPropertyPath)) {
                            if (element[attrName] != newValue) {
                                element[attrName] = newValue;
                                // Log rerendering of non HofHtmlElements because they include no detailed logging like HofHtmlElements do
                                if (!(element instanceof HofHtmlElement))
                                    HofLogging.logRenderUpdate(element, attrName, newValue, "Full rerender");
                            }
                        }
                    }
                }
            }
        }
    }
}
exports.HofHtmlElement = HofHtmlElement;
HofHtmlElement.REFERENCED_BIND_VARIABLE_NAMES_REGEX = new RegExp('([a-zA-Z_$][\\w]+\\.[\\w\\.]+[\\w])([\\.][\\w]+\\()?', 'g');
HofHtmlElement.HTML_TAGGED_TEMPLATE_REGEX = new RegExp("html\\s*`", "g");
HofHtmlElement.PARENT_PROPERTIES = null; // Properties of HofHtmlElement to differentiate own properties of classes that extend HofHtmlElement
// render function for single html expressions
function item(htmlRenderFunc) { return htmlRenderFunc; }
exports.item = item;
// render function for list html expressions
function list(list, htmlRenderFunc, parentElement = "div", renderParentElementOnEmptyList = false) {
    return { list, htmlRenderFunc, parentElement, renderParentElementOnEmptyList };
}
exports.list = list;
// html template literal, that does not change expression but enables syntax highlighting
const html = (strings, ...exprs) => processTemplate(strings, exprs);
exports.html = html;
// html template literal, that does not change expression but enables syntax highlighting
const css = (strings, ...exprs) => processTemplate(strings, exprs);
exports.css = css;
// Template literal that does not change expression
// https://github.com/lleaff/tagged-template-noop/blob/master/index.js
function processTemplate(strings, exprs) {
    const lastIndex = strings.length - 1;
    return strings.slice(0, lastIndex).reduce((p, s, i) => p + s + exprs[i], '') + strings[lastIndex];
}
class HofLogging {
    static setDebugging(debugging) {
        HofLogging.logPropertyUpdates = debugging;
        HofLogging.logInitialRenderings = debugging;
        HofLogging.logRenderUpdates = debugging;
    }
    static logPropertyUpdate(element, name, value) {
        // Dont log parent property changes since only child props are really updated because of partial rendering
        // and these are additionally logged
        if (HofLogging.logPropertyUpdates && !value.lastActionPropertyPath)
            HofLogging.logElementActivity(element, name, value, "Update");
    }
    static logInitialRendering(element, renderIteration, properties) {
        if (HofLogging.logInitialRenderings && renderIteration == 0)
            for (const prop of Object.keys(properties))
                HofLogging.logElementActivity(element, prop, properties[prop], "Initial render");
    }
    static logRenderUpdate(element, name, value, mode) {
        if (HofLogging.logRenderUpdates)
            HofLogging.logElementActivity(element, name, value, mode);
    }
    static logElementActivity(element, name, value, mode) {
        var _a, _b, _c;
        // Calculate derived property value
        if ((_a = element["_derivedProperties"]) === null || _a === void 0 ? void 0 : _a[name])
            value = element["_derivedProperties"][name].call(element);
        // Filter out function references that are not derived properties on first rendering because they are not observed
        if (value["bind"])
            return;
        // No update was required because rendered part of array did not change
        if (value.lastActionMethod == "NONE")
            return;
        console.log(`${HofLogging._calculateElementDisplayName(element)}: ${mode} of property ${name}: `
            + `${(_b = value.lastActionMethod) !== null && _b !== void 0 ? _b : "SET"} ${JSON.stringify((_c = value.lastActionObject) !== null && _c !== void 0 ? _c : value)}`);
    }
    static _calculateElementDisplayName(element) {
        var _a;
        let elementName = (_a = element.nodeName) !== null && _a !== void 0 ? _a : "TEXT";
        if (element instanceof HofHtmlElement)
            return elementName + "[" + element._instanceId + "]";
        // Look for HofHtmlElements above this HofHtmlElement
        for (let node = element; node; node = node.parentNode) {
            if (node.toString() === "[object ShadowRoot]" && node["host"] instanceof HofHtmlElement)
                elementName = node["host"].nodeName + "[" + node["host"]._instanceId + "]" + ">" + elementName; // HofHtmlElement that contains this HofHtmlElement was found
        }
        return elementName;
    }
}
HofLogging.setDebugging(true);
