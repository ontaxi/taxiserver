<?php
/*
 * This is a set of functions to be called by applications.
 */


// Logging

/*
 * Writes a message to the given log. Empty logname means "ignore".
 */
function log_message( $message, $logname ) {
	S::log_message( $message, $logname );
}
/*
 * A shortcut for debug messages.
 */
function msg( $message ) {
	log_message( $message, 'debug' );
}

/*
 * Writes a visitor line to the log.
 */
function log_visitor( $logname = 'visits' ) {
	log_message( $_SERVER['REMOTE_ADDR']."\t".USER_AGENT, $logname );
}


// Program errors

function error( $message ){
	Errors::error( $message );
}

function warning( $message )
{
	if( setting( 'debug' ) ) {
		error( $message );
		exit;
		ob_destroy();
		echo $message;
		exit;
	}
	log_message( $message, 'warnings' );
}


// HTTP errors

// 'Unauthorized' - the user should login first
// ~ HTTP 401
//
function error_unauthorized(){
	ob_destroy();
	die( "Unauthorized" );
}

//
// HTTP 404 Document Not Found.
// Shows "404" page if present in current view.
//
function error_notfound(){
	Errors::error_notfound();
}

//
// HTTP 403 Forbidden.
// Shows "403" page if present in current view.
//
function error_forbidden(){
	Errors::error_forbidden();
}

//
// HTTP 500 Internal Server Error.
// Some program error that we don't want to show
// Shows "500" page if present in current view.
//
function error_server(){
	Errors::error_server();
}


// Page rendering

// Includes template "_header" where called.
function _header(){
	echo template( '_header' );
}

// Includes template "_footer" where called.
function _footer(){
	echo template( '_footer' );
}

// Sets page <title>.
function set_page_title( $title ){
	Renderer::set_title( $title );
}

function page_title() {
	return Renderer::get_title();
}

// Adds meta tags (<meta name="$name" content="$content">) to the
// page.
function set_page_meta( $name, $content ){
	Renderer::set_meta( $name, $content );
}

// Adds a <script src="$path"></script> to the <head>
// Checks that the file exists. If not, calls error().
function require_script( $path ){
	$paths = func_get_args();
	return call_user_func_array( 'Renderer::require_script', $paths );
}

/*
 * Creates a compilation of scripts in the cache directory and adds the
 * link to the document. The compilation is updated when any of the
 * scripts are changed.
 */
function require_script_comp( $paths, $fname = null ) {
	return call_user_func( 'Renderer::require_script_comp', $paths, $fname );
}

// Adds <link rel="stylesheet" href="$path"> to the <head>.
// Checks that the file exists. If not, calls error().
function require_stylesheet( $path ){
	$paths = func_get_args();
	return call_user_func_array( 'Renderer::require_stylesheet', $paths );
}


// Actions

// Sets list of user types that can call actions.
function set_actions_access( $list ){
	Actions::set_access_list( $list );
}

// Returns result of the last action - true (successful), false
// (unsuccressful) or null (no action). If the action name is given,
// and the last action was not as given, returns null.
function action_result( $action_name = null ){
	return Actions::last_action_result( $action_name );
}

// Returns last action errors - array of strings.
function action_errors( $action_name = null ){
	return Actions::last_action_errors( $action_name );
}

// Returns last action data - merged array of _POST and _GET data that
// was given to the action.
function action_data( $action_name, $key = null ){
	return Actions::last_action_data( $action_name, $key );
}


// URL

// Creates page URL from the given node string.
function url_t( $node_string = '', $params = array() )
{
	assert( is_array( $params ) );
	$node = parse_node_string( $node_string );
	if( $node->view === null ) {
		$node->view = S::$node->view;
	}
	return URLScheme::create_url( $node, $params );
}

function url( $node_string = '', $params = array() ) {
	return htmlspecialchars( url_t( $node_string, $params ) );
}

// Creates action URL from the given node string.
function aurl_t( $name, $redirect = null, $redirect_error = null )
{
	if( !$redirect ) {
		$redirect = CURRENT_URL;
	}
	$node = parse_node_string( $name );
	$node->view = 'action';
	$node->ext_args['redirect_success'] = $redirect;
	$node->ext_args['redirect_error'] = $redirect_error;

	return URLScheme::create_url( $node );
}

function aurl( $name, $redirect = null, $redirect_error = null ) {
	return htmlspecialchars( aurl_t( $name, $redirect, $redirect_error ) );
}

function argv( $index )
{
	if( !S::$node ) return null;
	if( $index == 0 ){
		return S::$node->name;
	}
	$index--;
	if( isset( S::$node->args[$index] ) ){
		return S::$node->args[$index];
	} else {
		return null;
	}
}

function add_url_parse_function( $f ){
	URLScheme::add_parse_function( $f );
}
function add_url_create_function( $f ){
	URLScheme::add_create_function( $f );
}

function send_mail( $address, $text, $subject = null, $add_headers = null ){
	return S::send_mail( $address, $text, $subject, $add_headers );
}


// Makes a redirect to the given URL. The URL should be full,
// not relative.
function redirect( $url ){
	header( "Location: ".$url );
	exit;
}




//
// Templates
// ---------

// Returns the processed template.
function template( $name, $vars = array() )
{
	$node = parse_node_string( $name );
	$src = S::get_template( $node, $vars );
	if( $src === null ) {
		error( "Cound not find template '$name'." );
	}
	return $src;
}

function template_exists( $name ) {
	$node = parse_node_string( $name );
	return S::template_exists( $node );
}

/*
 * Discards all previously created buffers.
 */
