dojo.provide("CodeGlass.base");

dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");

// Why do we have to include this???
dojo.require("dojox.dtl.tag.loader");
dojo.require("dojox.dtl.tag.logic");
dojo.require("dojox.dtl.tag.loop");
dojo.require("dojox.dtl.filter.lists");
dojo.require("dojox.dtl.tag.logic");
dojo.require("dojox.dtl.filter.dates");
dojo.require("dojox.dtl.utils.date");
dojo.require("dojox.dtl.filter.strings");
dojo.require("dojox.dtl.filter.htmlstrings");

// make it fancy
dojo.require("dojo.fx");

// Code beautifying
dojo.require("dojox.highlight");
dojo.require("dojox.highlight.languages._www");
dojo.require("CodeGlass.HTML-Beautify");

dojo.require("dojox.html._base");

//dojo.registerModulePath("CodeGlass.plugins", "../CodeGlass/plugins/dojo");

dojo.declare("CodeGlass.base",
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		Simple widget allowing you to create complex demos
	//		for documentation projects
	// description:
	//		CodeClass allows...

	// width:
	//		default width of the viewer
	width: "700",

	// height:
	//		default height of the viewer
	height: "400",

	// src:
	//		optional src parameter to display external URL
	//		e.g. http://www.google.com
	src: "",

	// plugins:
	//		Plugins which get hooked into CodeGlass
	plugins: [
		  "dojo.version", "dojo.i18n",
		  "dojo.themes", "dojo.a11y", "dojo.dir"
	],

	// chrome:
	//		Chrome to be used for CodeGlass viewer
	chrome: "default",

	// pluginArgs:
	//		Object of arguments which get passed to all plugins
	pluginArgs: {},

	// type:
	//		Viewer type
	//		Can be type, inline and basic
	type: "dialog",

	constructor: function(){
		// summary:
		//		Declare properties we inject into the plugins
		//		This gets done here because as properties of
		//		the base object they would be the same for all
		//		instances.

		this.injectToolbars = [];
		this.injectVars = [];
	},

	postMixInProperties: function(){
		// summary:
		//		parse the child nodes and put the contents into
		//		the content object which then can be used by
		//		the dialog or other content display mechanisms

		// content:
		//		The Dom nodes of the srcNodeRef which we will
		//		parse.
		this.content = {};

		if (this.src){
			this.content.src = this.src;
		}else{
			this.content = this.parseNodes(this.srcNodeRef)
		}

		// Setting template path. This will define the basic l&f of
		// CodeGlass
		this["templatePath"] = dojo.moduleUrl(
			"CodeGlass.chromes."+this.chrome, "template.html"
		);
	},

	postCreate: function(){
		// summary:
		//		We do the preparation for the respective view
		//		here. Plugins get loaded dynamically and on
		//		asynch load we initialize CodeGlass

		// check whether we display an inline CodeGlass or a dialog
		var d = dojo;
		if (this.type == "dialog" || this.type == "basic"){
			d.place(this.viewerNode, d.body(), "last");
			d.removeClass(
				this.type == "dialog" ?
					this.nodeDialog : this.nodeBasic
				, "displayNone");

			d.connect(window, "onresize", this, "_position");
			d.subscribe("codeglass/open", this, function(t){
				if (this.isOpen && t != this){
					this.hide();
				}
			});
		}

		// FIXME: this should be hanled via a CSS class
		if (this.type == "basic"){
			d.style(this.domNode, "display", "inline");
		}

		// Register plugins
		d.forEach(this.plugins, function(plg){
			d["require"]("CodeGlass.plugins."+plg);
		}, this);

		d.addOnLoad(dojo.hitch(this, function(){
			this._initPlugins();
			this._setupViewer();
		}));
	},

	_initPlugins: function(){
		// summary:
		//		Create an instance of every loaded plugin and
		//		subscribe to plugin change events to allow
		//		cross plugin communication.

		this.pluginInstances = []; // Resetting plugin instances
		this.pluginSharedVars = []; // Resetting plugin shared vars

		dojo.forEach(this.plugins, function(plg){
			var 	o = dojo.getObject("CodeGlass.plugins."+plg),
				instance = new o({
					sharedVars: this.pluginSharedVars,
					vars: this.pluginArgs,
					codeGlassBaseId: this.id
				})
			;

			this.pluginInstances.push(instance);
			this._preparePlugin(instance);
		}, this);

		dojo.subscribe("CodeGlass/plugin/change/" + this.id, this, function(p, base){
			this._refreshViewer();
		});
	},

	_preparePlugin: function(instance){
		// summary:
		//		retrieves the plugin info object so CodeGlass
		//		knows what to inject into its view.

		var props = instance.getVars();
		if (props.injectToolbar){
			// Init injectToolbars object
			if (!this.injectToolbars[props.injectToolbar]){
				 this.injectToolbars[props.injectToolbar] = [];
			}
			this.injectToolbars[props.injectToolbar]
				.push(instance.domNode);
		}

		// If the plugin has iframeProps we add those to the injectVars
		// object so CodeGlass can use them in the to be parsed
		// template
		if (props.iframeProps){
			for(var p in props.iframeProps){
				if (!this.injectVars[p]){
					this.injectVars[p] = "";
				}
				this.injectVars[p] += props.iframeProps[p];
			}
		}
	},

	_refreshViewer: function(){
		// summary:
		//	Reretrieves the plugin info object and rerenders the
		//	view. This is used by the plugins in case their values
		//	change and they require CodeGlass to reflect that
		//	change in the view.

		this.injectToolbars = [];
		this.injectVars = [];
		dojo.forEach(this.pluginInstances, function(plugin){
			this._preparePlugin(plugin);
		}, this);

		// FIXME: It might be nicer if this was a setter
		// and not a property
		this.viewer.toolbars = this.injectToolbars;
		this.viewer.iframeVars = this.injectVars;
		this.viewer._setup();
	},

	_setupViewer: function(){
		// summary:
		//	The actual CodeGlass.CodeViewer will get instantiated
		//	here. Toolbars and iframeVars get injected into the
		//	object here as well.
		var v = this.viewer = new CodeGlass.CodeViewer({
			id: this.id+"_Content",
			content: this.content,
			viewerBox: { w: this.width, h: this.height },
			iframeTemplate: dojo["cache"](
				"CodeGlass.chromes."+this.chrome, "iframe.html"
			),
			toolbars: this.injectToolbars,
			iframeVars: this.injectVars,
			showHeader: ( 	// this is a rather special property
					// since it is only of use in the case
					// that we display the header in a
					// dialog. Maybe this can be done nicer
				this.type == "inline" && this.src.length ?
				false : true
			)
		}, this.viewerNode);

		dojo.addClass(v.domNode, "CodeGlassViewer"+this.chrome);
		if (this.type == "dialog" || this.type == "basic"){
			// FIXME: this doesn't get cleaned up correctly
			dojo.query(".header .close", v.domNode)
				.removeClass("displayNone")
				.onclick(dojo.hitch(this, function(e){
					this.hide();
				})
			);
		}else{
			dojo.removeClass(v.domNode, "displayNone");
			v._setupIframe();

			dojo.addClass(v.domNode, "CodeGlassInline"+this.chrome);
		}
	},

	show: function(e){
		// summary:
		//		show the dialog and position it correctly
		//		on screen
		e.preventDefault(e);

		if (this.isOpen){
			return;
		}

		this.ce = dojo.coords(e.target, true);
		this._position();

		var v = this.viewer;
		v._toggleView();

		dojo.publish("codeglass/open", [this]);

		dojo.animateProperty({
			node: v.domNode,
			beforeBegin: dojo.hitch(this, function(){
				dojo.removeClass(v.domNode, "displayNone");
				dojo.query(".wrapper", v.domNode).style({
					"visibility": "hidden"
				});
			}),
			properties: {
				width: { start: this.ce.w, end: this.width},
				height: { start: this.ce.h, end: this.height},
				top: { start: this.ce.y, end: this.top },
				left: { start: this.ce.x, end: this.left }
			},
			duration: 300,
			onEnd: dojo.hitch(this, function(){
				dojo.style(v.loader, "opacity", "0");
				dojo.query(".wrapper", v.domNode).style({
					"visibility": "visible"
				});
				v._setupIframe();
				this.isOpen = true;
			})
		}).play();
	},

	hide: function(e){
		// summary:
		//		hide dialog

		var v = this.viewer;
		dojo.query(".wrapper", v.domNode)
			.style("visibility", "hidden");

		dojo.animateProperty({
			node: v.domNode,
			properties: {
				width: this.ce.w,
				height: this.ce.h,
				top: this.ce.y,
				left: this.ce.x
			},
			onEnd: dojo.hitch(this, function(){
				dojo.addClass(v.domNode, "displayNone");
				this.isOpen = false;
			})
		}).play();
	},

	_position: function(){
		// summary:
		//		positions dialog and background layer and
		//		additionally sizes background layer correctly

		// IE fires this even before we initialized the viewer
		if (!this.viewer || !this.viewer.domNode){
			return;
		}

		var dim = dijit.getViewport();

		this.top = dim.t+dim.h/2-this.height/2;
		this.left = dim.l+dim.w/2-this.width/2;

		dojo.style(this.viewer.domNode, {
			top: this.top+"px",
			left: this.left+"px"
		});
	},

	parseNodes: function(node){
		var el = node.firstChild,
				i = 0, frg = dojo.create('div'),
				tarea = dojo.create('textarea'),
				code, content = [];

		while (el){
			// The logic is kinda reverse and the markup confusing.
			// We are putting every node before a node with the
			// lang attribute into an object with the node
			// with the actual attribute.
			if (dojo.attr(el, "lang") != null){
				// Unescape HTML and make it look fancy
				code = dojo.query("pre", el).attr("innerHTML");
				//tarea[(
				//       dojo.isIE < 8 ? "innerText" : "innerHTML"
				//)] = code;
				// .innerText is not required for IE
				tarea.innerHTML = code;

				code = tarea.value;
				content[el.lang] = {
					"content": frg.innerHTML,
					"label": dojo.attr(el, "label"),
					"lang": el.lang,
					"code": code,
					"index": i
				};

				frg.innerHTML = ""; // reset fragment
			}else{
				frg.appendChild(dojo.clone(el));
			}
			el = el.nextSibling;
			i++;
		}
		// destroy some nodes we don't need
		dojo.destroy(tarea);
		dojo.destroy(frg);

		return content;
	}
});

