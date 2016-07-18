<?php
class S
{
	// Page node or action node currently being processed
	static $node = null;

	static function log_message( $message, $logname )
	{
		static $iid = null;
		if( !$logname ) return;

		if( !$iid ) $iid = rand( 1, 65535 );

		$out = $iid . "\t"
		. date( 'd.m.Y H:i:s' )
		. "\t" . $message.PHP_EOL;

		if( !file_exists( LOGS_DIRECTORY ) ){
			mkdir( LOGS_DIRECTORY );
			chmod( LOGS_DIRECTORY, 0775 );
		}

		$path = LOGS_DIRECTORY . "$logname.log";
		if( !file_exists( $path ) ) {
			touch( $path );
			chmod( $path, 0664 );
		}
		file_put_contents( $path, $out, FILE_APPEND );
	}

	static function get_template( $node, $context = array() )
	{
		$view = $node->view;
		$name = $node->name;

		if( !$view ) {
			if( S::$node ) {
				$view = S::$node->view;
			}
			else {
				$view = 'main';
			}
		}

		$path = append_path( VIEWS_DIRECTORY, "$view/init.php" );
		if( file_exists( $path ) ){
			require_once( $path );
		}

		$path = append_path( VIEWS_DIRECTORY, "$view/$name.php" );

		if( !file_exists( $path ) ){
			return null;
		}

		$src = parse_template( $path, $context );
		return $src;
	}

	static function template_exists( $node )
	{
		$view = $node->view;
		$name = $node->name;

		if( !$view ) {
			if( S::$node ) {
				$view = S::$node->view;
			}
			else {
				$view = 'main';
			}
		}

		$path = append_path( VIEWS_DIRECTORY, "$view/$name.php" );
		return file_exists( $path );
	}

	static function view_exists( $viewname )
	{
		$path = VIEWS_DIRECTORY.'/'.$viewname;
		return file_exists( $path ) && is_dir( $path );
	}

	static function run()
	{
		$node = URLScheme::parse_url( CURRENT_URL );
		if( !$node ) error_notfound();

		self::$node = $node;

		if( $node->view == 'action' )
		{
			Actions::run_action( $node );
			return;
		}

		if( $node->view === null ) {
			$node->view = 'main';
		}
		if( $node->name === null ) {
			$node->name = 'default';
		}

		$id = $node->id();

		$cache = setting( 'cache_pages' );
		if( $cache && cache_time( 'html_cache', $id ) > flag_time( 'db' ) )
		{
			echo get_cache( 'html_cache', $id );
		}
		else
		{
			$src = self::get_template( $node );
			if( $src === null ) {
				error_notfound();
			}
			$src = Renderer::process( $src );
			if( $cache ) {
				save_cache( 'html_cache', $id, $src );
			}
			echo $src;
		}

		// TODO:
		//Actions::clean_action_data();
		// The problem is: clean_action_data has to work with the
		// session. The session has to be started before headers are
		// sent. Renderer::show above performs output, making the
		// headers sent.
	}

	static function send_mail( $address, $body, $title = null, $add_headers = null )
	{
		if( !$address ) {
			error( 'Empty email at send_mail' );
			return false;
		}
		if( !$title ){
			$title = $_SERVER['SERVER_NAME'].' notification';
		}
		if( !is_array( $add_headers ) ) {
			$add_headers = array();
		}

		log_message( "$address	$title", 'send_mail' );

		// development mock
		if( setting( 'debug' ) )
		{
			$path = time().'_'.uniqid().'.txt';
			file_put_contents( APPDIR.$path, "To: $address\r\nSubject: $title\r\n\r\n$body" );
			return true;
		}

		$headers = array(
			'Content-Type: text/plain; charset="UTF-8"',
			'Date: '.date( 'r' )
		);

		/* On Windows "From" header in the form of
		"User name <user-address>" gets transformed to
		"<User name <user-address>>". */

		if( !isset( $add_headers['From'] ) ) {
			$headers[] = "From: noreply@$_SERVER[HTTP_HOST]";
		}

		if( $add_headers ) {
			foreach( $add_headers as $k => $v ) {
				$headers[] = "$k: $v";
			}
		}

		if( is_ascii( $title ) ){
			$subject = $title;
		} else {
			$subject = "=?UTF-8?B?".base64_encode( $title )."?=";
		}

		ob_start();
		$r = mail( $address, $subject, $body, implode( "\r\n", $headers ) );
		$errors = ob_get_clean();

		if( $errors != '' )
		{
			$errors = strip_tags( $errors );
			warning( "Error while sending mail: $errors" );
			return false;
		}
		return $r;
	}
}

?>
