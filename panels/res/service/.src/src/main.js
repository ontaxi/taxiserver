var pageFunctions = {};

function pageFunc( page, func ) {
	pageFunctions[page] = func;
}

$(document).ready( function()
{
	var args = scriptArgs();
	var page = args.page;
	if( page in pageFunctions ) {
		pageFunctions[page]();
	}
});
