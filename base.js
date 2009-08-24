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


dojo.declare("CodeGlass.base",
	dijit._Widget,
	{
	// summary:
	//		Simple widget allowing you to create complex demos for documentation projects
	// description:
	//		CodeClass allows...

	// width:
	//		width of the viewer
	width: "",

	// height:
	//		width of the viewer
	height: "",

	// src:
	//		optional src parameter to display external URL
	src: "",

	djConfig: "parseOnLoad: false",

	postMixInProperties: function(){
		// summary:
		//		parse the child nodes and put the contents into the content object which then can be used by the dialog or other content display mechanisms

		this.height = this.height ? this.height : 450;
		this.width = this.width ? this.width : 680;

		// content:
		//		the actual content for the widget
		this.content = {};

		if (this.src){
			this.content.src = this.src;
		}else{
			this.content = CodeGlass.parseNodes(this.srcNodeRef)
		}
	}
});

dojo.declare("CodeGlass.Inline",
	[CodeGlass.base, dojox.dtl._DomTemplated],
	{

	// templatePath:
	//		main template to be used
	templatePath: dojo.moduleUrl("CodeGlass", "templates/codeglassInline.html"),

	// viewTemplate:
	//		the template of the actual view, extending the base view
	viewTemplate: dojo.moduleUrl("CodeGlass", "templates/viewInline.html"),

	postCreate: function(){
		this.viewer = new CodeGlass.CodeViewer({
			id: this.id+"_Content",
			content: this.content,
			viewerBox: { w: this.width, h: this.height },
			templatePath: this.viewTemplate,
			djConfig: this.djConfig
		}, this.domNode);

		dojo.addClass(this.viewer.domNode, "codeGlassInline");
		dojo.removeClass(this.viewer.domNode, "displayNone");

		this.viewer._setupIframe();
	}
});

dojo.declare("CodeGlass._DialogMixin",
	CodeGlass.base,
	{

	postCreate: function(){
		var node = dojo.create("div", {}, dojo.body(), "last");
		this.cv = new CodeGlass.CodeViewer({
			id: this.id+"_Content",
			content: this.content,
			viewerBox: { w: this.width, h: this.height },
			templatePath: this.viewTemplate,
			djConfig: this.djConfig
		}, node);

		dojo.connect(window, "onresize", this, "_position");
// FIXME: this doesn't get cleaned up correctly
		dojo.query(".header .close", this.cv.domNode).onclick(dojo.hitch(this, function(e){
			this.hide();
		}));

		dojo.subscribe("codeglass/open", this, function(){
			if (this.isOpen){
				this.hide();
			}
		});
	},

	show: function(e){
		// summary:
		//		show the dialog and position it correctly on screen

		e.preventDefault(e);

		this._position();
		this.cv._toggleView();

		this.ce = dojo.coords(e.target, true);

		dojo.publish("codeglass/open", [this]);

		dojo.query(".wrapper", this.cv.domNode).addClass("displayNone");
		dojo.animateProperty({
			node: this.cv.domNode,
			beforeBegin: dojo.hitch(this, function(){
				dojo.removeClass(this.cv.domNode, "displayNone");
			}),
			properties: {
				width: { start: this.ce.w, end: this.width},
				height: { start: this.ce.h, end: this.height},
				top: { start: this.ce.y, end: this.top },
				left: { start: this.ce.x, end: this.left }
			},
			duration: 300,
			onEnd: dojo.hitch(this, function(){
				dojo.query(".wrapper", this.cv.domNode).removeClass("displayNone");
				this.cv._setupIframe();
				this.isOpen = true;
			})
		}).play();
	},

	hide: function(e){
		// summary:
		//		hide dialog

		dojo.query(".wrapper", this.cv.domNode).addClass("displayNone");
		dojo.animateProperty({
			node: this.cv.domNode,
			properties: {
				width: this.ce.w,
				height: this.ce.h,
				top: this.ce.y,
				left: this.ce.x
			},
			onEnd: dojo.hitch(this, function(){
				dojo.addClass(this.cv.domNode, "displayNone");
				this.isOpen = false;
			})
		}).play();
	},

	_position: function(){
		// summary:
		//		positions dialog and background layer and additionally sizes background layer correctly

		var dim = dijit.getViewport();

		this.top = dim.t+dim.h/2-this.height/2;
		this.left = dim.l+dim.w/2-this.width/2;

		dojo.style(this.cv.domNode, {
			top: this.top+"px",
			left: this.left+"px"
		});
	}
});

