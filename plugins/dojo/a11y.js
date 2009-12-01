dojo.provide("CodeGlass.plugins.dojo.a11y");

dojo.declare("CodeGlass.plugins.dojo.a11y",
	CodeGlass.plugins._base,
	{

	injectNode: '',

	templateString: '<div class="a11y">A11y: <input type="checkbox" dojoAttachEvent="onchange: _update" dojoAttachPoint="a11yInput" value="rtl" /></div>',

	constructor: function(args){

	},

	_update: function(){
		var v = this.a11yInput.attr("value");
	}
});