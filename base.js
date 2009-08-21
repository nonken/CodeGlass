dojo.provide("CodeGlass.base");

dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");
// Why do we have to include this???
dojo.require("dojox.dtl.tag.loader");
dojo.require("dojox.dtl.tag.logic");

// make it fancy
dojo.require("dojo.fx");

// Code beautifying
dojo.require("dojox.highlight");
dojo.require("dojox.highlight.languages._www");
dojo.require("CodeGlass.HTML-Beautify");

dojo.declare("CodeGlass.base",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
	// summary:
	//		Simple widget allowing you to create complex demos for documentation projects
	// description:
	//		CodeClass allows...

	// type:
	//		the type of CodeGlass
	//		ViewerDialog || ViewerInline
	type: "ViewerDialog",

	// viewerBox:
	//		dimensions of the dialog to be opened
	viewerBox: {w: "805", h: "415"},

	// templateString:
	//		placeholder DOM node
	templateString: "<div></div>",

	postMixInProperties: function(){
		// summary:
		//		parse the child nodes and put the contents into the content object which then can be used by the dialog or other content display mechanisms

		var el = this.srcNodeRef.firstChild,
			i = 0, frg = dojo.doc.createElement('div'),
			tarea = dojo.doc.createElement('textarea'),
			code;

		// content:
		//		the actual content for the widget
		this.content = {};

		while (el){
			// The logic is kinda reverse and the markup confusing - we are putting every node before a node with the lang attribute into an 
			// object with the node with the actual attribute.
			if (dojo.attr(el, "lang") != null){
				// Unescape HTML and make it look fancy
				code = dojo.query("pre", el).attr("innerHTML");
				(dojo.isIE ? tarea.innerText = code : tarea.innerHTML = code);
				code = style_html(tarea.value, 4);

				this.content[el.lang] = {
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
	},
	
	postCreate: function(){
		var o = dojo.getObject("CodeGlass."+this.type);
		if (!o){
			throw Error("Unknown CodeGlass type: "+"CodeGlass."+this.type);
		}
		this.viewer = new o({id: this.id+"_Viewer", content: this.content, viewerBox: this.viewerBox}, this.domNode);
	}
});

dojo.declare("CodeGlass.ViewerInline",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{

	// templatePath:
	//		main template to be used
	templatePath: dojo.moduleUrl("CodeGlass", "templates/codeglassInline.html"),

	// viewTemplate:
	//		the template of the actual view, extending the base view
	viewTemplate: dojo.moduleUrl("CodeGlass", "templates/viewInline.html"),

	postCreate: function(){
		this.viewerBox = dojo.mixin({
			w: 500,
			h :400
		}, this.viewerBox);

		this.viewer = new CodeGlass.CodeViewer({
			id: this.id+"_Content",
			content: this.content,
			viewerBox: this.viewerBox,
			templatePath: this.viewTemplate
		}, this.domNode);

		dojo.addClass(this.viewer.domNode, "codeGlassInline");
		dojo.removeClass(this.viewer.domNode, "displayNone");

		this.viewer._setupIframe();
	}
});

dojo.declare("CodeGlass.ViewerDialog",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{

	// templatePath:
	//		main template to be used
	templatePath: dojo.moduleUrl("CodeGlass", "templates/codeglassDialog.html"),

	// viewTemplate:
	//		the template of the actual view, extending the base view
	viewTemplate: dojo.moduleUrl("CodeGlass", "templates/viewDialog.html"),

	postCreate: function(){
		this.viewerBox = dojo.mixin({
			w: 500,
			h :400
		}, this.viewerBox);

		var node = dojo.create("div", {}, dojo.body(), "last");
		this.dialog = new CodeGlass.CodeViewer({
			id: this.id+"_Content",
			content: this.content,
			viewerBox: this.viewerBox,
			templatePath: this.viewTemplate
		}, node);

		dojo.connect(window, "onresize", this, "_position");
		dojo.query(".header .close", this.dialog.domNode).onclick(dojo.hitch(this, function(e){
			this.hide();
		}));
	},

	show: function(e){
		// summary:
		//		show the dialog and position it correctly on screen

		this._position();
		this.dialog._toggleView();

		this.ce = dojo.coords(e.target)

		dojo.query(".wrapper", this.dialog.domNode).addClass("displayNone");
		dojo.animateProperty({
			node: this.dialog.domNode,
			beforeBegin: dojo.hitch(this, function(){
				dojo.removeClass(this.dialog.domNode, "displayNone");
			}),
			properties: {
				width: { start: this.ce.w, end: this.viewerBox.w},
				height: { start: this.ce.h, end: this.viewerBox.h},
				top: { start: this.ce.t, end: this.top },
				left: { start: this.ce.l, end: this.left }
			},
			duration: 300,
			onEnd: dojo.hitch(this, function(){
				dojo.query(".wrapper", this.dialog.domNode).removeClass("displayNone");
				this.dialog._setupIframe();
			})
		}).play();
	},

	hide: function(e){
		// summary:
		//		hide dialog

		dojo.query(".wrapper", this.dialog.domNode).addClass("displayNone");
		dojo.animateProperty({
			node: this.dialog.domNode,
			properties: {
				width: this.ce.w,
				height: this.ce.h,
				top: this.ce.t,
				left: this.ce.l
			},
			onEnd: dojo.hitch(this, function(){
				dojo.addClass(this.dialog.domNode, "displayNone");
			})
		}).play();
	},

	_position: function(){
		// summary:
		//		positions dialog and background layer and additionally sizes background layer correctly

		var dim = dijit.getViewport(),
			dd = dojo.doc.documentElement;

		this.top = dim.h/2-this.viewerBox.h/2;
		this.left = dim.w/2-this.viewerBox.w/2;

		dojo.style(this.domNode, {
			top: this.top+"px",
			left: this.left+"px"
		});
	}
});

// Simple iframe driven dialog
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

	// theme:
	//		the currently shown dojo theme
	theme: "tundra",

	// version:
	//		the CDN version to load
	version: "1.3",

	// currentView:
	//		default is demo tab
	currentView: "containerIframe",

	postMixInProperties: function(){
		// summary:
		//		Sets up the data to be rendered

		this.viewerBox = dojo.mixin({
			w: 500,
			h :400
		}, this.viewerBox);

		this._buildTemplate();
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
	},

	_buildTemplate: function(){
		var t = {}, type, key;
		for (type in this.content){
			for (key in this.content[type]){
				this[type+""+key] = t[type+""+key] = this.content[type][key];
			}
		}

		dojo.mixin(t, {
			theme: this.theme,
			version: this.version
		});

		var template = new dojox.dtl.Template(this.iframeTemplate),
			context = new dojox.dtl.Context(t);

		this.renderedContent = style_html(template.render(context), 4);
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
		this.iframe.contentDocument.open();
		this.iframe.contentDocument.write(this.renderedContent);
		this.iframe.contentDocument.close();

		// setup pub hook for notification when everything is ready
		dojo.query(this.loader).removeClass("displayNone").style("opacity", 1);

		this.iframe.contentWindow.pub = dojo.hitch(this, function(){
			dojo.publish("codeglass/loaded", [this]);
		})
	},

	_changeTheme: function(){
		this.theme = this.themeInput.value;

		dojo.query(".header ul", this.domNode).addClass("displayNone");

		// redraw iframe content
		this._buildTemplate();
		this._toggleView();
		this._setupIframe();
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

			// size inner elements properly
			var info = dojo.query("> div", this[type])[0];
			if (info){
// FIXME: the size calculations are odd here!!!
				var typeCoords = dojo.coords(this[type]),
					infoCoords = dojo.marginBox(info);

				dojo.query("textarea", this[type], this.domNode).style("height", (typeCoords.h-infoCoords.h-13)+"px");
				dojo.query("code", this[type], this.domNode).forEach(dojox.highlight.init);
// FIXME: why do we have to manually add sime pixels? Calculations are wrong!!!
				dojo.query("pre", this[type], this.domNode).style("height", (typeCoords.h-infoCoords.h-23)+"px");
			}
		}
	}
});

// Extend nodelist
dojo.extend(dojo.NodeList, {
	CodeGlass: function(/* Object? */params){
		this.forEach(function(elm){
			new CodeGlass.base(params, elm);
		});
		return this;
	}
});