// Simple iframe driven codeviewer
dojo.declare("CodeGlass.CodeViewer",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
	// summary:
	//		CodeViewer is a widget which provides you with options
	//		to execute code examples for documentation purposes.

	// templatePath:
	//		Path to the dialog template
	templateString: dojo.cache("CodeGlass", "templates/codeViewer.html"),

	// iframeTemplate:
	//		Template for the actual content of the iframe
	iframeTemplate: dojo.cache("CodeGlass", "templates/iframe.html"),

	// currentView:
	//		Default is demo tab
	currentView: "containerIframe",

	// showHeader:
	//		Toggle header display
	showHeader: true,

	// showFooter:
	//		Toggle footer display
	showFooter: true,

	// showTabs:
	//		Toggle tab display
	showTabs: true,

	// toolbars:
	//		Array of toolbar items to be shown
	toolbars: [],

	// iframeVars:
	//		Array of variables which get injected into and rendered
	//		by the iframe
	iframeVars: [],

	postMixInProperties: function(){
		// summary:
		//		Setting up the data to be rendered

		if (this.content.src){
			this.showTabs = false;
			this.showFooter = false;
		}else{
			this._buildTemplate();
		}
	},

	postCreate: function(){
		// summary:
		//		do all necessary setup and create background overlay. FIXME: should we add this to the template maybe?
		// build toolbars
		for (var toolbar in this.toolbars){
			dojo.forEach(this.toolbars[toolbar], function(n){
				this[toolbar].appendChild(n);
			}, this);
		}

		// setting the iframes width/height
		dojo.style(this.domNode, {
			width: this.viewerBox.w + "px",
			height: this.viewerBox.h + "px"
		});

		// setting margin of contentWrapper
		if (!this.showHeader){
			dojo.style(this.contentWrapper, "marginTop", 0+"px");
		}
		if (!this.showFooter){
			dojo.style(this.contentWrapper, "marginBottom", 0+"px");
		}

		// Hide header and footer during initialization
		dojo.query(".header > div, .footer > div", this.domNode).addClass("displayNone");
		dojo.subscribe("codeglass/loaded", this, function(){
			if (this == arguments[0]){
				dojo.fadeOut({
					node: this.loader,
					onEnd: dojo.hitch(this, function(){
						dojo.addClass(this.loader, "displayNone");
						dojo.query(".header > div, .footer > div", this.domNode).removeClass("displayNone");
						// only if we AREN't an inline example:
						setTimeout(dojo.hitch(this, function(){
							console.log(this.isDialog, this.firstLink);
							this.isDialog && console.log("wanting to focus!", this.firstLink);
							this.isDialog && this.firstLink && this.firstLink.focus();
						}), 25);
					})
				}).play();
			}
		});

		this._highlight();

		this.iframe = dojo.create("iframe", {}, this.containerIframe);
	},

	_buildTemplate: function(){
		// summary:
		//		Builds the template and renders all available
		//		variables
		var t = {}, key,
			frgContext = new dojox.dtl.Context({}),
			frgTmpl;

		for (var type in this.content){
			for (key in this.content[type]){
				// render code fragments
				var tk = type + "" + key;
				if (key == "code"){
					frgTmpl = new dojox.dtl.Template(this.content[type][key]);
					this[tk] = t[tk] = CodeGlass.style_html(frgTmpl.render(frgContext), 4);
				}else{
					this[tk] = t[tk] = this.content[type][key];
				}
			}
		}

		for (var dtlVar in this.iframeVars){
			t[dtlVar] = this.iframeVars[dtlVar];
		}

		var template = new dojox.dtl.Template(this.iframeTemplate),
			context = new dojox.dtl.Context(t);

		this.renderedContent = CodeGlass.style_html(template.render(context), 4);
	},

	_setupIframe: function(){
		// summary:
		//		creates iframe with the actual code to be executed

		// Clear iframe
		if (this.iframe){
			dojo.destroy(this.iframe);
		}

		this.iframe = dojo.create("iframe", {}, this.containerIframe);
		if (!this.content.src){
 			var doc = this.iframe.contentWindow.document,
 				content = this.renderedContent;

			doc.open();
			if (!dojo.isIE){
				doc.write(content);
				doc.close();
			}else{
				var bits = content.split("<" + "/script>"),
					lastBit = bits.pop(),
					currentScript; // the last script tag written into the iframe

					var readyStateCheck = function(){ // event handler for script blocks
						if(currentScript.readyState == "complete" || currentScript.readyState == "loaded"){
							// inline scripts: "complete", external scripts: "loaded"
							currentScript.detachEvent("onreadystatechange", readyStateCheck);
							writeNextBitIE();
						}
					};

					var writeNextBitIE = function(){
						var bit = bits.shift();

						if(dojo.isString(bit)){
							doc.write(bit + "<" + "/script>");
							currentScript = dojo.query("script", doc).pop();
							currentScript.attachEvent("onreadystatechange", readyStateCheck);
							readyStateCheck();
						}else{
							doc.write(lastBit);
							if(dojo.isIE > 7){ // otherwise IE8 freezes
								setTimeout(function(){
									doc.close();
								}, 100);
							}
							else {
								doc.close();
							}

						}
					};
					writeNextBitIE();
			}
 			doc.pub = dojo.hitch(this, function(){
 				dojo.publish("codeglass/loaded", [this]);
 			});
		}else{
			// dojo.connect doesn't work on iframes in IE, see #9609
			if (this.iframe.addEventListener) {
				var e = this.iframe.addEventListener("load", dojo.hitch(this, function(){
					dojo.publish("codeglass/loaded", [this]);
					this.iframe.removeEventListener(e);
				}) , false);
			} else if (this.iframe.attachEvent) {
				var e = this.iframe.attachEvent("onload", dojo.hitch(this, function(){
					dojo.publish("codeglass/loaded", [this]);
					this.iframe.detachEvent(e);
				}));
			}
			dojo.attr(this.iframe, "src", this.content.src);
		}

		// setup pub hook for notification when everything is ready
		dojo.query(this.loader).removeClass("displayNone").style("opacity", 1);
	},

	_setup: function(){
		// summary:
		//		Helper function which makes sure the lifecycle
		//		of the template generation gets executed correctly

		dojo.query(".header ul", this.domNode).addClass("displayNone");
		this._buildTemplate(); // redraw iframe content
		this._toggleView(); // reset view to iframe to prevent errors initializing the demo on nodes with display: none
		this._setupIframe();

		this.textareaCode.value = this.renderedContent;
	},

	_toggleView: function(e){
		// summary:
		//		Simple toggle function to switch between
		//		available views

		e && e.preventDefault();

		var attr = e ? (dojo.attr(e.target, "title") || dojo.attr(e.target.parentNode, "title")) : null,
			type = attr ? attr : "containerIframe";
		if (this[type]){
			dojo.query('[title$=\"'+this.currentView+'\"]', this.domNode).removeClass("active");
			dojo.toggleClass(this[this.currentView], "displayNone");

			dojo.query('[title$=\"'+type+'\"]', this.domNode).addClass("active");
			dojo.toggleClass(this[type], "displayNone");

			this.currentView = type;

			// only do the sizing here once nodes are displayed
			this._size(this[type]);
		}
	},

	_highlight: function(){
		// summary:
		//		Code highlighting based on dojox.highlight

		dojo.query("code", this.domNode).forEach(dojox.highlight.init);
	},

	_size: function(node){
		// summary:
		//		Sizes the textareas and info nodes acording to
		//		viewer height

		// If we wouldn't have to support IE we could go for CSS3 here =/ aaarrrrrgghhh

		if (!this._sized){
			this._sized = {};
		}

		if (this._sized[node.className]){
			return;
		}
		// size inner elements properly
		var info = dojo.query("> div.info", node)[0];
		if (info){
			var typeCoords = dojo.coords(node),
				infoCoords = dojo.marginBox(info);

			dojo.query("textarea", node).style("height", (typeCoords.h-infoCoords.h)+"px");
			dojo.query("pre", node).style("height", (typeCoords.h-infoCoords.h-10)+"px"); // Subtracting 10 pixels because of box model padding :(
		}
		this._sized[node.className] = true;
	},

	_copyClipboard: function(){
		// summary:
		//		Helper function to copy code samples to clipboard

		alert("Not working yet :(\nDo you know flash and can write something to support this feature cross browser?\nThat would be awesome!!");
	}
});

// Extend nodelist
dojo.extend(dojo.NodeList, {
	CodeGlass: function(/* Object? */params){
		this.forEach(function(elm){
			dojo.mixin({type: "dialog"}, params);
			var o = dojo.getObject("CodeGlass.base");
			new o(params, elm);
		});
		return this;
	}
});
