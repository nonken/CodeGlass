dojo.provide("CodeGlass.plugins.dojo.themes");

dojo.require("CodeGlass.plugins._base");

dojo.declare("CodeGlass.plugins.dojo.themes",
	CodeGlass.plugins._base,
	{

	injectNode: null,

	templateString: '<div class="menuItem theme">Theme: <select dojoAttachEvent="onchange: _changeTheme" dojoAttachPoint="themeInput"></select></div>',

	themes: [
		{ theme: "tundra", label: "Tundra" },
		{ theme: "nihilo", label: "Nihilo" },
		{ theme: "soria", label: "Soria" }
	],

	// theme:
	//		the currently shown dojo theme
	theme: 0,

	injectToolbar: "toolbarBottom",

	postCreate: function(){
		if (!this.sharedVars.baseUrl){
			new Error("You need to load the Dojo version plugin before the themes plugin in order to work properly");
			return;
		}

		dojo.forEach(this.themes, function(theme, i){
			dojo.create("option", { innerHTML: theme.label, value: i }, this.themeInput);
		}, this);
		this.themeInput.selectedIndex = this.theme;
	},

	getVars: function(){
		return {
			injectToolbar: this.injectToolbar,
			iframeProps: {
				"customHead": '<link rel="stylesheet" type="text/css" href="'+this.sharedVars.baseUrl+'dijit/themes/'+this.themes[this.theme].theme+'/'+this.themes[this.theme].theme+'.css" />',
				"classBody": " "+this.themes[this.theme].theme+" "
			}
		}
	},

	_changeTheme: function(){
		this.theme = this.themeInput.value;
		dojo.publish("CodeGlass/plugin/change", ["dojo.themes"]);
	}
});