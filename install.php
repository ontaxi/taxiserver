<?php
require 'server/lib/mysql.php';
require 'server/lib/bcrypt.php';

// Database access
$host = 'localhost';
$user = 'root';
$pass = 'root';
$dbname = 'taxi';

$admin_login = 'admin';
$admin_password = 'admin';

$db = new mysql($host, $user, $pass, $dbname);

// Create a service account
$sid = $db->insertRecord( 'taxi_services', array(
	'name' => 'Service',
	'gps_tracking' => '1',
	'service_logs' => '1',
	'sessions' => '0',
	'imitations' => '0'
));

// Create admin account
$db->insertRecord( 'taxi_accounts', array(
	'service_id' => $sid,
	'type' => 'admin',
	'login' => $admin_login,
	'password_hash' => bcrypt( $admin_password )
));

?>
