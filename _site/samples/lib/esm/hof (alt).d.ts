interface PropertyMap {
    [propertyName: string]: Object & Partial<{
        bind(thisArg: Object, ...args: Object[]): Object;
    }>;
}
interface BindVariableExpressionsMap {
    [bindVariableName: string]: string[];
}
export interface ObjectObservable {
    lastActionMethod: string;
    lastActionIndex: number;
    lastActionObject: Object;
    lastActionPropertyPath: string;
    lastActionDerived: boolean;
    _observableUniqueName: string;
    _observers: Map<string, Map<HofHtmlElement, Map<string, string[]>>>;
    _observersPropertyPaths: Map<HofHtmlElement, Map<string, string[]>>;
}
export interface ArrayObservable<T> extends ObjectObservable {
    _emit: (index: number, items: T[], deletedItems: T[], action: Function) => Array<T>;
    edit: (index: number, element: T) => T[];
    delete: (index: number) => T[];
}
declare type Object = globalThis.Object & Partial<ObjectObservable>;
declare type Array<T> = globalThis.Array<T> & Partial<ArrayObservable<T>>;
declare type DOMElement = HTMLElement | Text | Node | HofHtmlElement;
declare type TemplateStringFunction = (listItemParameter?: Object) => string;
declare class AttributeExpression {
    execute: Function;
    bindVariableNames: string[];
    template: string;
    constructor(execute: Function, bindVariableNames: string[], template: string);
}
declare class CachedListData {
    listParentElementName: string;
    listParentElementRenderOnEmptyList: boolean;
    listProperty: string;
    listDerived: boolean;
    listFunction: Function;
    listReferencedProps: Array<string>;
    listItemVariable: string;
    listIndexVariable: string;
    listItemUpdatedVariable: string;
    listElementTemplateFunction: TemplateStringFunction;
    listElementTemplateSize: number;
    constructor(listParentElementName: string, listParentElementRenderOnEmptyList: boolean, listProperty: string, listDerived: boolean, listFunction: Function, listReferencedProps: Array<string>, listItemVariable: string, listIndexVariable: string, listItemUpdatedVariable: string, listElementTemplateFunction: TemplateStringFunction, listElementTemplateSize: number);
}
declare class CachedContentData {
    contentTemplateFunction: TemplateStringFunction;
    updatedVariable: string;
    constructor(contentTemplateFunction: TemplateStringFunction, updatedVariable: string);
}
declare class ListData {
    listParentElement: Node;
    listParentElementIndex: number;
    listCurrentData: Array<Object>;
    constructor(listParentElement: Node, listParentElementIndex: number, listCurrentData: Array<Object>);
}
interface HofHtmlElementSubclass extends Function {
    _cached: boolean;
    _cachedInstanceId: number;
    _cachedTemplates: Array<CachedListData | CachedContentData>;
    _cachedLists: Map<string, Array<CachedListData>>;
    _cachedPropertyReferences: Map<string, Object>;
}
export declare abstract class HofHtmlElement extends HTMLElement {
    _instanceId: number;
    _tagName: string;
    _root: HTMLElement;
    _shadow: ShadowRoot;
    _properties: PropertyMap;
    _derivedProperties: {};
    _allBindVariables: PropertyMap;
    _allBindExpressions: BindVariableExpressionsMap;
    _observersForBindVariable: Map<string, Map<DOMElement, string[]>>;
    _observerExpressions: Map<DOMElement, Map<string, AttributeExpression>>;
    _renderIteration: number;
    _lists: Map<string, ListData[]>;
    _static: HofHtmlElementSubclass;
    static REFERENCED_BIND_VARIABLE_NAMES_REGEX: RegExp;
    static HTML_TAGGED_TEMPLATE_REGEX: RegExp;
    static PARENT_PROPERTIES: Array<string>;
    constructor(tagName?: string);
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): void;
    _renderAndCacheTemplates(): void;
    _renderAndCacheTemplate(template: Function | Object): void;
    _renderCachedTemplates(): void;
    templates: Array<Object> | string;
    styles: string;
    init: Function;
    dispose: Function;
    _isRootHofHtmlElement(): boolean;
    _makeDerivedPropertyFunctions(): void;
    _restoreDerivedPropertyFunctions(): any;
    _findPropertyForValue(propertyValue: Object): string;
    _makeComponentPropertiesObservable(): void;
    getBindVariable(name: string, initialValue?: Object): Object;
    setBindVariable(name: string, value: Object): void;
    _renderAndCacheContent(html: TemplateStringFunction): void;
    _renderCachedContent(cachedContentData: CachedContentData): void;
    _renderAndCacheList(listFunction: Function, listElementTemplateFunction: TemplateStringFunction, listParentElementName: string, listParentElementRenderOnEmptyList: boolean): void;
    _getFilteredProperties(propNames: string[]): {
        [k: string]: globalThis.Object & Partial<ObjectObservable> & Partial<{
            bind(thisArg: Object, ...args: Object[]): Object;
        }>;
    };
    _renderCachedList(cachedListData: CachedListData): number;
    _addBindExpressionForLists(listProps: Array<string>): void;
    _calculateBindVariables(): void;
    _forEachNonDerivedProperty(func: (prop: string, obj: Object) => void): void;
    _convertToTemplateExpression(buildFunction: TemplateStringFunction): string;
    _parseHTML(htmlFunction: TemplateStringFunction, locals: PropertyMap): [NodeListOf<ChildNode>, PropertyMap, string[]];
    _makeBindVariableObservable(bindVariableName: string): void;
    _makeBindVariableStructureObservable(bindVariableName: string, bindingExpression: string): void;
    _callBindVariableBeforeChangedHook(obj: Object, prop: string, newValue: Object, oldValue: Object | string): boolean;
    _callBindVariableAfterChangedHook(obj: Object, prop: string, newValue: Object, oldValue: Object | string): void;
    _callBindVariableBeforePropertyChangedHook(obj: Object, prop: string, subProp: string, newValue: Object, oldValue: Object | string): boolean;
    _callBindVariableAfterPropertyChangedHook(obj: Object, prop: string, subProp: string, newValue: Object, oldValue: Object | string): void;
    _makeObjectObservable(obj: Object, observerProperty: string, componentProperty: string, propertyPath: string): void;
    _makeArrayObservable(arr: Array<Object>, observerProperty: string, componentProperty: string, propertyPath: string): void;
    _applyValueAndNotifyObservers(obj: Object, observerProperty: string, componentProperty: string, newValue: Object, oldValue: object, arrayNotification: boolean, action: Function): void;
    _registerNewObserver(obj: Object | Array<Object>, observerProperty: string, component: HofHtmlElement, componentProperty: string, componentPropertyPath: string): boolean;
    _calculateBindings(htmlFunction: string, bindVariableNames: string[]): void;
    _calculateBinding(htmlFunction: string, bindVariableName: string, regexp: RegExp): void;
    _renderFull(parentElement: Node, htmlFunction: TemplateStringFunction, locals: PropertyMap): void;
    _removeObserversForBindVariable(bindVariableToDelete: string): void;
    _calculateArrayChange(value: Array<Object>, oldValue: Array<Object>): Array<Object>;
    _renderUpdate(listProp: string, value: Object, oldValue: Object): void;
    _renderListUpdate(listData: ListData, cachedListData: CachedListData, value: Array<Object>, elementsBeforeShift: number): number;
    _renderListParentUpdate(listData: ListData, cachedListData: CachedListData, elementsBeforeShift: number): number;
    _renderListElementUpdate(listData: ListData, cachedListData: CachedListData, value: Array<Object>): void;
    _makeDerivedVariablesObservable(path: string, variableName: string, variableBody: string, html: string, functionWrappedGetter: boolean): string;
    _calculateRenderingIterationAwareUniqueName(name: string): string;
    _calculateTemplateAndBindVariableNames(html: string, props: PropertyMap, locals: PropertyMap): [string, string[]];
    _escapeTagsInExpressions(html: string): string;
    _processElementBinding(element: DOMElement, bindVariables: PropertyMap, bindVariableNames: string[]): void;
    _processTextNodeBinding(textNode: Text, bindVariables: PropertyMap, bindVariableNames: string[], expr: string): void;
    _processBindingExpression(element: DOMElement, bindVariables: PropertyMap, bindVariableNames: string[], attr: string, expr: string): void;
    _buildCallableExpression(attr: string, expr: string, bindVariableNames: string[]): AttributeExpression;
    _registerElementAttributeAsObserverForBindVariables(element: DOMElement, attr: string, bindVariables: PropertyMap, referencedBindVariableNames: string[]): void;
    _getBindVariableValues(bindVariableNames: string[]): (globalThis.Object & Partial<ObjectObservable> & Partial<{
        bind(thisArg: Object, ...args: Object[]): Object;
    }>)[];
    _updatePropertyObservers(bindVariable: [string, Object]): void;
}
export declare function item(htmlRenderFunc: Function): Function;
export declare function list(list: Array<Object>, htmlRenderFunc: Function, parentElement?: string, renderParentElementOnEmptyList?: boolean): {
    list: Array<Object>;
    htmlRenderFunc: Function;
    parentElement: string;
    renderParentElementOnEmptyList: boolean;
};
export declare const html: (strings: TemplateStringsArray, ...exprs: Object[]) => string;
export declare const css: (strings: TemplateStringsArray, ...exprs: Object[]) => string;
export {};
