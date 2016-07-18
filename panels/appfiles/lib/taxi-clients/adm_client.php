<?php

class adm_client extends server_client
{
	function connect( $addr ) {
		return parent::connect( $addr ) && $this->init();
	}

	private function init()
	{
		$this->send_message( 'auth-adm' );
		$m = $this->receive_message();
		return $m && $m['command'] == 'auth-ok';
	}

	function get_info( $full = false )
	{
		$full = $full ? '1' : '0';
		$this->send_message( 'get-info', array( 'full' => $full ) );
		$m = $this->receive_message();
		return $m['data']['str'];
	}

	function dump_memlog( $comments = '', $path = null )
	{
		$this->send_message( 'memlog-dump', array(
			'filepath' => $path,
			'comments' => $comments
		));

		$m = $this->receive_message();
		return array();
	}
}

?>
