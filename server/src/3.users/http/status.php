<?php

http_mount( '/adm', function( $path, $msg, $response )
{
	$login = http_get_auth( $msg );
	if( $login )
	{
		if( $login[0] != 'admin' || $login[1] != 'admin' ) {
			warning( "HTTP auth failure from $msg->cid" );
			$login = null;
		}
	}
	if( !$login ) {
		return http_request_auth( $response );
	}

	$path = substr( $path, strlen( "/adm/" ) );
	switch( $path )
	{
		case 'status':
			return adm_status( $response );
		case 'log':
			return adm_log( $response );
		default:
			return 404;
	}
});

function adm_status( $response )
{
	$conn = info_conn();

	$response->begin();
	html_head( "Server status" );
	?>
	<table>
		<caption>Connections</caption>
		<tr>
			<th>#</th>
			<th>Connection id</th>
			<th>User</th>
			<th>Time connected</th>
			<th>RTT, ms</th>
		</tr>
	<?php
	foreach( $conn as $i => $row )
	{
		?>
		<tr>
			<td><?= $i + 1 ?></td>
			<td><?= $row['cid'] ?></td>
			<td><?= $row['user'] ?></td>
			<td><?= date( 'd.m H:i:s', $row['time_connected'] ) ?></td>
			<td><?= $row['RTT'] ?></td>
		</tr>
		<?php
	}
	?>
	</table>
	<?php
	html_foot();
	$response->end();
}

function adm_log( $response )
{
	$response->begin();
	html_head( "Memlog" );
	echo '<pre>', htmlspecialchars( memlog::get() ), '</pre>';
	html_foot();
	$response->end();
}

?>
