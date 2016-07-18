<?php
define( 'T_ADM', 'adm' );

$NS = 'proto_adm::';

add_auth_func( $NS.'auth' );
add_cmdfunc( T_ADM, 'auth-adm', $NS.'msg_auth_adm' );
add_cmdfunc( T_ADM, 'get-info', $NS.'msg_get_info' );
add_cmdfunc( T_ADM, 'memlog-dump', $NS.'msg_memlog_dump' );

class proto_adm
{
	static function auth( $cid, $str )
	{
		if( strpos( $cid, '127.0.0.1' ) !== 0 ) {
			return null;
		}

		$m = message::parse_from_json( $str );
		if( !$m ) {
			return null;
		}

		if( $m->command != 'auth-adm' ) {
			return null;
		}

		static $c = 0;

		$u = new conn_user( T_ADM, ++$c, 0 );

		$m = new message( 'auth-ok' );
		conn_send( $cid, $m->to_json()."\n" );
		return $u;
	}

	static function msg_auth_adm( $cmd, $user ) {
		// nothing
	}

	static function msg_get_info( $cmd, $user )
	{
		$full = ($cmd->data( 'full' ) == '1');
		write_message( $cmd->cid, new message( 'info', array(
			'str' => self::get_info( $full )
		)));
	}

	private static function get_info( $full = false )
	{
		$n = array( 'conn', 'cache', 'tasks', 'bans' );
		$add = array( 'cmdfunc', 'events', 'settings' );

		if( $full ) {
			$n = array_merge( $n, $add );
		}

		$p = array();
		foreach( $n as $name ) {
			$p[] = format_table( call_user_func( 'info_'.$name ) );
		}
		return implode( PHP_EOL, $p );
	}

	static function msg_memlog_dump( $msg, $user ) {
		$path = $msg->data( 'filepath' );
		$comments = $msg->data( 'comments' );
		memlog_dump( $comments, $path );
		write_message( $msg->cid, new message( 'ok' ) );
	}
}
?>
