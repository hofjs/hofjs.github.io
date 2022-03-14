import { HofHtmlElement, html } from "../../lib/esm/hof.js"
import "./person-data.js";

export class AppContent extends HofHtmlElement {
    templates = html`<person-data></person-data>`
}

customElements.define("app-content", AppContent);