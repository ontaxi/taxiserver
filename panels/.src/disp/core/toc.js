"use strict";
(function(){

window.addEventListener( 'load', createTOC );

var AUTO_ID = autoIdNeeded();

function autoIdNeeded()
{
	var S = document.getElementsByTagName( 'script' );
	var url = S[S.length-1].getAttribute( 'src' );
	return url.indexOf( '?auto-id' ) > 0;
}

var autoId = 0;
function nextId() {
	return ++autoId;
}

function createTOC()
{
	var item = getItem( document.body );
	if( !item ) {
		return;
	}

	var toc = document.createElement( 'nav' );
	toc.className = 'toc';
	toc.innerHTML = buildTOC( item.children )

	var h = item.header;
	h.parentNode.insertBefore( toc, h.nextElementSibling );
}

function Item() {
	this.id = undefined;
	this.title = undefined;
	this.children = undefined;
	this.header = undefined;
}

function getItem( container )
{
	var item = new Item();

	var header = getHeader( container );
	if( !header ) {
		return null;
	}

	var id = header.id || container.id;
	if( !id && AUTO_ID ) {
		id = nextId();
		container.id = id;
	}

	item.id = id;
	item.title = header.innerHTML;
	item.children = getChildItems( container );
	item.header = header;
	return item;
}

/*
 * Returns header element for given container.
 */
function getHeader( container )
{
	/*
	 * Take header element as the first child "h1" element.
	 */
	var H = container.getElementsByTagName( 'h1' );
	if( H.length == 0 ) {
		return null;
	}
	var h = H[0];
	if( h.parentNode != container ) {
		return null;
	}
	return h;
}

function getChildItems( container )
{
	var items = [];

	var C = container.childNodes;
	var n = C.length;
	for( var i = 0; i < n; i++ )
	{
		var c = C[i];
		/*
		 * Skip elements that don't define a section.
		 */
		if( c.nodeType != c.ELEMENT_NODE ) {
			continue;
		}
		if( c.tagName.toLowerCase() != 'article' &&
			c.tagName.toLowerCase() != 'section' ) {
			continue;
		}
		var item = getItem( c );
		if( item ) {
			items.push( item );
		}
	}

	return items;
}

function buildTOC( items )
{
	var s = '<ul>';

	var n = items.length;
	for( var i = 0; i < n; i++ )
	{
		var item = items[i];

		if( item.id ) {
			s += '<li><a href="#'+item.id+'">'+item.title+'</a>';
		}
		else {
			s += '<li>'+item.title;
		}

		if( item.children.length > 0 ) {
			s += buildTOC( item.children );
		}
		s += '</li>';
	}
	s += '</ul>';
	return s;
}

})();
