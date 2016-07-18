<?php
/* This module enables processing file uploads in a uniform way. The
processing is divided into several stages:

1. Retrieving the information about the uploaded files from the
   $_FILES array as a list of tuples (table).
2. Filtering the obtained list to exclude inappropriate entries (based
   on file types, file sizes, error codes, file names, ...).
3. Modifying the file names to match the desired format (converting to a
   proper encoding, omitting illegal characters, limiting to a certain
   length, ...).
4. Saving the files as specified in the filtered list to a given
   directory with possible file name modification to avoid overwriting
   existing files (for example, adding a counter to repeating names);
5. Cleaning the temporary files that have been created during the
   upload.

// TODO: add cleanup?
*/
class Uploads
{
	const FILECHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_.';

	/* This is the default handler that most applications use. It
	filters out files that have error codes, filters names of the rest
	and saves them to the specified folder making sure that existing
	files will not be overwritten. The return value is an array of full
	paths to the uploaded files.

	Allowed_extensions can be set to array of extensions (with dots,
	like ".jpg"). $max_file_size can be set to the maximum size of
	each accepted file, in bytes. Note that filtering will be silent,
	there are no warnings reported. */

	static function process_input( $input_name, $destination_dir,
		$allowed_extensions = null, $max_file_size = null )
	{
		if( is_string( $allowed_extensions ) ){
			$allowed_extensions = array_map( 'trim',
				explode( ',', $allowed_extensions )
			);
		}

		// Get all the inputs
		$files = self::get_files( $input_name );
		if( !$files ){
			return null;
		}

		// Exclude files that have errors and that have unacceptable
		// extensions
		$files_ok = array();
		foreach( $files as $file )
		{
			if( $file['error'] || !$file['size'] ){
				continue;
			}

			if( is_array( $allowed_extensions ) )
			{
				$ext = strtolower( ext( $file['name'] ) );
				if( !in_array( $ext, $allowed_extensions ) ){
					continue;
				}
			}

			$files_ok[] = $file;
		}

		if( empty( $files_ok ) ){
			return array();
		}

		$files_ok = self::filter_filenames( $files_ok );

		return self::save_files( $files_ok, $destination_dir );
	}

	/*
	 * Returns array of "dicts" {type, tmp_name, error, size, name}
	 * uniformly for single-file and multi-file inputs.
	 *
	 * Returns null of there is no such input.
	 */
	static function get_files( $input_name )
	{
		/* If there is no such input, return null. */
		if( !isset( $_FILES[$input_name] ) ){
			return null;
		}

		$inputs = array();

		/* If the input is a single file, return it. */
		if( !is_array( $_FILES[$input_name]["name"] ) )
		{
			if( $_FILES[$input_name]['name'] != '' ){
				$inputs[] = $_FILES[$input_name];
			}
			return $inputs;
		}


		$fields = array( "type", "tmp_name", "error", "size", "name" );
		foreach( $_FILES[$input_name]["name"] as $i => $name )
		{
			if( $_FILES[$input_name]['name'][$i] == '' ){
				continue;
			}

			// TODO: there must be some array_*** magick for that.
			$input = array();
			foreach( $fields as $f ){
				$input[$f] = $_FILES[$input_name][$f][$i];
			}
			$inputs[$i] = $input;
		}

		return $inputs;
	}

	static function filter_filenames( $inputs )
	{
		foreach( $inputs as $i => $input )
		{
			$name = noext( $input['name'] );
			$ext = strtolower( ext( $input['name'] ) );

			// Replace all spaces with dashes and omit all the
			// characters that we don't want to have.
			$name = str_replace( ' ', '-', $name );
			$name = str_filter( $name, self::FILECHARS );

			// Replace multiple dashes with a single one.
			$name = preg_replace( '/-{2,}/', '-', $name );

			// If after filtering we don't much left, just generate
			// a random name.
			if( strlen( $name ) < 2 ){
				$name = uniqid();
			}

			$inputs[$i]["name"] = $name.$ext;
		}

		return $inputs;
	}

	// Saves files specified in the given list and returns a list of
	// their new paths.

	static function save_files( $inputs, $destination_directory )
	{
		if( !is_array( $inputs ) ){
			return null;
		}

		$paths = array();

		if( !file_exists( $destination_directory ) ) {
			/*
			 * On some hosts PHP and FTP accounts are working under
			 * different users, so we have to give the full access (777)
			 * to these directories.
			 */
			mkdir( $destination_directory, 0777, true );
		}

		foreach( $inputs as $i => $input )
		{
			$tmp_path = $input['tmp_name'];
			$new_path = append_path( $destination_directory, $input['name'] );

			if( file_exists( $new_path ) ){
				$new_path = filename_alt( $new_path );
			}
			move_uploaded_file( $tmp_path, $new_path );
			$paths[$i] = $new_path;
		}

		return $paths;
	}
}

/*
		0	UPLOAD_ERR_OK
		There is no error, the file uploaded with success.

		1	UPLOAD_ERR_INI_SIZE
		The uploaded file exceeds the upload_max_filesize directive in php.ini.

		2	UPLOAD_ERR_FORM_SIZE
		The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.

		3	UPLOAD_ERR_PARTIAL
		The uploaded file was only partially uploaded.

		4	UPLOAD_ERR_NO_FILE
		No file was uploaded.

		6	UPLOAD_ERR_NO_TMP_DIR
		Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.

		7	UPLOAD_ERR_CANT_WRITE
		Failed to write file to disk. Introduced in PHP 5.1.0.

		8	UPLOAD_ERR_EXTENSION
		A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help. Introduced in PHP 5.2.0.
		*/

?>
