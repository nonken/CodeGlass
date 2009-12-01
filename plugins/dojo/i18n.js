dojo.provide("CodeGlass.plugins.dojo.i18n");

dojo.require("CodeGlass.plugins._base");

dojo.declare("CodeGlass.plugins.dojo.i18n",
	CodeGlass.plugins._base,
	{

	injectNode: null,

	templateString: '<div class="i18n">Language: <select dojoAttachEvent="onchange: _changeI18n" dojoAttachPoint="i18nInput"><option value=""></option></select></div>',

	languages: dojo.moduleUrl("CodeGlass", "resources/languages.json"),

	injectToolbar: "toolbarBottom",

	postCreate: function(){
		dojo.xhrGet({
			url: this.languages,
			handleAs: "json",
			load: dojo.hitch(this, function(data){
				dojo.forEach(data, function(lang, i){
					dojo.create("option", { innerHTML: lang.name, value: lang.iso }, this.i18nInput);
				}, this);
			})
		});
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

		dojo.publish("CodeGlass/plugin/change", ["dojo.i18n"]);
	}
});