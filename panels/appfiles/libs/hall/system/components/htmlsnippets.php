<?php

class HTMLSnippets
{
	/*
	Creates a listbox. $items can be:
	1) indexed array (option titles, numbers will be used as values),
	2) associative array (option value => option title),
	3) array of two arrays (option keys, option titles).

	$selected_key tells the index of the item that should be selected.
	It can be also an array of selected keys (in case of multiple
	select).

	By default an empty entry is added to the array unless $add_empty is
	set to false or the array already has element with index ''.

	$name can be:
	1) string value for "name" attribute
	2) associative array (attrbute name => attribute value) for
	arbitrary attributes.

	$empty_option has the default title for the option that has empty
	value. If set to null, no empty option is added, unless it is
	present in $items.
	*/
	static function select( $name, $items, $selected_key = '',
		$empty_option = '' )
	{
		if( isset( $items[0] ) && is_array( $items[0] ) ){
			$keys = $items[0];
			$titles = $items[1];
		} else {
			$keys = array_keys( $items );
			$titles = array_values( $items );
		}

		if( is_array( $selected_key ) ){
			$selected_keys = $selected_key;
		} else {
			$selected_keys = array( $selected_key );
		}

		$lines = array( '<select '.self::tagparameters( $name ).'>' );

		if( $empty_option !== null && !isset( $items[''] ) ){
			$lines[] = '<option value="">'.$empty_option.'</option>';
		}

		foreach( $keys as $i => $key )
		{
			$s = '<option value="'.htmlspecialchars( $key ).'"';
			if( in_array( $key, $selected_keys ) ){
				$s .= ' selected';
			}
			$s .= '>'.$titles[$i] .'</option>';
			$lines[] = $s;
		}
		$lines[] = '</select>';
		return PHP_EOL . implode( PHP_EOL, $lines );
	}

	static function checkbox( $name, $checked = false, $value = null )
	{
		$s = '<input type="checkbox" '.self::tagparameters( $name );
		if( $checked ) $s .= ' checked';
		if( $value !== null ){
			$s .= ' value="'.$value.'"';
		}
		$s .= '>';
		return $s;
	}

	/*
	 * Counter for automatically generated identifiers.
	 */
	private static $ids = 0;

	private static function uniqid() {
		self::$ids++;
		return '__input__'.self::$ids;
	}

	/*
	 * Creates a checkbox with a label that has reference ("for"
	 * attribute) to the checkbox. If "id" parameter is not given in the
	 * $other array, it is generated from the $name.
	 */
	static function labelled_checkbox( $label, $name,
		$value = '1', $checked = false, $other = array() )
	{
		$props = array(
			'name' => $name,
			'value' => $value,
			'checked' => (bool)$checked
		);
		$props = array_merge( $props, $other );

		if( !isset( $props['id'] ) ) {
			$props['id'] = self::uniqid();
		}

		$id = $props['id'];
		$s = '<input type="checkbox" ';
		$s .= self::tagparameters( $props );
		$s .= '>'.PHP_EOL;
		$s .= '<label for="'.$id.'">'.$label.'</label>';
		return $s;
	}

	static function pubdate( $time, $format = 'd.m.Y, H:i' )
	{
		$datetime = date( 'Y-m-d\TH:i:sO', $time );
		$formatted = date( $format, $time );
		return '<time datetime="'.$datetime.'">'.$formatted.'</time>';
	}

	static function link( $href, $text ){
		return sprintf( '<a href="%s">%s</a>', $href, $text );
	}

	static function ul( $items ){
		return '<ul><li>'.implode( '</li><li>', $items ).'</li></ul>';
	}

	static function ol( $items ){
		return '<ol><li>'.implode( '</li><li>', $items ).'</li></ol>';
	}

	static function image( $src, $alt = "" ){
		return '<img src="'.$src.'" alt="'.htmlspecialchars( $alt ).'">';
	}

	static function dl( $items )
	{
		if( !count( $items ) ) return '';

		$s = '<dl>';
		foreach( $items as $t => $d ){
			$s .= "<dt>$t</dt><dd>$d</dd>";
		}
		$s .= '</dl>';
		return $s;
	}

	static function radio( $name, $options, $checked = null )
	{
		$s = "";
		foreach( $options as $k => $title ) {
			$id = self::uniqid();
			$s .= '<input id="'.$id.'" type="radio" name="'.$name.'" value="'.$k.'"';
			if( $k == $checked ) $s .= ' checked';
			$s .= '>';

			$s .= '<label for="'.$id.'">'.$title.'</label>';
		}
		return $s;
	}

	private static function tagparameters( $name_or_array )
	{
		if( !is_array( $name_or_array ) ){
			return ' name="'.$name_or_array.'"';
		}

		$s = array();
		foreach( $name_or_array as $name => $value )
		{
			if( is_bool( $value ) ){
				if( $value ){
					$s[] = $name;
				}
			} else {
				$s[] = sprintf( '%s="%s"', $name, $value );
			}
		}
		return implode( ' ', $s );
	}
}

?>
