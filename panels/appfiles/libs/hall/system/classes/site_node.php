<?php
class site_node
{
	public $view = null;
	public $name = null;
	public $args = array();
	public $ext_args = array();

	function id()
	{
		$parts = array( $this->view, $this->name );
		$parts = array_merge( $parts, $this->args );
		return implode( '-', $parts );
	}
}

?>
