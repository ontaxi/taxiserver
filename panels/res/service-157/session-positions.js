"use strict";

var map = new Map( document.getElementById( 'map' ) );

var S = export_states;
var n = S.length;

var paths = [];
var pathIndex = -1;

var prevPos = L.latLng( 0, 0 );

var eventNames = {
	//"begin": "Начало",
	//"gps_error": "Ошибка GPS",
	//"order-started": "Пуск счётчика",
	//"order-finished": "Остановка счётчика",
	//"disconnect": "Разрыв связи"
};

var idleClusters = [];

function addIdlePoint( lat, lon )
{
	var p = L.latLng( lat, lon );
	for( var i = 0; i < idleClusters.length; i++ )
	{
		for( var j = 0; j < idleClusters[i].length; j++ )
		{
			if( idleClusters[i][j].distanceTo( p ) < 50 ) {
				idleClusters[i].push( p );
				return;
			}
		}
	}
	
	idleClusters.push( [p] );
}

for( var i = 0; i < n; i++ )
{
	var lat = S[i].lat;
	var lon = S[i].lon;
	var t = S[i].t;
	var e = S[i].event;
	
	if( e )
	{
		if( !lat || !lon ) {
			lat = prevPos.lat;
			lon = prevPos.lng;
		}
		if( lat && lon )
		{
			if( e == 'idle' ) {
				addIdlePoint( lat, lon );
			}
			else {
				var title = eventNames[e] || null;
				if( title ) {
					map.setMarker( i, lat, lon, {title: title} );
				}
			}
		}
	}

	var pos = L.latLng( lat, lon );
	
	if( lat && lon )
	{
		if( pathIndex < 0 )
		{
			pathIndex++;
			paths[pathIndex] = [];
			//var s = { title: "Начало дорожки " + (pathIndex+1) };
			//L.marker( pos, s ).addTo( map.leaflet );
		}
		else
		{
			if( pos.distanceTo( prevPos ) > 2000 )
			{
				if( paths[pathIndex].length > 3 )
				{
					if( prevPos.lat )
					{
						//var s = { title: "Обрыв дорожки " + (pathIndex+1) };
						//L.marker( prevPos, s ).addTo( map.leaflet );
					}
					pathIndex++;
					paths[pathIndex] = [];
					//var s = { title: "Начало дорожки " + (pathIndex+1) };
					//L.marker( pos, s ).addTo( map.leaflet );
				}
				else
				{
					paths[pathIndex] = [];
				}
			}
		}

		paths[pathIndex].push( pos );
		prevPos = pos;
	}
}

for( var i = 0; i < idleClusters.length; i++ )
{
	var title = "Стоянка (" + idleClusters[i].length + ")";
	L.marker( idleClusters[i][0], {title: title} ).addTo( map.leaflet );
}

var colors = [ "blue", "red", "green", "navy", "orange", "teal" ];
var s = '<style>.sample {'
	+ 'display: inline-block; width: 1em; height: 1em;'
	+ 'vertical-align: bottom;}</style>';
for( var i = 0; i <= pathIndex; i++ )
{
	var color = colors[ i % colors.length ];
	L.polyline( paths[i], {color: color} ).addTo( map.leaflet );
	
	s += '<span class="sample" style="background-color: '+color+'"></span>'
		+ ' Дорожка ' + (i+1) + ' ';
}

if( pathIndex > 0 )
{
	var legend = document.createElement( "div" );
	legend.innerHTML = s;
	var mapContainer = document.getElementById( 'map' );
	if( mapContainer.nextSibling ) {
		mapContainer.parentNode.insertBefore( legend, mapContainer.nextSibling );
	}
	else {
		mapContainer.parentNode.appendChild( legend );
	}
}



