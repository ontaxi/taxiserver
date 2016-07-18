<?php
/*
 * Authorisation result
 */
class conn_user
{
	/*
	 * User type, user id and service id.
	 */
	public $type;
	public $id;
	public $sid;
	public $login;

	function __construct( $type, $id, $sid )
	{
		$this->type = $type;
		$this->id = $id;
		$this->sid = $sid;
	}

	/*
	 * Arbitrary data storage to make living in the single-threaded
	 * world easier.
	 */
	private $data = array();
	function data( $k, $v = null ) {
		if( $v === null ) {
			return array_alt( $this->data, $k, null );
		}
		else {
			$this->data[$k] = $v;
		}
	}

	function __toString() {
		return '{'."$this->type, #$this->id, $this->sid}";
	}
}
?>