dojo.declare("CodeGlass.Dialog",
	[CodeGlass._DialogMixin, dojox.dtl._DomTemplated],
	{

	// templatePath:
	//		main template to be used
	templatePath: dojo.moduleUrl("CodeGlass", "templates/codeglassDialog.html"),

	// viewTemplate:
	//		the template of the actual view, extending the base view
	viewTemplate: dojo.moduleUrl("CodeGlass", "templates/viewDialog.html")
});

dojo.declare("CodeGlass.Basic",
	[CodeGlass._DialogMixin],
	{

	// viewTemplate:
	//		the template of the actual view, extending the base view
	viewTemplate: dojo.moduleUrl("CodeGlass", "templates/viewDialog.html"),

	postCreate: function(){
		dojo.connect(this.domNode, "onclick", this, "show");
		this.inherited(arguments);
	}
});

// Simple iframe driven codeviewer
dojo.declare("CodeGlass.CodeViewer", 
	[dijit._Widget, dojox.dtl._DomTemplated],
	{

	// templatePath:
	//		path to the dialog template    
	templatePath: dojo.moduleUrl("CodeGlass", "templates/viewDialog.html"),

	// base:
	//		base template to be extended by templatePath
	base: {
		url: dojo.moduleUrl("CodeGlass", "templates/viewBase.html"),
		shared: false
	},

	// iframeTemplate:
	//		template for the actual content of the iframe
	iframeTemplate: dojo.moduleUrl("CodeGlass", "templates/iframe.html"),

	baseUrls: [
		{
			baseUrl: "/moin_static163/js/dojo/trunk/",
			label: "Trunk local",
			xDomain: false
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.3.2/",
			label: "1.3.2 (Current CDN)",
			xDomain: true
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.3.1/",
			label: "1.3.1 (CDN)",
			xDomain: true
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.3/",
			label: "1.3 (CDN)",
			xDomain: true
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.2/",
			label: "1.2 (CDN)",
			xDomain: true
		}
	],
	
	baseUrl: 1,

	themes: [
		{ theme: "tundra", label: "Tundra" },
		{ theme: "nihilo", label: "Nihilo" },
		{ theme: "soria", label: "Soria" }
	],

	// theme:
	//		the currently shown dojo theme
	theme: 0,

	// currentView:
	//		default is demo tab
	currentView: "containerIframe",
	
	showToolbar: true,

	postMixInProperties: function(){
		// summary:
		//		Sets up the data to be rendered

		this.viewerBox = dojo.mixin({
			w: 500,
			h :400
		}, this.viewerBox);

		if (this.content.src){
			this.showToolbar = false;
		}else{
			this._buildTemplate();
		}
	},

	postCreate: function(){
		// summary:
		//		do all necessary setup and create background overlay. FIXME: should we add this to the template maybe?

		// setting the iframes width/height
		var info;
		dojo.style(this.domNode, {
			width: this.viewerBox.w + "px",
			height: this.viewerBox.h + "px"
		});

		dojo.query(".header ul", this.domNode).addClass("displayNone");
		dojo.subscribe("codeglass/loaded", this, function(){
			if (this == arguments[0]){
				dojo.fadeOut({
					node: this.loader,
					onEnd: dojo.hitch(this, function(){
						dojo.addClass(this.loader, "displayNone");
						dojo.query(".header ul", this.domNode).removeClass("displayNone");
					})
				}).play();
			}
		});

		// Create version and theme select options. We do this here because of a bug in DTL
		// preventing us from using {% for in %} in a select context
// FIXME: externalize into template once DTL bug is fixed
		if (this.showToolbar){
			dojo.forEach(this.baseUrls, function(url, i){
				dojo.create("option", { innerHTML: url.label, value: i }, this.versionInput);
			}, this);
			this.versionInput.selectedIndex = this.baseUrl;
			
			dojo.forEach(this.themes, function(theme, i){
				dojo.create("option", { innerHTML: theme.label, value: i }, this.themeInput);
			}, this);
			this.themeInput.selectedIndex = this.theme;
		}
		this._highlight();
	},

	_buildTemplate: function(){
		var t = {}, type, key;
		for (type in this.content){
			for (key in this.content[type]){
				this[type+""+key] = t[type+""+key] = this.content[type][key];
			}
		}

		dojo.mixin(t, {
			djConfig: this.djConfig,
			theme: this.themes[this.theme].theme,
			baseUrl: this.baseUrls[this.baseUrl].baseUrl,
			xDomain: this.baseUrls[this.baseUrl].xDomain
		});

		var template = new dojox.dtl.Template(this.iframeTemplate),
			context = new dojox.dtl.Context(t);

		this.renderedContent = CodeGlass.style_html(template.render(context), 4);
	},

	_setupIframe: function(){
		// summary:
		//		creates iframe with the actual code to be executed

// FIXME: I bet this doesn't work in IE :P
		// Clear iframe
		if (this.iframe){
			dojo.destroy(this.iframe);
		}

		this.iframe = dojo.create("iframe", {}, this.containerIframe);
		if (!this.content.src){
			this.iframe.contentDocument.open();
			this.iframe.contentDocument.write(this.renderedContent);
			this.iframe.contentDocument.close();
			this.iframe.contentWindow.pub = dojo.hitch(this, function(){
				dojo.publish("codeglass/loaded", [this]);
			});
		}else{
			var conn = dojo.connect(this.iframe, "onload", this, function(){
				dojo.disconnect(conn);
				dojo.publish("codeglass/loaded", [this]);
			});
			dojo.attr(this.iframe, "src", this.content.src);
		}

		// setup pub hook for notification when everything is ready
		dojo.query(this.loader).removeClass("displayNone").style("opacity", 1);
	},

	_changeTheme: function(){
		this.theme = this.themeInput.value;

		dojo.query(".header ul", this.domNode).addClass("displayNone");

		this._buildTemplate(); // redraw iframe content
		this._toggleView(); // reset view to iframe to prevent errors initializing the demo on nodes with display: none
		this._setupIframe();
	},
	
	_changeVersion: function(){
		this.baseUrl = this.versionInput.value;

		dojo.query(".header ul", this.domNode).addClass("displayNone");

		this._buildTemplate(); // redraw iframe content
		this._toggleView(); // reset view to iframe to prevent errors initializing the demo on nodes with display: none
		this._setupIframe();
		
		dojo.query(".container.full textarea")[0].value = this.renderedContent;
// FIXME: why doesn't this work???
//		dojo.query(".container.full textarea").attr("value", this.renderedContent);
	},

	_toggleView: function(e){
		var attr = e ? dojo.attr(e.target, "title") : null,
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
		dojo.query("code", this.domNode).forEach(dojox.highlight.init);
	},

	_size: function(node){
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

			dojo.query("textarea", node).style("height", (typeCoords.h-infoCoords.h-13)+"px");
// FIXME: why do we have to manually add sime pixels? Calculations are wrong!!!
			dojo.query("pre", node).style("height", (typeCoords.h-infoCoords.h-23)+"px");
		}
		this._sized[node.className] = true;
	},

	_copyClipboard: function(){
		alert("Not working yet :(\nDo you know flash and can write something to support this feature cross browser?\nThat would be awesome!!");
	}
});

// Helper functions
dojo.mixin(CodeGlass, {
	parseNodes: function(node){
		var el = node.firstChild,
				i = 0, frg = dojo.doc.createElement('div'),
				tarea = dojo.doc.createElement('textarea'),
				code, content = [];

		while (el){
			// The logic is kinda reverse and the markup confusing - we are putting every node before a node with the lang attribute into an 
			// object with the node with the actual attribute.
			if (dojo.attr(el, "lang") != null){
				// Unescape HTML and make it look fancy
				code = dojo.query("pre", el).attr("innerHTML");
				(dojo.isIE ? tarea.innerText = code : tarea.innerHTML = code);
				code = CodeGlass.style_html(tarea.value, 4);

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

// Extend nodelist
dojo.extend(dojo.NodeList, {
	CodeGlass: function(/* Object? */params){
		this.forEach(function(elm){
			var type = params.type ? params.type : "dialog",
				o = dojo.getObject("CodeGlass."+type.substr(0, 1).toUpperCase() + type.substr(1));
			if (!o){
			throw Error("Unknown CodeGlass type: "+"CodeGlass."+type.substr(0, 1).toUpperCase() + type.substr(1));
			}
			new o(params, elm);
		});
		return this;
	}
});
