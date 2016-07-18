<?php
// License: MIT (https://opensource.org/licenses/MIT)

define( 'HALL_PATH', dirname( __FILE__ ) . '/' );

if( !defined( 'APPLICATION_PATH' ) ) {
	define( 'APPLICATION_PATH', 'appfiles' );
}

$appdir = realpath( APPLICATION_PATH );
if( !$appdir ) {
	die( 'APPLICATION_PATH not found.' );
}

/*
 * All directory macros should end with a slash ('/').
 */
define( 'APPDIR', $appdir.'/' );
define( 'VIEWS_DIRECTORY', APPDIR . 'views/' );
define( 'LOGS_DIRECTORY', APPDIR . 'logs/' );
define( 'SYSDIR', HALL_PATH . 'system/' );

if( isset( $_SERVER['HTTP_USER_AGENT'] ) ) {
	define( 'USER_AGENT', $_SERVER['HTTP_USER_AGENT'] );
} else {
	define( 'USER_AGENT', 'Unknown agent' );
}

if( isset( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] != 'off' ) {
	define( 'SITE_PROTOCOL', 'https' );
} else {
	define( 'SITE_PROTOCOL', 'http' );
}

// Some bots don't give the "Host" header.
if( !isset( $_SERVER['HTTP_HOST'] ) )
{
	header( "HTTP/1.1 400 Bad Request" );
	$s = date( 'Y.m.d H:i:s' )."\t".USER_AGENT
		."\t".$_SERVER['REMOTE_ADDR']
		."\t".$_SERVER['REQUEST_URI'];

	if( !file_exists( LOGS_DIRECTORY ) ) {
		mkdir( LOGS_DIRECTORY );
	}
	file_put_contents( LOGS_DIRECTORY.'bad_bots.log', $s.PHP_EOL, FILE_APPEND );
	exit;
}

if( !defined( 'SITE_ROOT' ) ){
	define( 'SITE_ROOT', '/' );
}
define( 'SITE_DOMAIN', SITE_PROTOCOL.'://'.$_SERVER['HTTP_HOST'] );
define( 'CURRENT_URL', SITE_DOMAIN.$_SERVER['REQUEST_URI'] );

// Include hall components.
require SYSDIR. 'corefunc.php';
require SYSDIR.'main.php';
require SYSDIR.'functions.php';

// Preload classes that are likely to be used
require SYSDIR.'components/actions.php';
require SYSDIR.'components/db.php';
require SYSDIR.'components/db_cache.php';
require SYSDIR.'components/renderer.php';
require SYSDIR.'components/urlscheme.php';
require SYSDIR.'components/user.php';
require SYSDIR.'components/vars.php';
require SYSDIR.'classes/baseimage.php';
require SYSDIR.'classes/baseitem.php';

spl_autoload_register( '_class_loader' );
set_error_handler( '_error' );
register_shutdown_function( '_shutdown' );
DB::onError( '_mysql_error' );
DB::onWarning( '_mysql_warning' );

if( !setting( 'debug' ) ) {
	ini_set( 'display_errors', 0 );
}

// include application files
$paths = array(
	APPDIR . 'functions.php',
	APPDIR . 'classes/classes.php',
	APPDIR . 'classes.php',
	APPDIR . 'init.php'
);
foreach( $paths as $path ) {
	if( file_exists( $path ) ) include $path;
}

$paths = glob( APPDIR . 'functions/' . '*.php' );
foreach( $paths as $path ) require $path;

S::run();
?>
