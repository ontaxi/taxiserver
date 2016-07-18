<?php

class Renderer
{
	/*
	 * Page title (<title> contents).
	 */
	private static $title = null;

	/*
	 * List of resourses to include to the page.
	 */
	private static $includes = array
	(
		'scripts' => array(),
		'stylesheets' => array(),
		'meta' => array(), // name => description
		'links' => array() // {rel, href}
	);

	/*
	 * A set (hash table) of already included resourses (their absolute
	 * paths).
	 */
	private static $included_assets = array();

	/*
	 * Sets page title.
	 */
	static function set_title( $title ) {
		self::$title = $title;
	}

	static function get_title() {
		return self::$title;
	}

	/*
	 * Adds a meta tag with given "name" and "content" attributes.
	 */
	static function set_meta( $name, $content )
	{
		self::$includes['meta'][$name] = $content;
	}

	/*
	 * Adds a <link> element with given "rel" and "href" attributes.
	 */
	static function add_head_link( $rel, $href )
	{
		self::$includes['links'][] = array(
			'rel' => $rel,
			'href' => $href
		);
	}

	/*
	 * Adds a stylesheet. If the stylesheet doesn't not exist, an error
	 * is triggered. If the given stylesheet is an .mcss macros, a css
	 * is generated (if not in cache) and substituted.
	 */
	static function require_stylesheet( $path )
	{
		$paths = func_get_args();
		foreach( $paths as $path )
		{
			if( ext( $path ) == '.mcss' )
			{
				$css_path = noext( $path ) . '.css';
				if( !file_exists( $css_path )
				|| filemtime( $css_path ) < filemtime( $path ) ){
					$css = mcss::convert( file_get_contents( $path ),
						dirname( $path ) );
					file_put_contents( $css_path, $css );
				}
				$path = $css_path;
			}

			$path = self::include_asset( $path );
			if( $path === false ){
				error( "Could not find stylesheet: '$path'" );
				continue;
			}

			if( !$path ) continue;
			self::$includes['stylesheets'][] = $path;
		}
	}

	/*
	 * Adds a <script> element with given "src" attribute. If there is
	 * no given file, an error is triggered.
	 */
	static function require_script( $path )
	{
		$paths = func_get_args();
		foreach( $paths as $path )
		{
			$vpath = self::include_asset( $path );
			if( $vpath === false ){
				error( "Could not find script: '$path'" );
				continue;
			}

			if( !$vpath ) continue;

			self::$includes['scripts'][] = $vpath;

			// include accompanying stylesheet
			$css_path = noext( $path ).'.css';
			if( file_exists( $css_path ) ){
				self::require_stylesheet( $css_path );
			}
		}
	}

	// TODO: if a script is removed from the set, the compilation is
	// not rebuilt.
	static function require_script_comp( $paths, $fname = null )
	{
		if( !$fname ) {
			$fname = md5( implode( PATH_SEPARATOR, $paths ) );
		}

		$path = "cache/$fname";
		$time = call_user_func_array( 'max', array_map( 'filemtime', $paths ) );

		if( !file_exists( $path ) || filemtime( $path ) < $time )
		{
			file_put_contents( $path,
				implode( PHP_EOL, array_map( 'file_get_contents', $paths ) )
			);
		}

		self::require_script( $path );
	}

	/*
	 * Takes an HTML page source and adds title, scripts, links and
	 * stylesheets that are defined with above functions.
	 */
	static function process( $src )
	{
		// Insert <title> to the page (if defined).
		if( self::$title !== null )
		{
			$c = '<title>'.self::$title.'</title>';

			if( strpos( $src, '<title>' ) === false )
			{
				$src = str_replace(
					'</head>', $c.PHP_EOL . '</head>', $src
				);
			} else {
				$src = preg_replace( '@<title>.*?</title>@', $c, $src );
			}
		}

		$lines = array();

		// insert <meta>
		foreach( self::$includes['meta'] as $name => $content ){
			$lines[] = sprintf( '<meta name="%s" content="%s">',
				$name, $content
			);
		}

		// insert stylesheets
		foreach( self::$includes['stylesheets'] as $path ){
			$lines[] = '<link rel="stylesheet" href="'.SITE_ROOT.$path.'">';
		}

		// insert links
		foreach( self::$includes['links'] as $link ) {
			$lines[] = '<link rel="'.$link['rel'].'" href="'.$link['href'].'">';
		}

		$s = implode( PHP_EOL . "\t", $lines ) . PHP_EOL;
		$src = str_replace( '</head>', "\t".$s.PHP_EOL.'</head>', $src );


		// Insert scripts to the bottom.
		$lines = array();
		foreach( self::$includes['scripts'] as $path ){
			$lines[] = '<script src="'.SITE_ROOT.$path.'"></script>';
		}
		$src = str_replace(
			'</body>',
			implode( PHP_EOL, $lines ).PHP_EOL.'</body>',
			$src
		);

		return $src;
	}

	/*
	 * Tracks files being included. This is called by "require_"
	 * functions above.
	 */
	private static function include_asset( $path )
	{
		$url = parse_url( $path );
		$realpath = realpath( $url['path'] );
		if( !$realpath ){
			return false;
		}

		if( isset( self::$included_assets[$path] ) ){
			return null;
		}

		$ver = filemtime( $realpath ) - 1300000000;

		$s = $url['path'] . '?v='.$ver;
		if( isset( $url['query'] ) ) {
			$s .= '&amp;'.$url['query'];
		}
		return $s;
	}
}
?>
