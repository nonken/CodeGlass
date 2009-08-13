dojo.provide("CodeGlass.base");

dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");
dojo.require("dojo.fx");

dojo.declare("CodeGlass.base",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
	// summary:
	//      Simple widget allowing you to create complex demos for documentation projects
	// description:
	//      CodeClass allows...
	
	// templatePath:
	//      main template to be used
	templatePath: dojo.moduleUrl("CodeGlass", "templates/codeglass.html"),
	
	// content:
	//      the actual content for the widget
	content: {},
	
	// dialogBox:
	//      dimensions of the dialog to be opened
	dialogBox: {w: "805px", h: "415px"},
	
	postMixInProperties: function(){
		// summary:
		//      parse the child nodes and put the contents into the content object which then can be used by the dialog or other content display mechanisms
		
		var el = this.srcNodeRef.firstChild,
			i = 0,
			content = [],
			tarea = dojo.doc.createElement('textarea'),
			code;

		while (el){
			// The logic is kinda reverse and the markup confusing - we are putting every node before a node with the lang attribute into an 
			// object with the node with the actual attribute.
			if (dojo.attr(el, "lang") != null){
				code = dojo.query("pre", el).attr("innerHTML");
				
				(dojo.isIE ? tarea.innerText = code : tarea.innerHTML = code);
				code = tarea.value;
				this.content[el.lang] = {"content": content, "label": dojo.attr(el, "label"), "lang": el.lang, "code": code, "index": i};   
				content = [];         
			}else{
				content.push(el);
			}
			
			el = el.nextSibling;
			i++;
		}		
	},
	
	show: function(){
		// summary:
		//      shows the dialog with the iframe
		
		if (!this.dialog){
			// DTL bug doesn't allow us to render the widget without DOM so we create the node
			var node = dojo.create("div", {}, dojo.body(), "last");
			this.dialog = new CodeGlass.Dialog({content: this.content, dialogBox: this.dialogBox, description: "This is an example"}, node);
		}
		this.dialog.show();
	}
});

// Simple iframe driven dialog
dojo.declare("CodeGlass.Dialog", 
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
	
	// templatePath:
	//      path to the dialog template    
	templatePath: dojo.moduleUrl("CodeGlass", "templates/dialog.html"),
	
	// iframeTemplate:
	//      template for the actual content of the iframe
	iframeTemplate: dojo.moduleUrl("CodeGlass", "templates/iframe.html"),
	
	// dialogBox:
	//      dimensions of the dialog to be opened
	dialogBox: {},
	
	// theme:
	//      the currently shown dojo theme
	theme: "tundra",
	
	// version:
	//      the CDN version to load
	version: "1.3",
	
	currentView: "containerIframe",
	
	postMixInProperties: function(){
		// summary:
		//		Sets up the data to be rendered
		
		this._buildTemplate();
	},
	
	postCreate: function(){
		// summary:
		//      do all necessary setup and create background overlay. FIXME: should we add this to the template maybe?
		
		this.bg = dojo.create("div", {
			className: "codeGlassBg"
		}, dojo.body());
		
		// setting the iframes width/height
		dojo.query(".container", this.domNode).style({
			width: this.dialogBox.w ? this.dialogBox.w : "500px",
			height: this.dialogBox.h ? this.dialogBox.h : "400px",
		});
		
		dojo.connect(window, "onresize", this, "_position");
	},
		
	show: function(){
		// summary:
		//      show the dialog and position it correctly on screen
		
		this._position();
		dojo.fx.combine([dojo.fadeIn({
			node: this.domNode,
			beforeBegin: dojo.hitch(this, function(){
			  dojo.removeClass(this.domNode, "displayNone");  
			})
		}), dojo.fadeIn({
			node: this.bg,
			end: 0.7,
			beforeBegin: dojo.hitch(this, function(){
			  dojo.removeClass(this.bg, "displayNone");  
			}),
			onEnd: dojo.hitch(this, function(){
				this._setupIframe();
			})
		})]).play();
	},

	hide: function(){
		// summary:
		//      hide dialog
		
		dojo.fx.combine([dojo.fadeOut({
			node: this.domNode,
			onEnd: dojo.hitch(this, function(){
			  dojo.addClass(this.domNode, "displayNone");  
			})
		}), dojo.fadeOut({
			node: this.bg,
			onEnd: dojo.hitch(this, function(){
			  dojo.addClass(this.bg, "displayNone");  
			})
		})]).play();
	},

	_position: function(){
		// summary:
		//      positions dialog and background layer and additionally sizes background layer correctly
		
		var dim = dijit.getViewport(),
			dd = dojo.doc.documentElement;

		dojo.style(this.domNode, {
			top: dim.h/2-dojo.style(this.containerIframe, "height")/2+"px",
			left: dim.w/2-dojo.style(this.containerIframe, "width")/2+"px"
		});

		dojo.style(this.bg, {
			width: dd.scrollWidth + "px",
			height: dd.scrollHeight + "px"
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
			
		this.renderedContent = template.render(context);
	},

	_setupIframe: function(){
		// summary:
		//      creates iframe with the actual code to be executed

// FIXME: I bet this doesn't work in IE :P
		// Clear iframe
		if (this.iframe){
			dojo.destroy(this.iframe);
		}
		
		this.iframe = dojo.create("iframe", {}, this.containerIframe);
		this.iframe.contentDocument.open();
		this.iframe.contentDocument.write(this.renderedContent);
		this.iframe.contentDocument.close();
	},
	
	_changeTheme: function(){
		this.theme = this.themeInput.value;

		// redraw iframe content
		this._buildTemplate();
		this._setupIframe();
	},
	
	_toggleView: function(e){
		var type = dojo.attr(e.target, "title");
		
		if (this[type]){
			dojo.toggleClass(this[this.currentView], "displayNone");
			dojo.toggleClass(this[type], "displayNone");
			this.currentView = type;
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