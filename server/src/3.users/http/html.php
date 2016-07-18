<?php

function html_head( $title )
{
	?>
	<!DOCTYPE html>
	<html>
	<head>
	<title><?= htmlspecialchars( $title ) ?></title>
	<meta charset="utf-8">
	<style>
	body {
		font-family: sans-serif;
		font-size: 11pt;
	}

	h3 {
		font-size: 11pt;
	}

	h2 {
		font-size: 13.2pt;
	}

	h1 {
		font-size: 15.84pt;
	}

	table {
		border-spacing: 0;
	}

	td, th {
		border-bottom: 1px solid #eee;
		padding: 0.5em 1em;
	}
	</style>
	</head>
	<body>
		<h1><?= htmlspecialchars( $title ) ?></h1>
	<?php
}

function html_foot() {
	?>
	</body>
	</html>
	<?php
}

?>
