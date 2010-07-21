dojo.provide("CodeGlass.plugins._base");

dojo.require("dijit._Templated");
dojo.require("dijit._Widget");

dojo.declare("CodeGlass.plugins._base", dijit._Widget, {

	sharedVars: [],

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

dojo.provide("CodeGlass.plugins._baseTemplated");
dojo.declare("CodeGlass.plugins._baseTemplated", [CodeGlass.plugins._base, dijit._Templated],{
	injectToolbar: "toolbarBottom"
});