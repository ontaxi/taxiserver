<?php

class tbl
{
	public $rows = array();

	private $width = 0;
	private $height = 0;

	function __construct()
	{
	}

	private function add_column()
	{
		$this->width++;
		foreach( $this->rows as $i => $row )
		{
			$this->rows[$i][] = '';
		}
	}

	private function add_row()
	{
		$this->height++;
		$row = array();
		for( $i = 0; $i < $this->width; $i++ )
		{
			$row[] = '';
		}
		$this->rows[] = $row;
	}

	function set_cell( $row, $col, $value )
	{
		while( $this->width <= $col ) {
			$this->add_column();
		}
		while( $this->height <= $row ) {
			$this->add_row();
		}
		$this->rows[$row][$col] = $value;
	}

	function slice_row( $row, $col1, $n )
	{
		$s = array();
		$n += $col1;
		for( $i = $col1; $i < $n; $i++ )
		{
			$s[] = $this->rows[$row][$i];
		}

		return $s;
	}

	function slice_col( $col, $row1, $n )
	{
		$s = array();
		$n += $row1;
		for( $i = $row1; $i < $n; $i++ )
		{
			$s[] = $this->rows[$i][$col];
		}

		return $s;
	}
}

?>
