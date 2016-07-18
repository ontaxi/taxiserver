<?php

class BaseImage
{
	protected $filepath;

	// Redefine this in a child class, if needed.
	protected $cache_directory = 'cache/thumbnails';
	protected $buckets_number = 100;

	/* The constructor is given the path of original (full-resolution)
	image. If smaller sizes are requested, copies will be generated from
	that image and saved in cache. */

	function __construct( $filepath )
	{
		$this->filepath = $filepath;
	}

	/* Create cached copy with given dimensions and return its URL. */
	// REV: add url() method to return URL and leave src to return the pathname.
	function src( $width = null, $height = null )
	{
		$default_path = SITE_ROOT . $this->filepath;

		/* If it has happened that the given file does not exist, don't
		bother with 'no photo' or any handling, just return the path
		that was given to the constructor. */
		// If no specific size is given, return the original image.
		if( !file_exists( $this->filepath )
			|| ( !$width && !$height ) ) {
			return $default_path;
		}

		$cache_path = $this->cache_path( $width, $height );
		$cache_path_site = str_replace( '\\', '/', SITE_ROOT . $cache_path );

		// If the cached copy already exists, return its path.
		if( file_exists( $cache_path ) ){
			return $cache_path_site;
		}

		// Open original image.
		try {
			$img = new GDImage( $this->filepath );
		} catch( Exception $e ){
			return $default_path;
		}

		// Make sure the directory exists.
		$dir = dirname( $cache_path );
		if( !file_exists( $dir ) ) {
			/* The cache directories should be writable and readable by
			others so that on complex projects other backend programs
			could cooperate with the site. */
			mkdir( $dir, 0777, true );
		}

		// * We don't calculate dimensions from aspect ratio,
		// GDImage does that.

		// If requested size is bigger than the original size,
		// or if the size is the same,
		// use original image.
		$bigger = ( $width && $width > $img->width )
			&& ( $height && $height > $img->height );
		$same = ( $width === null || $width === $img->width )
			&& ( $height === null || $height === $img->height );
		if( $bigger || $same )
		{
			// Although we don't actually modify the image,
			// we copy it to the cache anyway, so that later calls
			// will get the image right from there instead of checking
			// the image size again.
			copy( $this->filepath, $cache_path );
		}
		else
		{
			$img->limit( $width, $height );
			$img->save( $cache_path );
		}

		$img->close();
		return $cache_path_site;
	}

	private function cache_path( $width, $height )
	{
		// Define the size marker ("400x300")
		$size = '';
		if( $width && $height ){
			$size = $width.'x'.$height; // 400x300
		} else if( $width ){
			$size = 'w'.$width; // w400
		} else {
			$size .= 'h'.$height; // h300
		}

		// Compose the file name from its original location
		// (This will be something like "images-dir1-dir2-name.jpg".)
		$filename = str_replace( '/', '-', $this->filepath );

		$un = filesize( $this->filepath );

		$filename = sprintf( '%s-%s_%s', noext( $filename ), $un,
			$size.ext( $filename )
		);

		$shift = round( $this->buckets_number / 2 );
		$dir_number = (string)( crc32( $filename ) % $shift + $shift );
		if( $dir_number < 10 ) $dir_number = '0'.$dir_number;

		$path = $this->cache_directory.'/'.$dir_number.'/'.$filename;

		return $path;
	}
}

/* There are two problems when generating a name for the copy
		file. The first one is uniqueness of copy names, and the
		second one is actuality of the copy.

		1. Uniqueness

		Suppose we have an image "image1.jpg" and we need two copies
		with different sizes: 400x300 and 200x<auto>. We can
		distinguish the two copies by adding a size specification to
		their names, so that they will be "image1_400x300.jpg" and
		"image1_w200.jpg".

		Then, suppose we have many images, all named "image1.jpg" but
		placed in different directories. Suppose also, that we need
		400x300 copies for all of them. All these copies will be named
		"image1_400x300.jpg". To resolve this, we have to add
		their directory paths also (replacing slashes with dashes),
		so the names will be something like
		"images-2013-01-image1_400x300.jpg".

		2. Actuality

		Suppose we have some kind of main photo that we show on some
		page and change it every month, but keep the filename the
		same (say, "images/image-of-the-month.jpg"). Suppose also
		that the page doesn't show the image itself, but its copy
		"400x300". In this case, the first copy will be saved in the
		cache and will be taken from there every time, even after the
		original has been updated.

		To avoid this, we have to add to the name of the copy some
		identifier that ties the copy to the original file. This
		identifier could be:
		* file modification time,
		* file size,
		* file hash (md5 or other)
		File hash is too slow, whereas filemtime and filesize run
		equally fast.

		The hash function could be used instead of using
		original's pathname as a prefix, but that would waste processing
		every time. md5_file function takes about 1 ms to run, and this
		time grows linearly with the file's size, while crc32 and
		filesize calls take two orders less. */

?>
