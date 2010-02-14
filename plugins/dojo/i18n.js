dojo.provide("CodeGlass.plugins.dojo.i18n");

dojo.require("CodeGlass.plugins._base");

dojo.declare("CodeGlass.plugins.dojo.i18n",
	CodeGlass.plugins._base,
	{

	injectNode: null,

	templateString: '<div class="menuItem i18n">Language: <select dojoAttachEvent="onchange: _changeI18n" dojoAttachPoint="i18nInput"><option value=""></option></select></div>',

	languages: dojo.cache("CodeGlass", "resources/languages.json"),

	injectToolbar: "toolbarBottom",

	postCreate: function(){
		data = dojo.fromJson(this.languages);
		dojo.forEach(data, function(lang, i){
			dojo.create("option", { innerHTML: lang.name, value: lang.iso }, this.i18nInput);
		}, this);
	},

	getVars: function(){
		return {
			injectToolbar: this.injectToolbar,
			iframeProps: {
				"i18n": this.i18nInput.value
			}
		}
	},

	_changeI18n: function(){
		this.i18n = this.i18nInput.value;
		if (this.i18n.length){
			this.sharedVars.djConfig["i18n"] = (this.sharedVars.djConfig.length ? ", " : "") + "locale: '" + this.i18n + "'";
		}

		dojo.publish("CodeGlass/plugin/change/" + this.codeGlassBaseId, ["dojo.i18n"]);
	}
});