<?php

class GDImage
{
	const DEFAULT_MIME = "image/jpeg";

	public $mime = "";
	public $width = 0;
	public $height = 0;
	private $_img = null;

	public function __construct( $filepath )
	{
		$this->open( $filepath );

		if( !$this->_img ){
			throw new Exception( 'Could not create image' );
		}
	}

	public function __destruct()
	{
		$this->close();
	}

	public function __clone()
	{
		// Cloned object will have all the same values of width, height,
		// and _img reference.
		// Since the reference points to the same object as the clone
		// original, we have to create a new copy.

		$copy = $this->create_image_copy( $this->_img );

		// Don't use replace_object here, because it destroys old one.
		// Just assign the new reference.
		$this->_img = $copy;
	}

	// TODO: add original format by default?
	public function getBinary( $format )
	{
		$fs = array(
			"jpeg" => "imagejpeg",
			"gif" => "imagegif",
			"png" => "imagepng"
		);
		$f = $fs[$this->mime];
		ob_start();
		call_user_func( $f, $this->_img );
		return ob_end_clean();
	}

	//
	// Read an image from the given file.
	//
	public function open( $path )
	{
		if( !file_exists( $path ) ){
			return false;
		}

		$info = getimagesize( $path );
		if( $info === false ){
			return false;
		}

		$this->width = $info[0];
		$this->height = $info[1];
		$this->mime = $info["mime"];

		switch( $this->mime )
		{
			case "image/jpeg":
				$this->_img = imagecreatefromjpeg( $path );
				break;
			case "image/gif":
				$this->_img = imagecreatefromgif( $path );
				break;
			case "image/png":
				$this->_img = imagecreatefrompng( $path );
				break;
			default:
				return false;
		}

		//imagealphablending( $this->_img, false );
		//imagesavealpha( $this->_img, true );

		return ( $this->_img !== false && $this->_img !== null );
	}

	/**
	 * Saves the image to a file.
	 * @param string $url URL of the file to save to
	 * @param int quality=95 quality percentage [0-100]
	 * @return boolean success
	 */
	public function save( $url, $quality = 95 )
	{
		$ext = strtolower( pathinfo( $url, PATHINFO_EXTENSION ) );
		$extmap = array(
			"jpg" => "imagejpeg",
			"jpeg" => "imagejpeg",
			"gif" => "imagegif",
			"png" => "imagepng"
		);

		if( !isset( $extmap[$ext] ) ){
			trigger_error( "Unknown file extension: $ext", E_USER_ERROR );
			return false;
		}

		//imagealphablending( $this->_img, false );
		// TODO: move it to open()?


		// $f is the save-function name
		$f = $extmap[ $ext ];
		if( $f == "imagepng" )
		{
			imagesavealpha( $this->_img, true );
			// PNG quality has range [0-9]
			$quality = round( 9/100 * $quality );
		}
		return $f( $this->_img, $url, $quality );
	}

	/**
	 * Frees memory used by the image.
	 */
	public function close()
	{
		if( !$this->_img ) return;
		imagedestroy( $this->_img );
		$this->_img = null;
		$this->width = 0;
		$this->height = 0;
		$this->mime = self::DEFAULT_MIME;
	}

	/**
	 * Allocates a color and returns its internal index.
	 *
	 * @param string $hex hex RGB color identifier like:
	 *  "#aaa", "#aaaaaa", "aaa" or "aaaaaa"
	 * @return int image color identifier
	 */
	private function create_color( $hex )
	{
		$r = $g = $b = "";
		if( $hex[0] == '#' ){
			$hex = substr( $hex, 1 );
		}
		if( strlen( $hex ) == 3 )
		{
			$r = $hex[0] . $hex[0];
			$g = $hex[1] . $hex[1];
			$b = $hex[2] . $hex[2];
		}
		else if( strlen( $hex ) == 6 )
		{
			$r = $hex[0] . $hex[1];
			$g = $hex[2] . $hex[3];
			$b = $hex[4] . $hex[5];
		}
		else
		{
			throw new Exception( "wrong parameter: ".$hex );
		}

		$r = hexdec( $r );
		$g = hexdec( $g );
		$b = hexdec( $b );

		return imagecolorallocate( $this->_img, $r, $g, $b );
	}

	//
	// Rotates the image counter-clockwise.
	//
	public function rotate( $angle_degrees )
	{
		$img = imagerotate( $this->_img, $angle_degrees, -1 );
		$this->replace_object( $img );
	}

	//
	// Resizes the image so that it fits into a box
	// (padding) with given width and height.
	//
	// If height is omitted, it is assumed the same as the width.
	//
	public function box( $width, $height = null, $boxcolor = "#fff" )
	{
		// If no height was given, set it to the same value as width.
		if( !$height ) $height = $width;

		// Since we know the container's dimensions, create it.
		$box = $this->create_empty_image( $width, $height );

		// To fit the image with dimensions (x0, y0) inside the box with
		// dimensions (x1, y1), we should multiply x0 and y0 by 'r',
		// where r <= min( y1/y0, x1/x0 ).
		$r = min( $width / $this->width, $height / $this->height );

		$copy_width = $this->width * $r;
		$copy_height = $this->height * $r;
		$copy_x = round( ( $width - $copy_width ) / 2 );
		$copy_y = round( ( $height - $copy_height ) / 2 );

		imagecopyresampled(
			$box, $this->_img,
			$copy_x, $copy_y,
			0, 0,
			$copy_width, $copy_height,
			$this->width, $this->height
		);

		$this->replace_object( $box );
	}

