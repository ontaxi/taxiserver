<?php
class MySQLStream
{
	private $result;

	public function __construct( $result ){
		$this->result = $result;
	}

	public function getRecord(){
		return $this->result->fetch_assoc();
	}

	public function getValue(){
		$r = $this->result->fetch_row();
		return $r[0];
	}
}
?>
