<?php

define( 'MAX_SPREADSHEET_ROWS', 500 );
define( 'MAX_WEB_ROWS', 500 );

function download_spreadsheet( $rows )
{
	set_time_limit( 300 );
	ob_destroy();
	require APPLICATION_PATH.'/libs/phpexcel/PHPExcel.php';
	$wb = new PHPExcel();
	$sheet = $wb->getSheet(0);

	foreach( $rows as $i => $cols )
	{
		foreach( $cols as $j => $col )
		{
			$sheet->setCellValueByColumnAndRow( $j, $i + 1, (string)$col );
		}
	}
	if( isset( $rows[0] ) )
	{
		$n = count( $rows[0] );
		for( $i = 0; $i < $n; $i++ ) {
			$sheet->getColumnDimensionByColumn( $i )->setAutoSize( true );
		}
	}


	$path = tempnam( sys_get_temp_dir(), 'web' );
	$writer = new PHPExcel_Writer_Excel2007( $wb );
	$writer->save( $path );

	$name = time().'.xlsx';
	announce_file( $name, filesize( $path ) );
	$f = fopen( $path, 'rb' );
	fpassthru( $f );
	fclose( $f );
	exit;

}

function download_csv( $rows )
{
	ob_destroy();

	$f = tmpfile();
	fwrite( $f, "sep=;\n" );
	foreach( $rows as $row )
	{
		$row = array_map( 'html_to_txt_csv', $row );
		fputcsv( $f, $row, ';' );
	}
	$s = fstat( $f );
	$size = $s['size'];

	//announce_file( "orders.csv" );
	header( 'Content-Type: text/csv; charset=cp1251' );
	header( 'Content-Disposition: attachment; filename='.time().'.csv' );
	fseek( $f, 0 );
	fpassthru( $f );
	fclose( $f );
	exit;
}

function html_to_txt_csv( $s )
{
	/*
	 * Replace decimal separator for float numbers.
	 */
	if( preg_match( '/^\d+\.\d+$/', $s ) ) {
		return str_replace( '.', ',', $s );
	}
	$s = iconv( 'UTF-8', 'cp1251', $s );
	$s = preg_replace( '/\r?\n/', '; ', $s );
	return html_entity_decode( $s, ENT_COMPAT, 'cp1251' );
}

?>
