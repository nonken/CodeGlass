dojo.provide("CodeGlass.plugins._base");

dojo.require("dijit._Templated");
dojo.require("dijit._Widget");

dojo.declare("CodeGlass.plugins._base",
	[dijit._Widget, dijit._Templated],
	{

	sharedVars: [],

	injectToolbar: "toolbarBottom",
	
	codeGlassBaseId: null,

	constructor: function(args){
		if (args.sharedVars){
			this.sharedVars = args.sharedVars;
		}
		if (args.vars){
			dojo.mixin(this, args.vars);
		}
	},

	getVars: function(){
		return {};
	}
});