<?php
class URLScheme
{
	static function parse_url( $url )
	{
		if( isset( $_GET['action'] ) )
		{
			// Action URL:
			// .../index.php?
			//	action=<actionname>	(required)
			//	&redirect=<redirect-location>
			//	&redirect_error=<redirect-error-location>

			// Get query values.
			// If the query is empty, return default page.
			$query_string = parse_url( $url, PHP_URL_QUERY );
			if( !$query_string ){
				return new site_node();
			}

			// Parse query parameters
			parse_str( $query_string, $raw_params );
			/*
			 * $raw_params will possibly contain arrays because of "[]"
			 * arguments.
			 */
			$params = array(
				'action' => null,
				'redirect' => null,
				'redirect_error' => null
			);
			foreach( $raw_params as $k => $v ) {
				if( is_array( $v ) ) continue;
				$params[$k] = trim( urldecode( $v ) );
			}

			$s = new site_node();
			$s->view = 'action';
			$s->name = $params['action'];
			$s->ext_args['redirect_success'] = $params['redirect'];
			$s->ext_args['redirect_error'] = $params['redirect_error'];

			// Get enumerated arguments
			$i = 0;
			$names = 'pqrstuv';
			$args = array();
			while( isset( $params[$names[$i]] ) ) {
				$args[] = $params[$names[$i]];
				$i++;
			}
			$s->args = $args;
			return $s;
		}

		$node = new site_node();

		$a = parse_url( $url );
		$parts = array_slice( explode( '/', $a['path'] ), 1 );

		if( $parts[0] == 'index.php' ){
			return null;
		}

		if( $parts[0] === '' ) {
			return $node;
		}

		if( view_exists( $parts[0] ) ) {
			$node->view = $parts[0];
			array_shift( $parts );
		}
		if( count( $parts ) > 0 ) {
			$name = array_shift( $parts );
			if( $name ) $node->name = $name;
		}

		if( count( $parts ) > 0 ) {
			$node->args = $parts;
		}
		return $node;
	}

	static function create_url( $node, $params = array() )
	{
		if( $node->view == 'action' )
		{
			$params['action'] = $node->name;
			if( isset( $node->ext_args['redirect_success'] ) ) {
				$params['redirect'] = $node->ext_args['redirect_success'];
			}
			if( isset( $node->ext_args['redirect_error'] ) ) {
				$params['redirect_error'] = $node->ext_args['redirect_error'];
			}

			$i = 0;
			$names = 'pqrstu';
			foreach( $node->args as $arg ){
				$params[ $names[$i++] ] = $arg;
			}

			$url = SITE_DOMAIN . $_SERVER['PHP_SELF'];
			$q = http_build_query( $params, '', '&' );
			if( $q ) {
				$url .= '?'.$q;
			}
			return $url;
		}

		$s = SITE_DOMAIN;

		if( view_exists( $node->view ) && $node->view != 'main' ) {
			$s .= '/' . $node->view;
		}

		if( $node->name != 'default' ){
			$s .= '/' . $node->name;
		}

		if( !empty( $node->args ) ) {
			$s .= '/' . implode( '/', $node->args );
		}
		return $s;
	}
}

?>
