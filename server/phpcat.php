<?php

date_default_timezone_set( 'UTC' );

main( $argv );

function main( $args )
{
	$trees = get_tree_names( $args );

	$files = array();
	foreach( $trees as $path ) {
		$sub = tree( $path, '*.php' );
		sort( $sub );
		$files = array_merge( $files, $sub );
	}

	cat( $files );
}

function get_tree_names( $args )
{
	if( count( $args ) == 1 ) {
		return array( '.' );
	}
	else {
		return array_slice( $args, 1 );
	}
}

function tree( $path, $pattern = '*' )
{
	$paths = array();
	$d = opendir( $path );
	while( ($fn = readdir( $d )) !== false )
	{
		if( $fn[0] == '.' ) continue;

		$p = $path.'/'.$fn;
		if( is_dir( $p ) ) {
			$paths = array_merge( $paths, tree( $p, $pattern ) );
			continue;
		}

		if( !fnmatch( $pattern, $fn ) ) {
			continue;
		}

		$paths[] = $p;
	}
	closedir( $d );
	return $paths;
}

function cat( $files )
{
	$lines = array( '<?php /*',
		'	Date: ' . date( 'Y-m-d' ),
		'	Number of files: ' . count($files),
		'*/ ?>'
	);

	echo implode( PHP_EOL, $lines );

	foreach( $files as $path ) {
		echo PHP_EOL, '<?php /* '.get_local_path( $path ), ' */ ?>';
		echo trim( file_get_contents( $path ) );
	}
}

function get_local_path( $path )
{
	static $n;
	$n = strlen( getcwd() ) + 1;
	return str_replace( '\\', '/', substr( realpath( $path ), $n ) );
}

?>
