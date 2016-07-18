<?php _header(); ?>

<?php
$dir = argv(1);
$name = argv(2);
$template = $dir.'/'.$name;
if( !$dir || !$name || !file_exists( dirname(__FILE__)."/$template.php" ) ) {
	error_notfound();
}
echo template( $template );
?>

<?php _footer(); ?>
