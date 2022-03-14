(() => {
  // src/hof.ts
  (function() {
    const originalBind = Function.prototype.bind;
    if (originalBind.toString().includes("[native code]"))
      Function.prototype.bind = function() {
        const result = originalBind.apply(this, arguments);
        result.toString = () => this.toString();
        return result;
      };
  })();
  (function() {
    if (!String.prototype.replaceAll) {
      String.prototype.replaceAll = function(find, replace) {
        let s = "", index, next;
        while (~(next = this.indexOf(find, index))) {
          s += this.substring(index, next) + replace;
          index = next + find.length;
        }
        return s + this.substring(index);
      };
    }
  })();
  var AttributeExpression = class {
    constructor(execute, bindVariableNames, template) {
      this.execute = execute;
      this.bindVariableNames = bindVariableNames;
      this.template = template;
    }
  };
  var CachedListData = class {
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
  };
  var CachedContentData = class {
    constructor(contentTemplateFunction, updatedVariable) {
      this.contentTemplateFunction = contentTemplateFunction;
      this.updatedVariable = updatedVariable;
    }
  };
  var ListData = class {
    constructor(listParentElement, listParentElementIndex, listCurrentData) {
      this.listParentElement = listParentElement;
      this.listParentElementIndex = listParentElementIndex;
      this.listCurrentData = listCurrentData;
    }
  };
  var _HofHtmlElement = class extends HTMLElement {
    constructor(tagName = "div") {
      super();
      this._instanceId = 0;
      this._tagName = null;
      this._root = null;
      this._shadow = null;
      this._properties = {};
      this._derivedProperties = {};
      this._allBindVariables = null;
      this._allBindExpressions = {};
      this._observersForBindVariable = /* @__PURE__ */ new Map();
      this._observerExpressions = /* @__PURE__ */ new Map();
      this._renderIteration = -1;
      this._lists = /* @__PURE__ */ new Map();
      this._static = null;
      this.templates = [];
      this.styles = null;
      this.init = null;
      this.dispose = null;
      if (_HofHtmlElement.PARENT_PROPERTIES == null)
        _HofHtmlElement.PARENT_PROPERTIES = Object.getOwnPropertyNames(this);
      this._static = this.constructor;
      if (typeof this._static._cached == "undefined") {
        this._static._cached = false;
        this._static._cachedInstanceId = 0;
        this._static._cachedLists = /* @__PURE__ */ new Map();
        this._static._cachedTemplates = [];
        this._static._cachedPropertyReferences = /* @__PURE__ */ new Map();
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
      if (this.styles != null) {
        const styles = document.createElement("style");
        styles.innerHTML = this.styles;
        this._shadow.appendChild(styles);
      }
      this._makeComponentPropertiesObservable();
      this._restoreDerivedPropertyFunctions();
      if (this._isRootHofHtmlElement())
        this.render();
      (_a = this.init) == null ? void 0 : _a.call(this);
    }
    disconnectedCallback() {
      var _a;
      (_a = this.dispose) == null ? void 0 : _a.call(this);
    }
    render() {
      if (!this._static._cached) {
        this._static._cached = true;
        this._renderAndCacheTemplates();
      } else
        this._renderCachedTemplates();
      HofLogging.logInitialRendering(this, 0, this._properties);
      HofLogging.logInitialRendering(this, 0, this._derivedProperties);
      this._static._cachedPropertyReferences = null;
    }
    _renderAndCacheTemplates() {
      if (typeof this.templates == "string") {
        const implementation = this._static.toString();
        const implementationWithTemplateFunction = implementation.replace(/templates\s*=\s*html\s*`/m, "static templates = () => html`");
        if (implementationWithTemplateFunction != implementation)
          this.templates = new Function("return " + implementationWithTemplateFunction)().templates;
        else
          throw Error("String templates are only allowed if you assign an html`` expression! If you require more features, assign a lambda expression such as () => someExpression.");
      }
      if (Array.isArray(this.templates))
        for (const template of this.templates)
          this._renderAndCacheTemplate(template);
      else
        this._renderAndCacheTemplate(this.templates);
    }
    _renderAndCacheTemplate(template) {
      if (template["bind"])
        this._renderAndCacheContent(template);
      else {
        const listPropertyName = this._findPropertyForValue(template["list"]);
        const restoredGetter = Object.getOwnPropertyDescriptor(this, listPropertyName).get;
        const listParentElementName = template["parentElement"];
        const renderParentElementOnEmptyList = template["renderParentElementOnEmptyList"];
        const listPropertyFunction = this._derivedProperties[listPropertyName] ? restoredGetter : new Function(`return this.${listPropertyName};`);
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
      for (let node = this; node; node = node.parentNode)
        if (node.toString() === "[object ShadowRoot]" && node["host"] instanceof _HofHtmlElement)
          return false;
      return true;
    }
    _makeDerivedPropertyFunctions() {
      const prototype = Object.getPrototypeOf(this);
      for (const name of Object.getOwnPropertyNames(prototype).filter((name2) => name2 != "constructor")) {
        if (Object.getOwnPropertyDescriptor(prototype, name).get) {
          Object.defineProperty(this, name, {
            get: function() {
              return Object.getOwnPropertyDescriptor(prototype, name).get;
            },
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
      throw Error("Property could not be resolved! If you used a private property with leading #, please replace it with _, because private properties are currently not supported within templates!");
    }
    _makeComponentPropertiesObservable() {
      this._forEachNonDerivedProperty((prop, obj) => {
        const initialValue = obj[prop];
        if (this._static._cachedPropertyReferences && !this._static._cachedPropertyReferences.has(prop))
          this._static._cachedPropertyReferences.set(prop, initialValue);
        Object.defineProperty(this, prop, {
          get: function() {
            return this.getBindVariable(prop, initialValue);
          },
          set: function(value) {
            const oldValue = this.getBindVariable(prop, initialValue);
            if (this._callBindVariableBeforeChangedHook(this, prop, value, oldValue)) {
              this.setBindVariable(prop, value);
              this._callBindVariableAfterChangedHook(this, prop, value, oldValue);
            }
          },
          enumerable: true,
          configurable: true
        });
        this._createObjectProxy(this, prop);
      });
    }
    getBindVariable(name, initialValue = void 0) {
      var _a, _b;
      if (this._allBindVariables)
        return this._allBindVariables[name];
      return (_b = (_a = this._properties[name]) != null ? _a : this.getAttribute(name)) != null ? _b : initialValue;
    }
    setBindVariable(name, value) {
      const oldValue = this.getBindVariable(name);
      if (typeof oldValue == "object" || typeof value == "object" || oldValue != value || value["lastActionMethod"]) {
        if (!value.lastActionPropertyPath) {
          this._properties[name] = value;
          if (this._allBindVariables)
            this._allBindVariables[name] = value;
        }
        HofLogging.logPropertyUpdate(this, name, value);
      }
      if (this._allBindVariables)
        this._makeBindVariableObservable(name);
      this._updatePropertyObservers([name, value]);
      this._renderUpdate(name, value, oldValue);
    }
    _renderAndCacheContent(html2) {
      const expression = html2.toString();
      const [updatedVariable] = expression.substring(0, expression.indexOf("=>")).replace("(", "").replace(")", "").split(",").map((x) => x.trim());
      const cachedContentData = new CachedContentData(html2, updatedVariable);
      this._renderCachedContent(cachedContentData);
      this._static._cachedTemplates.push(cachedContentData);
    }
    _renderCachedContent(cachedContentData) {
      const locals = {};
      if (cachedContentData.updatedVariable) {
        let initValue = false;
        locals[cachedContentData.updatedVariable] = initValue;
        if (cachedContentData.updatedVariable in this)
          throw Error(`Lambda parameter for updated state must not be named like existing property of component! If you want to keep property name "${cachedContentData.updatedVariable}", use another lambda parameter name.`);
        Object.defineProperty(this, this._calculateRenderingIterationAwareUniqueName(cachedContentData.updatedVariable), {
          get: function() {
            const oldValue = initValue;
            if (!initValue)
              initValue = true;
            return oldValue;
          }
        });
      }
      this._renderFull(this._root, cachedContentData.contentTemplateFunction, locals);
    }
    _renderAndCacheList(listFunction, listElementTemplateFunction, listParentElementName, listParentElementRenderOnEmptyList) {
      const expression = listElementTemplateFunction.toString();
      const [listItemVariable, listIndexVariable, listItemUpdatedVariable] = expression.substring(0, expression.indexOf("=>")).replace("(", "").replace(")", "").split(",").map((x) => x.trim());
      const listExpression = listFunction.toString();
      const listReferencedProps = [];
      for (const [, prop] of listExpression.matchAll(/this\.(\w+)/gm))
        listReferencedProps.push(prop);
      const listDerived = listExpression.startsWith("get ");
      const listProperty = listDerived ? listFunction.name.substring(4).trim() : listReferencedProps[0];
      const cachedListData = new CachedListData(listParentElementName, listParentElementRenderOnEmptyList, listProperty, listDerived, listFunction, listReferencedProps, listItemVariable, listIndexVariable, listItemUpdatedVariable, listElementTemplateFunction, 0);
      for (const listProp of listReferencedProps) {
        const cachedLists = this._static._cachedLists;
        if (!cachedLists.has(listProp))
          cachedLists.set(listProp, []);
        cachedLists.get(listProp).push(cachedListData);
      }
      this._static._cachedTemplates.push(cachedListData);
      cachedListData.listElementTemplateSize = this._renderCachedList(cachedListData);
    }
    _getFilteredProperties(propNames) {
      return Object.fromEntries(Object.entries(this._allBindVariables).filter(([key]) => propNames.includes(key)));
    }
    _renderCachedList(cachedListData) {
      const listData = cachedListData.listFunction.call(this);
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
      if (cachedListData.listParentElementRenderOnEmptyList || listData.length > 0)
        this._root.appendChild(listParentElement);
      const listParentElementIndex = this._root.childNodes.length;
      for (const listProp of cachedListData.listReferencedProps) {
        if (!this._lists.has(listProp))
          this._lists.set(listProp, []);
        this._lists.get(listProp).push(new ListData(listParentElement, listParentElementIndex, [...listData]));
      }
      const listElementTemplateSize = i > 0 ? listParentElement.childNodes.length / i : this._parseHTML(cachedListData.listElementTemplateFunction, locals)[0].length;
      return listElementTemplateSize;
    }
    _addBindExpressionForLists(listProps) {
      for (const listProp of listProps) {
        if (!(listProp in this._allBindExpressions))
          this._allBindExpressions[listProp] = [];
        if (!this._allBindExpressions[listProp].includes("length"))
          this._allBindExpressions[listProp].push("length");
      }
    }
    _calculateBindVariables() {
      let result = {};
      this._forEachNonDerivedProperty((prop, obj) => result[prop] = obj[prop]);
      this._allBindVariables = result;
    }
    _forEachNonDerivedProperty(func) {
      for (const name of Object.getOwnPropertyNames(this).filter((p) => !_HofHtmlElement.PARENT_PROPERTIES.includes(p))) {
        const propDesc = Object.getOwnPropertyDescriptor(this, name);
        if (!propDesc.get || propDesc.configurable)
          func(name, this);
      }
      const prototype = Object.getPrototypeOf(this);
      for (const name of Object.getOwnPropertyNames(prototype).filter((p) => p != "constructor")) {
        if (!Object.getOwnPropertyDescriptor(prototype, name).get)
          func(name, prototype);
      }
    }
    _convertToTemplateExpression(buildFunction) {
      let expression = buildFunction.toString();
      for (const [, match] of expression.matchAll(/(html`[\s\S]*`\s*\}\s*)"/g))
        expression = expression.replace(match, match.replaceAll('"', "&quot;"));
      const isRegularFunction = expression.startsWith("function");
      const expressionStart = isRegularFunction ? expression.indexOf("return") : expression.indexOf("=>");
      if (expressionStart == -1)
        throw Error(`Render function definition '${expression}' is not valid! It has to be of type arrow function (optionalParams) => string or of type function() { return string }.`);
      expression = isRegularFunction ? expression.substring(expressionStart + 6, expression.lastIndexOf("}")) : expression.substring(expressionStart + 2);
      expression = expression.trim();
      expression = expression.replaceAll(_HofHtmlElement.HTML_TAGGED_TEMPLATE_REGEX, "`");
      if (expression.startsWith("`") && expression.endsWith("`"))
        expression = expression.substring(1, expression.length - 1);
      else
        expression = "${" + expression + "}";
      return expression.trim();
    }
    _parseHTML(htmlFunction, locals) {
      const html2 = this._convertToTemplateExpression(htmlFunction);
      if (this._allBindVariables == null)
        this._calculateBindVariables();
      const allBindVariables = this._allBindVariables;
      const [template, bindVariableNames] = this._calculateTemplateAndBindVariableNames(html2, allBindVariables, locals);
      this._calculateBindings(template, bindVariableNames);
      let temp = document.createElement("template");
      temp.innerHTML = template;
      const elements = temp.content.childNodes;
      this._renderIteration++;
      return [elements, allBindVariables, bindVariableNames];
    }
    _makeBindVariableObservable(bindVariableName) {
      if (this._derivedProperties[bindVariableName])
        return;
      for (const bindingExpression of this._allBindExpressions[bindVariableName])
        this._makeBindVariableStructureObservable(bindVariableName, bindingExpression);
    }
    _makeBindVariableStructureObservable(bindVariableName, bindingExpression) {
      const o = this._allBindVariables[bindVariableName];
      const props = bindingExpression.split(".");
      let propObj = o;
      let propertyPath = bindVariableName;
      for (let i = 0; i < props.length; i++) {
        let lastProp = props[i];
        propertyPath += `.${props[i]}`;
        if (typeof propObj == "undefined")
          return;
        if (typeof propObj == "object") {
          if (!Array.isArray(propObj) && propertyPath.includes(".") && propObj[lastProp].bind)
            propObj[lastProp] = propObj[lastProp].bind(propObj);
          if (propObj[lastProp]["bind"])
            continue;
          if (!Array.isArray(propObj))
            this._makeObjectPropertyObservable(propObj, lastProp, bindVariableName, propertyPath);
          else
            this._makeArrayPropertyObservable(propObj, lastProp, bindVariableName, propertyPath);
          this._createObjectProxy(propObj, lastProp);
        }
        propObj = propObj[props[i]];
      }
    }
    _createObjectProxy(propObj, lastProp) {
      if (!Array.isArray(propObj[lastProp]))
        return;
      if (propObj[lastProp]["__isProxy"])
        return;
      Object.defineProperty(propObj, lastProp, {
        value: new Proxy(propObj[lastProp], {
          set(o, prop, value) {
            if (o._emit && !isNaN(prop)) {
              const index = parseInt(prop);
              if (index > o.length)
                throw Error(`You cannot add an element at index ${index} because elements before would get the value undefined and this cannot be observed!`);
              else if (typeof value == "undefined" || value["_spliceAction"] == "DELETE")
                o._emit(index, "DELETE", null, o[index], () => Array.prototype.splice.call(o, index, 1));
              else if (index == o.length || value["_spliceAction"] == "ADD")
                o._emit(index, "ADD", value, null, () => Array.prototype.splice.call(o, index, 0, value));
              else
                o._emit(index, "EDIT", value, o[index], () => Array.prototype.splice.call(o, index, 1, value));
              if (typeof value != "undefined")
                value["_spliceAction"] = void 0;
            } else
              o[prop] = value;
            return true;
          },
          get(target, key) {
            if (key !== "__isProxy") {
              return target[key];
            }
            return true;
          }
        }),
        enumerable: true,
        configurable: true
      });
    }
    _callBindVariableBeforeChangedHook(obj, prop, newValue, oldValue) {
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
      if (typeof oldValue == "string" && oldValue.startsWith("$"))
        return;
      const hookMethodName = `${prop}AfterChanged`;
      if (obj[hookMethodName])
        obj[hookMethodName](newValue, oldValue);
    }
    _callBindVariableBeforePropertyChangedHook(obj, prop, subProp, newValue, oldValue) {
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
      if (typeof oldValue == "string" && oldValue.startsWith("$"))
        return;
      const hookMethodName = `${prop}AfterPropertyChanged`;
      if (obj[hookMethodName])
        obj[hookMethodName](subProp, newValue, oldValue);
    }
    _makeObjectPropertyObservable(obj, observerProperty, componentProperty, propertyPath) {
      let _value = obj[observerProperty];
      const self = this;
      this._registerNewObserver(obj, observerProperty, this, componentProperty, propertyPath);
      if (!Object.getOwnPropertyDescriptor(obj, observerProperty).set && !Object.getOwnPropertyDescriptor(obj, observerProperty).get) {
        Object.defineProperty(obj, observerProperty, {
          get: function() {
            return _value;
          }.bind(this),
          set: function(v) {
            const newValue = v;
            const oldValue = obj[observerProperty];
            self._applyValueAndNotifyObservers(obj, observerProperty, componentProperty, newValue, oldValue, false, () => _value = v);
          }.bind(this),
          enumerable: true,
          configurable: true
        });
      }
    }
    _makeArrayPropertyObservable(arr, observerProperty, componentProperty, propertyPath) {
      const self = this;
      if (!this._registerNewObserver(arr, observerProperty, this, componentProperty, propertyPath)) {
        arr._emit = function(index, method, newValue, oldValue, action) {
          this.lastActionIndex = index;
          this.lastActionMethod = method;
          this.lastActionObject = method == "DELETE" ? oldValue : newValue;
          self._applyValueAndNotifyObservers(this, observerProperty, componentProperty, newValue, oldValue, true, action);
          this.lastActionMethod = null;
          this.lastActionIndex = null;
          this.lastActionObject = null;
          this.lastActionPropertyPath = null;
          return this;
        };
        arr.push = function(...items) {
          this.splice(this.length, 0, ...items);
          return this.length;
        };
        arr.splice = function(index, deleteCount, ...items) {
          const deletedItems = this.slice(index, index + deleteCount);
          let i = 0;
          for (i = 0; i < Math.min(items.length, deletedItems.length); i++) {
            items[i]["_spliceAction"] = "EDIT";
            this[index + i] = items[i];
          }
          for (let j = i; j < deletedItems.length; j++) {
            this[index + i] = void 0;
          }
          for (let j = i; j < items.length; j++) {
            items[i]["_spliceAction"] = "ADD";
            this[index + j] = items[j];
          }
          return deletedItems;
        };
        arr.edit = function(index, el) {
          return this.splice(index, 1, el);
        };
        arr.delete = function(index) {
          return this.splice(index, 1);
        };
        arr.filter = function(predicate) {
          const result = Array.prototype.filter.call(this, predicate);
          result.lastActionMethod = this.lastActionMethod;
          result.lastActionIndex = this.lastActionIndex;
          result.lastActionObject = this.lastActionObject;
          result.lastActionDerived = true;
          return result;
        };
      }
    }
    _applyValueAndNotifyObservers(obj, observerProperty, componentProperty, newValue, oldValue, arrayNotification, action) {
      if (!this._callBindVariableBeforeChangedHook(obj, observerProperty, newValue, oldValue) || !this._callBindVariableBeforePropertyChangedHook(this, componentProperty, observerProperty, newValue, oldValue))
        return;
      action();
      obj._observers.get(observerProperty).forEach((componentDetails, component) => {
        componentDetails.forEach((componentPropertyPaths, componentProperty2) => {
          componentPropertyPaths.forEach((componentPropertyPath) => {
            if (arrayNotification)
              componentPropertyPath = componentPropertyPath.replace(".length", "");
            let bindVariableValue = component.getBindVariable(componentProperty2);
            if (bindVariableValue) {
              if (!arrayNotification)
                bindVariableValue.lastActionMethod = "SET";
              bindVariableValue.lastActionPropertyPath = componentPropertyPath;
              component.setBindVariable(componentProperty2, bindVariableValue);
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
        obj._observers = /* @__PURE__ */ new Map();
      if (!obj._observers.has(observerProperty)) {
        obj._observers.set(observerProperty, /* @__PURE__ */ new Map());
        propertyAlreadyObserved = false;
      }
      if (!obj._observers.get(observerProperty).has(component))
        obj._observers.get(observerProperty).set(component, /* @__PURE__ */ new Map());
      if (!obj._observers.get(observerProperty).get(component).has(componentProperty))
        obj._observers.get(observerProperty).get(component).set(componentProperty, []);
      const objObserverList = obj._observers.get(observerProperty).get(component).get(componentProperty);
      if (!objObserverList.includes(componentPropertyPath))
        objObserverList.push(componentPropertyPath);
      return propertyAlreadyObserved;
    }
    _calculateBindings(htmlFunction, bindVariableNames) {
      for (let bindVariableName of bindVariableNames) {
        const regexp = new RegExp(`(${bindVariableName})((\\.[\\w]+)+)`, "g");
        if (!this._allBindExpressions[bindVariableName])
          this._allBindExpressions[bindVariableName] = [];
        for (const [, , expression] of htmlFunction.matchAll(regexp)) {
          const expr = expression.substring(1);
          if (!this._allBindExpressions[bindVariableName].includes(expr))
            this._allBindExpressions[bindVariableName].push(expr);
        }
        this._makeBindVariableObservable(bindVariableName);
      }
    }
    _renderFull(parentElement, htmlFunction, locals) {
      const [elements, bindVariables, bindVariableNames] = this._parseHTML(htmlFunction, locals);
      const lastExistingElement = parentElement.childNodes.length;
      while (elements.length > 0)
        parentElement.appendChild(elements[0]);
      for (let index = lastExistingElement; index < parentElement.childNodes.length; index++)
        this._processElementBinding(parentElement.childNodes[index], bindVariables, bindVariableNames);
    }
    _removeObserversForBindVariable(bindVariableToDelete) {
      if (this._observersForBindVariable.has(bindVariableToDelete))
        for (const [comp] of this._observersForBindVariable.get(bindVariableToDelete)) {
          for (const [attr, expr] of this._observerExpressions.get(comp))
            if (expr.bindVariableNames.includes(bindVariableToDelete))
              this._observerExpressions.get(comp).delete(attr);
          if (this._observerExpressions.get(comp).size == 0)
            this._observerExpressions.delete(comp);
        }
      this._observersForBindVariable.delete(bindVariableToDelete);
      delete this._allBindVariables[bindVariableToDelete];
      delete this._allBindExpressions[bindVariableToDelete];
    }
    _calculateArrayChange(value, oldValue) {
      if (value.length > oldValue.length)
        value.lastActionMethod = "ADD";
      else if (value.length < oldValue.length)
        value.lastActionMethod = "DELETE";
      else
        value.lastActionMethod = "EDIT";
      const maxArray = value.lastActionMethod == "DELETE" ? oldValue : value;
      for (let i = 0; i < maxArray.length; i++)
        if (value[i] != oldValue[i]) {
          value.lastActionIndex = i;
          value.lastActionObject = maxArray[i];
          return value;
        }
      value.lastActionMethod = "NONE";
      return value;
    }
    _renderUpdate(listProp, value, oldValue) {
      if (Array.isArray(oldValue) && this._lists.size > 0) {
        let elementsBeforeShift = 0;
        if (this._lists.has(listProp))
          for (let i = 0; i < this._lists.get(listProp).length; i++) {
            elementsBeforeShift = this._renderListUpdate(this._lists.get(listProp)[i], this._static._cachedLists.get(listProp)[i], value, elementsBeforeShift);
            this._lists.get(listProp)[i].listParentElementIndex += elementsBeforeShift;
          }
      }
    }
    _renderListUpdate(listData, cachedListData, value, elementsBeforeShift) {
      const renderDerivedValue = cachedListData.listDerived || value.lastActionDerived;
      if (renderDerivedValue) {
        const lastActionIndexBeforeMapping = value.lastActionIndex;
        value = cachedListData.listFunction.call(this);
        if (typeof lastActionIndexBeforeMapping != "undefined")
          value = this._calculateArrayChange(value, listData.listCurrentData);
      }
      if (value.lastActionMethod == "NONE")
        return elementsBeforeShift;
      if (typeof value.lastActionIndex != "undefined") {
        this._renderListElementUpdate(listData, cachedListData, value);
        HofLogging.logRenderUpdate(this, cachedListData.listProperty, value, renderDerivedValue ? "Partial (search) rerender" : "Partial (index) rerender");
      } else {
        value.lastActionMethod = "DELETE";
        for (let i = 0; i < listData.listCurrentData.length; i++) {
          value.lastActionIndex = 0;
          value.lastActionObject = listData.listCurrentData[i];
          this._renderListElementUpdate(listData, cachedListData, value);
        }
        value.lastActionMethod = "ADD";
        for (let i = 0; i < value.length; i++) {
          value.lastActionIndex = i;
          this._renderListElementUpdate(listData, cachedListData, value);
        }
        value.lastActionMethod = void 0;
        value.lastActionIndex = void 0;
        value.lastActionObject = void 0;
        HofLogging.logRenderUpdate(this, cachedListData.listProperty, value, "Full rerender");
      }
      listData.listCurrentData = [...value];
      return this._renderListParentUpdate(listData, cachedListData, elementsBeforeShift);
    }
    _renderListParentUpdate(listData, cachedListData, elementsBeforeShift) {
      const oldRootElementCount = this._root.childNodes.length;
      if (!cachedListData.listParentElementRenderOnEmptyList) {
        if (listData.listParentElement.childNodes.length == 0) {
          if (this._root.contains(listData.listParentElement))
            this._root.removeChild(listData.listParentElement);
        } else {
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
      if (value.lastActionMethod == "DELETE") {
        this._removeObserversForBindVariable(value.lastActionObject._observableUniqueName);
        const elementChangeIndex = value.lastActionIndex * cachedListData.listElementTemplateSize;
        for (let i = 0; i < cachedListData.listElementTemplateSize; i++)
          listData.listParentElement.childNodes[elementChangeIndex].remove();
      } else {
        const locals = {};
        locals[cachedListData.listItemVariable] = value[value.lastActionIndex];
        locals[cachedListData.listItemVariable]._observableUniqueName = this._calculateRenderingIterationAwareUniqueName(cachedListData.listItemVariable);
        if (cachedListData.listIndexVariable)
          locals[cachedListData.listIndexVariable] = value.lastActionIndex;
        if (cachedListData.listItemUpdatedVariable)
          locals[cachedListData.listItemUpdatedVariable] = true;
        const [elements, bindVariables, bindVariableNames] = this._parseHTML(cachedListData.listElementTemplateFunction, locals);
        cachedListData.listElementTemplateSize = elements.length;
        const elementChangeIndex = value.lastActionIndex * cachedListData.listElementTemplateSize;
        for (let i = 0; i < cachedListData.listElementTemplateSize; i++) {
          if (value.lastActionMethod == "ADD") {
            if (listData.listParentElement.childNodes[value.lastActionIndex])
              listData.listParentElement.insertBefore(elements[0], listData.listParentElement.childNodes[elementChangeIndex + i]);
            else
              listData.listParentElement.appendChild(elements[0]);
            this._processElementBinding(listData.listParentElement.childNodes[elementChangeIndex + i], bindVariables, bindVariableNames);
          } else if (value.lastActionMethod == "EDIT") {
            listData.listParentElement.replaceChild(elements[0], listData.listParentElement.childNodes[elementChangeIndex + i]);
            this._processElementBinding(listData.listParentElement.childNodes[elementChangeIndex + i], bindVariables, bindVariableNames);
          }
        }
      }
    }
    _makeDerivedVariablesObservable(path, variableName, variableBody, html2, functionWrappedGetter) {
      let referencedBindVariableNames = "/* references: ";
      for (const [, referencedBindVariableName] of variableBody.matchAll(_HofHtmlElement.REFERENCED_BIND_VARIABLE_NAMES_REGEX))
        referencedBindVariableNames += `${path}.${referencedBindVariableName.replace("this.", "")}; `;
      referencedBindVariableNames += "*/";
      return html2.replaceAll(new RegExp(`([^\\w])${path}\\.${variableName}([^\\w])`, "g"), `$1(${path}${functionWrappedGetter ? "()" : ""}.${variableName} ${referencedBindVariableNames} )$2`);
    }
    _calculateRenderingIterationAwareUniqueName(name) {
      return name + "__it" + (this._renderIteration + 1);
    }
    _calculateTemplateAndBindVariableNames(html2, props, locals) {
      const bindVariables = Object.keys(props);
      if (locals) {
        for (let [variableName, variableValue] of Object.entries(locals)) {
          let uniqueBindVariableName = this._calculateRenderingIterationAwareUniqueName(variableName);
          props[uniqueBindVariableName] = variableValue;
          bindVariables.push(uniqueBindVariableName);
          let replacedHtml = html2;
          do {
            html2 = replacedHtml;
            if (uniqueBindVariableName in this)
              uniqueBindVariableName = "this." + uniqueBindVariableName;
            replacedHtml = html2.replace(new RegExp(`([{][^{}]*[^\\w]|[{])${variableName}([^\\w])`), `$1${uniqueBindVariableName}$2`);
          } while (replacedHtml.length != html2.length);
        }
      }
      const regexp = new RegExp("this((\\.\\w+)*)\\.(\\w+)[^\\w(]", "g");
      let prop = null;
      for (const [, path, , expr] of html2.matchAll(regexp)) {
        let propObj = props;
        if (path) {
          const properties = path.split(".");
          for (prop of properties)
            if (prop != "")
              propObj = propObj[prop] || this._derivedProperties[prop].call(this);
        }
        if (this._derivedProperties[prop])
          html2 = this._makeDerivedVariablesObservable(`this${path}`, expr, this._derivedProperties[prop].toString(), html2, false);
        else if (path && Object.getOwnPropertyDescriptor(propObj, expr).get && !Object.getOwnPropertyDescriptor(propObj, expr).set)
          html2 = this._makeDerivedVariablesObservable(`this${path}`, expr, Object.getOwnPropertyDescriptor(propObj, expr).get.toString(), html2, false);
      }
      html2 = this._escapeTagsInExpressions(html2);
      return [html2, bindVariables];
    }
    _escapeTagsInExpressions(html2) {
      const stringTokens = ['"', "'", "`"];
      for (let stringToken of stringTokens) {
        let stringExpressions = html2.match(new RegExp(`${stringToken}[^${stringToken}]+${stringToken}`, "g"));
        if (stringExpressions) {
          for (let match of stringExpressions)
            if (match.includes("<"))
              html2 = html2.replace(match, match.replaceAll("<", "&lt;"));
        }
      }
      return html2;
    }
    _processElementBinding(element, bindVariables, bindVariableNames) {
      if ("attributes" in element)
        Array.from(element.attributes).forEach((attr) => {
          if (attr.nodeValue.includes("${"))
            this._processBindingExpression(element, bindVariables, bindVariableNames, attr.nodeName, attr.nodeValue);
        });
      if ("data" in element) {
        if (element.data.includes("${"))
          this._processTextNodeBinding(element, bindVariables, bindVariableNames, element.data);
      }
      if ("childNodes" in element)
        for (const childElement of Array.from(element.childNodes))
          this._processElementBinding(childElement, bindVariables, bindVariableNames);
      if (element instanceof _HofHtmlElement)
        element.render();
    }
    _processTextNodeBinding(textNode, bindVariables, bindVariableNames, expr) {
      if (textNode.parentNode) {
        var replacementNode = document.createElement("span");
        textNode.parentNode.insertBefore(replacementNode, textNode);
        textNode.parentNode.removeChild(textNode);
        this._processBindingExpression(replacementNode, bindVariables, bindVariableNames, "innerHTML", expr);
      } else
        this._processBindingExpression(textNode, bindVariables, bindVariableNames, "data", textNode.data);
    }
    _processBindingExpression(element, bindVariables, bindVariableNames, attr, expr) {
      var _a;
      let attributeExpression = null;
      try {
        attributeExpression = this._buildCallableExpression(attr, expr, bindVariableNames);
      } catch (e) {
        throw Error(`Expression '${expr}' of [${element.nodeName}].${attr} cannot be resolved. Perhaps you have forgotten some double quotes around attribute ${attr} in template of component [${this.nodeName}] or you used double quotes within double quotes of an element attribute, e.g. <element attr="\${ "" }"></element>. Double quotes within template literals are currently not supported. Use single quotes or backticks instead!`);
      }
      if (!this._observerExpressions.has(element))
        this._observerExpressions.set(element, /* @__PURE__ */ new Map());
      this._observerExpressions.get(element).set(attr, attributeExpression);
      for (let bindVariableName of attributeExpression.bindVariableNames)
        if ((_a = bindVariables[bindVariableName]) == null ? void 0 : _a.bind)
          bindVariables[bindVariableName] = bindVariables[bindVariableName].bind(this);
      const bindVariableValues = this._getBindVariableValues(attributeExpression.bindVariableNames);
      let value = attributeExpression.execute(...bindVariableValues);
      if (typeof value == "undefined")
        throw Error(`Cannot resolve component template expression ${attributeExpression.template}! Please check if all referenced properties are defined within your component implementation!`);
      if (value == null ? void 0 : value["bind"])
        value = value.bind(this);
      element[attr] = value;
      if (value != null && !value["bind"])
        this._registerElementAttributeAsObserverForBindVariables(element, attr, bindVariables, attributeExpression.bindVariableNames);
    }
    _buildCallableExpression(attr, expr, bindVariableNames) {
      if (attr == "data" || expr.lastIndexOf("${") > 0 || expr.lastIndexOf("}") < expr.length - 1)
        expr = "`" + expr + "`";
      else
        expr = expr.replaceAll("${", "").replaceAll("}", "");
      let referencedBindVariables = [];
      for (const bindVariableName of bindVariableNames) {
        if (expr.includes(bindVariableName))
          referencedBindVariables.push(bindVariableName);
      }
      return new AttributeExpression(new Function(...referencedBindVariables, "return " + expr).bind(this), referencedBindVariables, expr);
    }
    _registerElementAttributeAsObserverForBindVariables(element, attr, bindVariables, referencedBindVariableNames) {
      for (let bindVariableName of referencedBindVariableNames) {
        if (!this._observersForBindVariable.has(bindVariableName))
          this._observersForBindVariable.set(bindVariableName, /* @__PURE__ */ new Map());
        const variableObservable = this._observersForBindVariable.get(bindVariableName);
        if (!variableObservable.has(element))
          variableObservable.set(element, []);
        if (bindVariables[bindVariableName].bind)
          bindVariables[bindVariableName] = bindVariables[bindVariableName].bind(this);
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
      if (this._observersForBindVariable.has(bindVariableName)) {
        for (const [element, attrs] of this._observersForBindVariable.get(bindVariableName).entries()) {
          if (typeof this._observerExpressions.get(element) == "undefined") {
            this._observersForBindVariable.get(bindVariableName).delete(element);
            continue;
          }
          ;
          for (const attrName of attrs) {
            const attrExpr = this._observerExpressions.get(element).get(attrName);
            if (!bindVariableValue.lastActionPropertyPath || attrExpr.template.includes(bindVariableValue.lastActionPropertyPath)) {
              const bindVariableValues = this._getBindVariableValues(attrExpr.bindVariableNames);
              const newValue = attrExpr.execute(...bindVariableValues);
              if (typeof newValue.lastActionIndex != "undefined" || !bindVariableValue.lastActionPropertyPath || attrExpr.template && attrExpr.template.includes(bindVariableValue.lastActionPropertyPath)) {
                if (element[attrName] != newValue) {
                  element[attrName] = newValue;
                  if (!(element instanceof _HofHtmlElement))
                    HofLogging.logRenderUpdate(element, attrName, newValue, "Full rerender");
                }
              }
            }
          }
        }
      }
    }
  };
  var HofHtmlElement = _HofHtmlElement;
  HofHtmlElement.REFERENCED_BIND_VARIABLE_NAMES_REGEX = new RegExp("([a-zA-Z_$][\\w]+\\.[\\w\\.]+[\\w])([\\.][\\w]+\\()?", "g");
  HofHtmlElement.HTML_TAGGED_TEMPLATE_REGEX = new RegExp("html\\s*`", "g");
  HofHtmlElement.PARENT_PROPERTIES = null;
  function item(htmlRenderFunc) {
    return htmlRenderFunc;
  }
  function list(list2, htmlRenderFunc, parentElement = "div", renderParentElementOnEmptyList = false) {
    return { list: list2, htmlRenderFunc, parentElement, renderParentElementOnEmptyList };
  }
  var html = (strings, ...exprs) => processTemplate(strings, exprs);
  var css = (strings, ...exprs) => processTemplate(strings, exprs);
  function processTemplate(strings, exprs) {
    const lastIndex = strings.length - 1;
    return strings.slice(0, lastIndex).reduce((p, s, i) => p + s + exprs[i], "") + strings[lastIndex];
  }
  var HofLogging = class {
    static setDebugging(debugging) {
      HofLogging.logPropertyUpdates = debugging;
      HofLogging.logInitialRenderings = debugging;
      HofLogging.logRenderUpdates = debugging;
    }
    static logPropertyUpdate(element, name, value) {
      if (HofLogging.logPropertyUpdates && (!value.lastActionPropertyPath || value.lastActionPropertyPath.endsWith(name)))
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
      var _a;
      const lastActionObject = value.lastActionObject;
      if (value["bind"])
        return;
      if (value.lastActionMethod == "NONE")
        return;
      console.log(`${HofLogging._calculateElementDisplayName(element)}: ${mode} of property ${name}: ${(_a = value.lastActionMethod) != null ? _a : "SET"} ${JSON.stringify(lastActionObject != null ? lastActionObject : value)}`);
    }
    static _calculateElementDisplayName(element) {
      var _a;
      let elementName = (_a = element.nodeName) != null ? _a : "TEXT";
      if (element instanceof HofHtmlElement)
        return elementName + "[" + element._instanceId + "]";
      for (let node = element; node; node = node.parentNode) {
        if (node.toString() === "[object ShadowRoot]" && node["host"] instanceof HofHtmlElement)
          elementName = node["host"].nodeName + "[" + node["host"]._instanceId + "]>" + elementName;
      }
      return elementName;
    }
  };
  HofLogging.setDebugging(false);

  // src/esbuild-wrapper/hof.esbuild.ts
  window.HofHtmlElement = HofHtmlElement;
  window.item = item;
  window.list = list;
  window.html = html;
  window.css = css;
})();