	/*
	 * 5-size font has char width approximately 10px
	 * maybe, should consider some king of wrapping in
	 * case of outputting bix texts into the image?
	 *
	 * fontsize : character WxH:
	 * 5 : 8x10 bold
	 * 4 : 6x10 normal
	 * 3 : 6x8 bold
	 * 2 : 5x8 normal
	 * 1 : 4x6 bold
	 *
	 * positions: 0=center, 1=right bottom
	 */
	function drawText( $sString, $iFontSize = 2,
			$sColor = "#000", $iPosition = 0 )
	{
		$charSize = array();
		$charSize = array(
			1 => array( 4, 6 ),
			2 => array( 5, 8),
			3 => array( 6, 8),
			4 => array( 6, 10),
			5 => array( 9, 15 )
		);
		$sColor = $this->_color( $sColor );
		// can't see why there is one char-offset
		// had to add a space (to increase strlen by 1 for centering)
		$strW = strlen( $sString . " " ) * $charSize[$iFontSize][0];
		$strH = $charSize[$iFontSize][1];
		$left = 0;
		$top = 0;
		if( $iPosition == 0 ){ // centered
			$left = (int)(($this->width - $strW)/2);
			$top = (int)(($this->height - $strH)/2);
		}
		else if( $iPosition == 1 ){ // right bottom
			$left = $this->width - $strW;
			$top = $this->height - $strH;
		}

		imagestring( $this->_img, $iFontSize, $left, $top, $sString, $sColor );
	}

	//
	// Resizes the image to the given dimensions.
	// If one of the dimensions is omitted, it will be calculated
	// from the aspect ratio.
	//
	public function resize( $width = null, $height = null )
	{
		// At least one parameter should be present.
		if( !$width && !$height ) return false;

		// If only one dimension is given, calculate the other from AR.
		if( !$width || !$height )
		{
			$size = $this->calculate_dimensions( $width, $height );
			list( $width, $height ) = $size;
		}

		// If new dimensions are the same as old, don't do anything.
		if( $width == $this->width && $height == $this->height ){
			return true;
		}

		// Create an empty image with new size.
		$copy = $this->create_empty_image( $width, $height );

		// Copy original and resample it to new size.
		imagecopyresampled(
			$copy, $this->_img, // to, from
			0, 0, 0, 0, // "to" pos, "from" pos
			$width, $height, // "to" dimensions
			$this->width, $this->height // "from" dimensions
		);

		// Replace the old image object with the new one.
		$this->replace_object( $copy, $width, $height );

		return true;
	}

	public function limit( $width = null, $height = null )
	{
		// At least one parameter should be present.
		if( !$width && !$height ) return false;

		// If only one dimension is given, calculate the other from AR.
		if( !$width || !$height )
		{
			$size = $this->calculate_dimensions( $width, $height );
			list( $width, $height ) = $size;
		}

		// If new dimensions are not less than the old, return.
		if( $width >= $this->width && $height >= $this->height ){
			return true;
		}


		$ratio = max( $this->width / $width, $this->height / $height );
		$width = round( $this->width / $ratio );
		$height = round( $this->height / $ratio );

		// Create an empty image with new size.
		$copy = $this->create_empty_image( $width, $height );

		// Copy original and resample it to new size.
		imagecopyresampled(
			$copy, $this->_img, // to, from
			0, 0, 0, 0, // "to" pos, "from" pos
			$width, $height, // "to" dimensions
			$this->width, $this->height // "from" dimensions
		);

		// Replace the old image object with the new one.
		$this->replace_object( $copy, $width, $height );

		return true;
	}


	private function create_empty_image( $width, $height, $background = null )
	{
		$img = imagecreatetruecolor( $width, $height );
		imagealphablending( $img, false );
		imagesavealpha( $img, true );

		if( $background === null ){
			$bk = imagecolorallocatealpha( $img, 0, 0, 0, 127 );
		} else {
			$bk = $this->create_color( $background );
		}
		imagefill( $img, 1, 1, $bk );

		return $img;
	}

	private function create_image_copy( $original )
	{
		$width = imagesx( $original );
		$height = imagesy( $original );
		$copy = $this->create_empty_image( $width, $height );
		imagecopy(
			$copy, $original, // dest, src
			0, 0, // dest zero
			0, 0, // src zero
			$width, $height // size
		);
		return $copy;
	}


	private function calculate_dimensions( $width = null, $height = null )
	{
		if( $width && $height ){
			trigger_error( 'Only one dimension should be given' );
			return array( $width, $height );
		}

		$ratio = $this->width / $this->height;

		if( !$width ){
			$width = round( $ratio * $height );
		} else {
			$height = round( $width / $ratio );
		}

		return array( $width, $height );
	}

	//
	// Replaces the current image object with the given one and updates
	// the dimensions. If width and height are not given, they will be
	// retrieved from the object.
	//
	private function replace_object( $new_object, $width = null, $height = null )
	{
		imagedestroy( $this->_img );
		$this->_img = $new_object;

		if( !$width || !$height ){
			$this->width = imagesx( $this->_img );
			$this->height = imagesy( $this->_img );
		} else {
			$this->width = $width;
			$this->height = $height;
		}
	}
}
?>
