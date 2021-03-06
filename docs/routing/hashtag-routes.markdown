---
layout: page
parent: Routing
nav_order: 1
---

# Hashtag routes

```html
<!DOCTYPE html>
<html>
<head>
    <title>Personlist app (function style)</title>
    <script src="../lib/nomodule/hof.js"></script>
    <script src="lib/nomodule/hofrouter.js"></script>
    <script>
        class GlobalApp extends HofHtmlElement {
            constructor() {
                super();
                HofRouter.configRoutes(this._shadow, 'router', {
                    pageOverview: { url: "#page-overview", component: PageOverview },
                    pageDetails: { url: "#page-details/:id", component: PageDetails, aliases: ["#pagedetails/:id", "#details/:id"] },
                    pageOverview2: { url: "#overview", redirect: "#page-overview" },
                    default: { url: "*", redirect: "router:pageOverview" }
                });
            }

            templates = html`
                <h1>Routing app (hashtag routes)</h1>
                <a href="#page-overview">Overview</a>
                <a href="#page-details/1?param1=Hello&param2=World">Details</a>

                <a href="#pagedetails/2?param1=Hello&param2=World">Details 2</a>

                <a href="#details/3?param1=Hello&param2=World">Details 3</a>

                <a href="router:pageDetails(id=4, param1=Hello, param2=World)">Details 4</a>

                <div id="router"></div>
            `
        }

        customElements.define("global-app", GlobalApp);

        class PageOverview extends HofHtmlElement {
            count = 10;
            
            beforeRouting(newValue, oldValue) {
                // return false;
            }
            
            afterRouting(newValue, oldValue) {


            }
            
            templates = html`
                <h1>Overview page</h1><div>${new Date()}</div>
            `
        }

        customElements.define("page-overview", PageOverview);

        class PageDetails extends HofHtmlElement {
            id = 0;

            constructor() {
                super();
                HofRouter.configRoutes(this._shadow, 'subRouter', {
                    tab1: { url: "#page-details/:id/tab1", component: PageDetailsTab, params: { tabId: 1 } },
                    tab2: { url: "#page-details/:id/tab2", component: PageDetailsTab, params: { tabId: 2 } },
                });
            }

            beforeRouting(newValue, oldValue) {
                // return false;
            }

            afterRouting(newValue, oldValue) {

            }

            templates = html`
                <h1>Details page</h1>
                <div>Specified id: ${this.id}</div>
                <div>Specified url: ${HofRouter.current.url}</div>
                <div>Specified query: ${HofRouter.current.query}</div>
                <ul>
                    <li>param1: ${HofRouter.current.params.param1 || "-"}</li>
                    <li>param2: ${HofRouter.current.params.param2 || "-"}</li>
                </ul>

                <h2>Nested routing</h2>
                <a href="#page-details/${this.id}/tab1">Tab 1</a>
                <a href="#page-details/${this.id}/tab2">Tab 2</a>

                <button onclick="${() => HofRouter.go(-1)}">Back</button>
                <button onclick="${() => HofRouter.push('#page-overview')}">Overview</button>

                <a href="router:go(-1)">Back</a>
                <a href="router:push('#pageOverview')">Overview</a>

                <div id="subRouter"></div>
            `
        }

        customElements.define("page-details", PageDetails);

        class PageDetailsTab extends HofHtmlElement {
            tabId = 0;

            templates = html`
                <h1>Tab ${this.tabId}</h1>
                <div>${new Date()}</div>
            `
        }

        customElements.define("page-details-tab", PageDetailsTab)
    </script>
</head>
<body>
   <global-app></global-app>
</body>
</html>
```

## Rendered webpage

<iframe src="../../samples/routing/routingapp (hashtag routes).html" width="100%" height="500px"></iframe>