<?php

//
// rus_number_phrase
//
// Example:
// 	echo rus_number_phrase( 136, '%d результат', '%d результата', '%d результатов' );
//
function rus_number_phrase( $number, $template_one, $template_two, $template_five )
{
	/*
	 * 1, 21, 31, ... *1 результат
	 * 2..4 результата
	 * 5..10, {*11..*14}, {*5, *6, ...*0} результатов
	 * rus_number_phrase( 136, '%d результат', '%d результата', '%d результатов' );
	 */

	$units = $number % 10;
	$five = (($number % 100) >= 11 && ($number % 100) <= 14) || ($units >= 5 && $units <= 9) || ($units == 0);
	if( $five ){
		$template = $template_five;
	} else if( $units == 1 ){
		$template = $template_one;
	} else {
		$template = $template_two;
	}
	return sprintf( $template, $number );
}

// Output example: "3 января".
function rus_date( $time )
{
	$months = array( '', 'января', 'февраля', 'марта', 'апреля', 'мая',
		'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября',
		'декабря' );
	return date( 'd', $time ).' '.$months[date('n', $time)];
}

?>