function ob_destroy()
{
	while( ob_get_level() ){
		ob_end_clean();
	}
}

/*
 * Cleans the output, dumps the given variable and stops the script.
 */
function e( $var )
{
	ob_destroy();
	$vars = func_get_args();
	foreach( $vars as $var ){
		var_dump( $var );
	}
	exit;
}

function setting( $name, $default_value = null )
{
	$value = Settings::get( $name );
	return ( $value !== null ) ? $value : $default_value;
}



function announce_json( $charset = 'UTF-8' ){
	header( "Content-Type: application/json; charset=$charset" );
}
function announce_txt( $charset = 'UTF-8' ){
	header( "Content-Type: text/plain; charset=$charset" );
}
function announce_html( $charset = 'UTF-8' ){
	header( "Content-Type: text/html; charset=$charset" );
}
function announce_file( $filename, $size = null )
{
	$types = array(
		'.xls' => 'application/vnd.ms-excel',
		'.xlsx' => 'application/vnd.openxmlformats-officedocument'.
			'.spreadsheetml.sheet',
		'.zip' => 'application/zip'
	);
	$ext = ext( $filename );
	if( !isset( $types[$ext] ) ) {
		error( "Unknown MIME type for '$filename'" );
	}

	$type = $types[$ext];
	header( 'Content-Type: '.$type );
	header( 'Content-Disposition: attachment;filename="'.$filename.'"');
	if( $size ) {
		header( 'Content-Length: '.$size );
	}
}

function image_src( $base_src, $width = null, $height = null ) {
	$img = new BaseImage( $base_src );
	return $img->src( $width, $height );
}


// Strings translation

function t( $text ) {
	return lang::get_message( $text );
}

function set_default_language( $lang ) {
	return lang::set_default_language( $lang );
}

function get_default_language() {
	return lang::get_default_language();
}

function have_lang( $lang ) {
	return lang::have_lang( $lang );
}


// Files cache

/*
 * Get value from the cache.
 */
function get_cache( $dir, $key ) {
	return cache::get( $dir, $key );
}
/*
 * Put a value to the cache.
 */
function save_cache( $dir, $key, $value ) {
	return cache::set( $dir, $key, $value );
}
/*
 * Returns time of the cached file or zero if there is no such file.
 */
function cache_time( $dir, $key ) {
	return cache::get_time( $dir, $key );
}


// Timestamp flags

function update_flag( $flag ) {
	return flags::update_flag( $flag );
}

function flag_time( $flag ) {
	return flags::get_flag_time( $flag );
}



//
// New
// ---


function view_exists( $viewname ) {
	return S::view_exists( $viewname );
}

/*
 * Redirect to the same node with same arguments, but with another view.
 */
function change_view( $viewname )
{
	if( S::$node->view == $viewname ) {
		return;
	}
	$node = S::$node;
	$node->view = $viewname;
	$url = URLScheme::create_url( $node );
	redirect( $url );
}



/*
 * Runs the given script in buffer and returns the output. $context is
 * an array of variables to be defined in that script.
 */
function parse_template( $path, $context = array() )
{
	/* Rename path in case $context has "path" variable. */
	$__path = $path;

	ob_start();
	extract( $context );
	require( $__path );
	$src = ob_get_clean();

	/* Some templates may have the BOM, need to remove it. */
	$bom = "\xEF\xBB\xBF";
	if( strpos( $src, $bom ) === 0 ){
		$src = substr( $src, strlen( $bom ) );
	}
	return $src;
}

function parse_node_string( $string )
{
	// <view>:<node> <arg1> ... <argN>
	// action:<action> <arg1> ... <argN>

	$n = strlen( $string );
	$i = 0;

	$view = '';
	$name = '';
	$args = array();
	$argpos = -1;

	if( strpos( $string, ':' ) !== false )
	{
		// Read view
		while( $i < $n && $string[$i] != ':' ) {
			$view .= $string[$i++];
		}
		// Skip colon
		if( $i < $n && $string[$i] == ':' ) {
			$i++;
		}
	}

	// Read node name
	while( $i < $n && $string[$i] != ' ' ) {
		$name .= $string[$i++];
	}

	while( $i < $n && $string[$i] == ' ' )
	{
		$i++;
		$argpos++;
		$args[] = '';
		while( $i < $n && $string[$i] != ' ' ) {
			$args[$argpos] .= $string[$i++];
		}
	}

	$node = new site_node();
	if( $view ) $node->view = $view;
	if( $name ) $node->name = $name;
	$node->args = $args;
	return $node;
}

function add_classes_dir( $path ) {
	autoloaders::add_dir( $path );
}

function lib( $name ) {
	require_once APPLICATION_PATH."/lib/$name.php";
}

/* append_path( 'foo\\', 'bar/', 'q', 'werty' ) = 'foo/bar/q/werty'. */
function append_path( $path, $_additions_ )
{
	$args = func_get_args();
	return str_replace( '//', '/',
		str_replace( '\\', '/', implode( '/', $args ) )
	);
}

/*
 * Returns file extension.
 * For no extension returns empty string, otherwise returns extension
 * with the dot.
 */
function ext( $filename )
{
	$ext = pathinfo( $filename, PATHINFO_EXTENSION );
	if( $ext != '' ) $ext = '.'.$ext;
	return $ext;
}

/*
 * Omits extension from given path.
 */
function noext( $filename )
{
	$pos = strrpos( $filename, '.' );

	// Cases like 'readme' and '.htaccess'.
	if( $pos === false || $pos === 0 ){
		return $filename;
	} else {
		return substr( $filename, 0, $pos );
	}
}

?>
