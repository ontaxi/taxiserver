<?php

function _class_loader( $classname )
{
	$filename = strtolower( $classname ).'.php';
	$paths = array
	(
		// application classes
		APPDIR . 'classes/'.$filename,

		// system classes
		SYSDIR . 'components/'.$filename,
		SYSDIR . 'classes/'.$filename
	);

	foreach( $paths as $path )
	{
		if( file_exists( $path ) ){
			require $path;
			break;
		}
	}
}

/* Redirect all PHP errors to the single custom handler. */
function _error( $type, $msg, $file, $line, $context ){
	if( !error_reporting() ) {
		return;
	}
	error( "$msg\t$file:$line" );
}

function _shutdown()
{
	$error = error_get_last();
	if( !$error ) return;

	/* If the error is fatal, then we process it and stop the script.
	If not, then it has been already processed and this is just a normal
	shutdown. */

	if( $error['type'] == E_ERROR ) {
		error( "$error[message] at $error[file]:$error[line]" );
	}
}

/* All MySQL errors will also be redirected to the same handler. */
function _mysql_error( $msg, $info = '' ){
	$s = $msg;
	if( $info ) $s .= PHP_EOL . $info;
	error( $s );
}

/* MySQL warnings are redirected to the warnings handler. */
function _mysql_warning( $warning ){
	warning( $warning );
}

?>
