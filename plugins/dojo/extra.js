dojo.provide("CodeGlass.plugins.dojo.extra");

dojo.require("CodeGlass.plugins._base");

dojo.declare("CodeGlass.plugins.dojo.extra",
	CodeGlass.plugins._base, {

	//	dataUrl: The dataUrl should point to the root-directory of a dojo source release that is installed on the same host.
	//		Can be overwritten by CodeGlassConfig.dataUrl. 
	dataUrl: "/",
	
	postCreate: function(){
		// it is possible to inject a dataUrl externally
		if(typeof(CodeGlassConfig) != "undefined" && typeof(CodeGlassConfig.dataUrl) != "undefined"){
			this.dataUrl = CodeGlassConfig.dataUrl;
		}
	},
	
	getVars: function(){
		return {
			iframeProps: {
				dataUrl: this.dataUrl
			}
		}
	}
});