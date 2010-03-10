dojo.provide("CodeGlass.plugins.dojo.version");

dojo.require("CodeGlass.plugins._base");

dojo.declare("CodeGlass.plugins.dojo.version",
	CodeGlass.plugins._baseTemplated,
	{

	injectNode: null,

	templateString: '<div class="menuItem version">Version: <select dojoAttachEvent="onchange: _changeVersion" dojoAttachPoint="versionInput"></select></div>',

	baseUrls: [
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.4/",
			label: "1.4 (CDN)",
			xDomain: true,
			version: "1.4"
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.3/",
			label: "1.3 (CDN)",
			xDomain: true,
			version: "1.3"
		},
		{
			baseUrl: "http://ajax.googleapis.com/ajax/libs/dojo/1.2/",
			label: "1.2 (CDN)",
			xDomain: true,
			version: "1.2"
		}
	],

	baseUrl: "",

	baseUrlIndex: 0,

	version: "",

	djConfig: "parseOnLoad: true",
	
	injectToolbar: "toolbarBottom",

	postCreate: function(){
		if (this.version.length){
			var v = this.version.split("-"),
				start = v[0] > "0" ? v[0] : "0",
				end = v[1] ? v[1] : null;
		}

		var cnt = -1;
		this.suppVersions = [];
		// it is possible to inject baseUrls externally
		if(typeof(CodeGlassConfig) != "undefined" && typeof(CodeGlassConfig.baseUrls) != "undefined"){
			dojo.mixin(this.baseUrls, CodeGlassConfig.baseUrls);
		}
		dojo.forEach(this.baseUrls, function(url, i){
			if ((!start || url.version >= start) && (!end || url.version <= end) || !url.version){
				this.suppVersions.push(i);
				++cnt;
			}
		}, this);
		//this.baseUrlIndex = cnt > 0 ? 1 : 0; // Always try to use latest CDN unless feature is only supported by trunk

		dojo.forEach(this.suppVersions, function(version, i){
			dojo.create("option", { innerHTML: this.baseUrls[version].label, value: i }, this.versionInput);
		}, this);
		this.versionInput.selectedIndex = this.baseUrlIndex;
		this.sharedVars.djConfig = [];
		this._setSharedVars();
	},

	getVars: function(){
		// setup djConfig string
		var djConfig = [];
		for (var plugin in this.sharedVars.djConfig){
			djConfig.push(this.sharedVars.djConfig[plugin]);
		}
		return {
			injectToolbar: this.injectToolbar,
			iframeProps: {
				"baseUrl": this.baseUrls[this.baseUrlIndex].baseUrl,
				"baseUrlIndex": this.baseUrlIndex,
				"customJavaScript": '<script type="text/javascript" src="'+this.baseUrls[this.baseUrlIndex].baseUrl+'dojo/dojo'+(this.baseUrls[this.baseUrlIndex].xDomain ? ".xd" : "")+'.js" djConfig="'+djConfig.join(",")+'"></script>'
			}
		}
	},

	_setSharedVars: function(){
		this.sharedVars.baseUrlIndex = this.baseUrlIndex;
		this.sharedVars.baseUrl = this.baseUrls[this.baseUrlIndex].baseUrl;
		this.sharedVars.djConfig["version"] = this.djConfig;
	},

	_changeVersion: function(){
		this.baseUrlIndex = this.versionInput.value;
		this.baseUrl = this.baseUrls[this.baseUrlIndex].baseUrl;

		this._setSharedVars();

		dojo.publish("CodeGlass/plugin/change/" + this.codeGlassBaseId, ["dojo.version"]);
	}
});
