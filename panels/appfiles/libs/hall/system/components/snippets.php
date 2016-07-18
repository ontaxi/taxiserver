<?php

//
// A collection of commonly used HTML "idioms".
// These are very specific to the engine and are not reusable in other
// places. For general HTML idioms, see HTMLSnippets.
//

class Snippets
{
	static function pagebar( $url_template, $total_pages, $current_page = 1 )
	{
		if( $total_pages < 2 ) return '';

		if( $current_page > 1 )
		{
			$prev_url = str_replace( 'PAGE', $current_page - 1, $url_template );
			Renderer::add_head_link( 'prev', $prev_url );
		}

		if( $current_page + 1 <= $total_pages )
		{
			$next_url = str_replace( 'PAGE', $current_page + 1, $url_template );
			Renderer::add_head_link( 'next', $next_url );
		}

		$numbers = self::page_numbers( $current_page, $total_pages );
		ob_start();
		?>
		<nav class="pagebar">
			<ol>
				<?php foreach( $numbers as $num ){
					if( $num == $current_page ){
						?><li><a><?= $num ?></a></li><?php
					} else if( $num == 0 ){
						?><li>...</li><?php
					} else{
						$url = str_replace( 'PAGE', $num, $url_template );
						?><li><a href="<?= $url ?>"><?= $num ?></a></li><?php
					}
				}?>
			</ol>
		</nav>
		<?php
		return ob_get_clean();
	}

	private static function page_numbers( $current_page, $total_pages, $marker = 0 )
	{
		if( $total_pages <= 10 ){
			return range( 1, $total_pages );
		}

		$x = $current_page;
		$n = $total_pages;
		$m = 3; // margin

		$xrange = array();
		if( $x == $total_pages )
		{
			$xrange[] = $x-2;
			$xrange[] = $x-1;
			$xrange[] = $x;
		}
		else if( $x > 1 )
		{
			$xrange[] = $x-1;
			$xrange[] = $x;
			$xrange[] = $x+1;
		}

		$a = (int)round( $x/2 );

		if( 3 + $m + 1 + $m < $x-1 )
		{
			$pages = range( 1, 3 );
			$pages[] = $marker;
			$pages[] = $a;
			$pages[] = $marker;
			$pages = array_merge( $pages, $xrange );
		}
		else if( $x > 3 + $m + 1 ){
			$pages = range( 1, 3 );
			$pages[] = $marker;
			$pages = array_merge( $pages, $xrange );
		}
		else{
			$pages = range( 1, $x );
			if( $x < $total_pages ){
				$pages[] = $x+1;
			}
			if( $x == 1 ){
				$pages[] = $x+2;
			}
		}

		$b = (int)round( ($n+$x)/2 );

		if( $x + 1 + $m + 1 + $m + 3 < $n )
		{
			$pages[] = $marker;
			$pages[] = $b;
			$pages[] = $marker;
			$pages = array_merge( $pages, range( $n-2, $n ) );
		}
		else if( $x + 1 + $m < $n ){
			$pages[] = $marker;
			$pages = array_merge( $pages, range( $n-2, $n ) );
		}
		else if( $xrange[2] < $n ){
			$pages = array_merge( $pages, range( max( $n-2, $xrange[2] )+1, $n ) );
		}
		return $pages;
	}

	static function breadcrumbs( $elements )
	{
		?><nav class="breadcrumbs">
			<ul>
				<?php foreach( $elements as $e )
				{
					list( $title, $url ) = $e;
					if( $url ){
						?><li><a href="<?= $url ?>"><?= $title ?></a></li><?php
					} else {
						?><li><?= $title ?></li><?php
					}
				}?>
			</ul>
		</nav>
		<?php
	}

	static function action_result( $ok_message, $action_name = null )
	{
		$r = action_result( $action_name );
		if( $r === null ) return;

		if( $r ) {
			?><p class="notice"><?= $ok_message ?></p><?php
		} else {
			self::action_erorrs( $action_name );
		}
	}

	static function action_errors( $action_name = null )
	{
		$errors = action_errors( $action_name );
		if( !$errors ) return;
		ob_start();
		foreach( $errors as $error ){
			?><p class="error"><?= $error ?></p><?php
		}
		return ob_get_clean();
	}
}

?>
