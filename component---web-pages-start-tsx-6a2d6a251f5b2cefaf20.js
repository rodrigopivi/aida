(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{113:function(e,t,n){"use strict";var r;function a(){var e=function(e,t){t||(t=e.slice(0));return Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(["\n    text-align: center;\n    font-size: 19px;\n"]);return a=function(){return e},e}Object.defineProperty(t,"__esModule",{value:!0}),t.Logo=t.ColoredText=void 0,n(114);var o=((r=n(90))&&r.__esModule?r:{default:r}).default.div.withConfig({displayName:"Logo__ColoredText",componentId:"sc-1ib5m8j-0"})(["font-weight:bold;color:#1890ff;display:inline-block;text-decoration:none;background-image:linear-gradient(to right,#1890ff 25%,#c4ce35 50%,#ac24e2 75%,#1890ff 100%);-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text;background-size:300% auto;&.static{background-position:-215% center;}&.animated{@keyframes text-gradient{to{background-position:-300% center;}}animation:text-gradient 16s ease-in-out infinite;}"]);t.ColoredText=o;var i=o.extend(a());t.Logo=i},116:function(e,t,n){var r;e.exports=(r=n(117))&&r.default||r},117:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=c(n(0)),a=c(n(2)),o=c(n(23)),i=c(n(3));function c(e){return e&&e.__esModule?e:{default:e}}function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var u=function(e){var t=e.location,n=i.default.getResourcesForPathnameSync(t.pathname);return r.default.createElement(o.default,function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),r.forEach(function(t){l(e,t,n[t])})}return e}({location:t,pageResources:n},n.json))};u.propTypes={location:a.default.shape({pathname:a.default.string.isRequired}).isRequired};var f=u;t.default=f},131:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(){return a.createElement(o.default,{key:"helmet",title:"Aida",meta:[{name:"description",content:"Build amazing conversational experiences"},{content:"aida, chatito, chatbots, ai chatbots, nlu, nlp, natural language processing, tensorflowjs, keras, named entity recognition, text classification",name:"keywords"}]},a.createElement("link",{rel:"shortcut icon",href:"/favicon.ico"}),a.createElement("link",{rel:"apple-touch-icon",sizes:"180x180",href:"/apple-touch-icon.png"}),a.createElement("link",{rel:"icon",type:"image/png",sizes:"32x32",href:"/favicon-32x32.png"}),a.createElement("link",{rel:"icon",type:"image/png",sizes:"16x16",href:"/favicon-16x16.png"}),a.createElement("link",{rel:"manifest",href:"/site.webmanifest"}),a.createElement("link",{rel:"mask-icon",href:"/safari-pinned-tab.svg",color:"#5bbad5"}),a.createElement("meta",{name:"msapplication-TileColor",content:"#da532c"}),a.createElement("meta",{name:"theme-color",content:"#fcfcfc"}),a.createElement("meta",{name:"viewport",content:"initial-scale=1.0, width=device-width"}))};var r,a=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(0)),o=(r=n(200))&&r.__esModule?r:{default:r}},132:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=t.InnerPaddedContent=t.InnerContent=void 0,n(201);var a=d(n(202));n(151);var o=d(n(89));n(207);var i=d(n(208));n(114);var c=d(n(97)),l=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(0)),u=d(n(90)),f=n(113);function d(e){return e&&e.__esModule?e:{default:e}}function s(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function p(e,t){return!t||"object"!==r(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function y(e){return(y=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function m(e,t){return(m=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}var b=i.default.Content,g=i.default.Footer,h=/^\/start(\/.*)?$/i,v=/^\/overview(\/.*)?$/i,O=/^\/demo(\/.*)?$/i,w=/^\/train(\/.*)?$/i,P=(0,u.default)(b).withConfig({displayName:"Layout__InnerContent",componentId:"sc-11gw4mw-0"})(["> p{text-align:justify;}background:#fcfcfc;min-height:'95vh';"]);t.InnerContent=P;var j=(0,u.default)(P).withConfig({displayName:"Layout__InnerPaddedContent",componentId:"sc-11gw4mw-1"})(["padding:28px 28px 28px 52px;"]);t.InnerPaddedContent=j;var _=function(e){function t(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),p(this,y(t).apply(this,arguments))}var n,r,u;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&m(e,t)}(t,l.Component),n=t,(r=[{key:"render",value:function(){var e="-1";h.test(this.props.location.pathname)?e="0":w.test(this.props.location.pathname)?e="1":O.test(this.props.location.pathname)?e="2":v.test(this.props.location.pathname)&&(e="3");var t=this.props.addPadding?j:P;return l.createElement(i.default,{style:{minHeight:"100vh"}},l.createElement(i.default,{style:{flexDirection:"row"}},l.createElement(i.default.Sider,{width:200,breakpoint:"lg",collapsedWidth:"0",theme:"light",style:{backgroundColor:"#fcfcfc"}},l.createElement(f.Logo,{style:{textAlign:"center",width:200,padding:24},className:"static"},l.createElement(c.default,{to:"/"},"< Aida />")),l.createElement(a.default,{theme:"light",mode:"inline",defaultSelectedKeys:[e],style:{background:"#fcfcfc"}},l.createElement(a.default.Item,{key:"0"},l.createElement(c.default,{to:"/start"},l.createElement(o.default,{type:"right-circle-o"}),"Getting started")),l.createElement(a.default.Item,{key:"1"},l.createElement(c.default,{to:"/train"},l.createElement(o.default,{type:"right-circle-o"}),"Train assistant")),l.createElement(a.default.Item,{key:"2"},l.createElement(c.default,{to:"/demo"},l.createElement(o.default,{type:"right-circle-o"}),"Demo")),l.createElement(a.default.Item,{key:"3"},l.createElement(c.default,{to:"/overview"},l.createElement(o.default,{type:"right-circle-o"}),"Technical Overview"))),l.createElement("div",{style:{padding:"24px",textAlign:"center"}},l.createElement("a",{href:"https://github.com/rodrigopivi/aida",title:"Aida",style:{fontSize:26}},l.createElement(o.default,{type:"github"})))),l.createElement(i.default,{style:{padding:"24px 0 0 24px"}},l.createElement(t,null,this.props.children),l.createElement(g,{style:{textAlign:"center"}},"Aida © 2018 Rodrigo Pimentel"))))}}])&&s(n.prototype,r),u&&s(n,u),t}();t.default=_},198:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.graphql=function(){throw new Error("It appears like Gatsby is misconfigured. Gatsby related `graphql` calls are supposed to only be evaluated at compile time, and then compiled away,. Unfortunately, something went wrong and the query was left in the compiled code.\n\n.Unless your site has a complex or custom babel/Gatsby configuration this is likely a bug in Gatsby.")},Object.defineProperty(t,"Link",{enumerable:!0,get:function(){return o.default}}),Object.defineProperty(t,"withPrefix",{enumerable:!0,get:function(){return o.withPrefix}}),Object.defineProperty(t,"navigate",{enumerable:!0,get:function(){return o.navigate}}),Object.defineProperty(t,"push",{enumerable:!0,get:function(){return o.push}}),Object.defineProperty(t,"replace",{enumerable:!0,get:function(){return o.replace}}),Object.defineProperty(t,"navigateTo",{enumerable:!0,get:function(){return o.navigateTo}}),Object.defineProperty(t,"waitForRouteChange",{enumerable:!0,get:function(){return i.waitForRouteChange}}),Object.defineProperty(t,"PageRenderer",{enumerable:!0,get:function(){return c.default}}),Object.defineProperty(t,"parsePath",{enumerable:!0,get:function(){return l.default}}),t.StaticQuery=t.StaticQueryContext=void 0;var r=u(n(0)),a=u(n(2)),o=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(97)),i=n(21),c=u(n(116)),l=u(n(22));function u(e){return e&&e.__esModule?e:{default:e}}var f=r.default.createContext({});t.StaticQueryContext=f;var d=function(e){return r.default.createElement(f.Consumer,null,function(t){return e.data||t[e.query]&&t[e.query].data?(e.render||e.children)(e.data?e.data.data:t[e.query].data):r.default.createElement("div",null,"Loading (StaticQuery)")})};t.StaticQuery=d,d.propTypes={data:a.default.object,query:a.default.string.isRequired,render:a.default.func,children:a.default.func}},59:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.query=t.default=void 0;var r=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(0)),a=i(n(131)),o=i(n(132));function i(e){return e&&e.__esModule?e:{default:e}}t.default=function(e){var t=e.location,n=e.data;return r.createElement(o.default,{location:t,addPadding:!0},r.createElement(a.default,null),r.createElement("div",{dangerouslySetInnerHTML:{__html:n.allFile.edges[0].node.childMarkdownRemark.html}}))};t.query="2333243642"}}]);
//# sourceMappingURL=component---web-pages-start-tsx-6a2d6a251f5b2cefaf20.js.map