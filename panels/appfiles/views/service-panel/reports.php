<?php _header(); ?>

<h1>Отчёты</h1>

<?php
$service_id = sid();

$reports = available_reports( $service_id );
?><ul><?php
foreach( $reports as $r )
{
	$title = $r['title'];
	$path = $r['path'];
	?><li><a href="<?= url( $path ) ?>"><?= $title ?></a></li><?php
}
?>
</ul>
<?php

function available_reports( $sid )
{
	$service_name = DB::getValue( "
		SELECT inner_name FROM taxi_services
		WHERE service_id = %d", $sid );

	return array_merge(
		list_reports( 'all' ),
		list_reports( $service_name )
	);
}

function list_reports( $dirname )
{
	if( !$dirname ) {
		return array();
	}

	$dir = VIEWS_DIRECTORY . 'reports/'.$dirname;
	if( !is_dir( $dir ) ) {
		return array();
	}

	$list = array();
	$files = glob( $dir . '/' . '*.php' );
	foreach( $files as $path )
	{
		$name = substr( basename( $path ), 0, -4 );
		$title = get_report_title( $path );
		if( !$title ) continue;
		$path = 'reports:view '.$dirname.' '.$name;
		$list[] = array(
			'title' => $title,
			'path' => $path );
	}
	return $list;
}

function get_report_title( $path )
{
	$f = fopen( $path, 'r' );
	$n = 0;
	$title = null;
	while( !feof( $f ) && $n < 20 ) {
		$line = fgets( $f );
		if( $line === false ) break;
		if( preg_match( '/set_page_title\((.*?)\)/', $line, $m ) ) {
			$title = $m[1];
			break;
		}
	}
	fclose( $f );

	if( $title ) {
		$title = trim( $title, "'\" " );
	}
	return $title;
}
?>


<?php _footer(); ?>
