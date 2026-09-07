<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();
	$data = gp_get_producto_data( get_the_ID() );
	?>
	<main class="gp-single">
		<div class="gp-single__contenedor">
			<?php gp_render_detalle( $data ); ?>
		</div>
	</main>
	<?php
endwhile;

get_footer();
