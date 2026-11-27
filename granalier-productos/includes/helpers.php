<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Versión de un archivo de assets, basada en su fecha de modificación.
 * Así cada cambio en el CSS o el JS rompe la caché del navegador solo,
 * sin tener que acordarse de subir el número de versión del plugin.
 */
function gp_asset_version( $ruta_relativa ) {
	$archivo = GP_PLUGIN_DIR . $ruta_relativa;
	return file_exists( $archivo ) ? GP_VERSION . '.' . filemtime( $archivo ) : GP_VERSION;
}

/**
 * Devuelve el valor de un campo del producto, usando ACF si está activo
 * y cayendo a post meta simple si no (para no depender de un plugin externo).
 */
function gp_field( $key, $post_id ) {
	if ( function_exists( 'get_field' ) ) {
		$value = get_field( $key, $post_id );
		if ( ! empty( $value ) ) {
			return $value;
		}
	}
	return get_post_meta( $post_id, $key, true );
}

function gp_is_destacado( $post_id ) {
	if ( function_exists( 'get_field' ) ) {
		return (bool) get_field( 'gp_destacado', $post_id );
	}
	return '1' === get_post_meta( $post_id, 'gp_destacado', true );
}

function gp_whatsapp_numero() {
	$numero = get_option( 'gp_whatsapp_numero', '543434706157' );
	return preg_replace( '/[^0-9]/', '', $numero );
}

function gp_whatsapp_mensaje( $titulo = '' ) {
	$plantilla = get_option( 'gp_whatsapp_mensaje', 'Hola! Me interesa distribuir productos Granalier{producto}.' );
	$extra     = $titulo ? ' (' . $titulo . ')' : '';
	return str_replace( '{producto}', $extra, $plantilla );
}

function gp_whatsapp_url( $titulo = '' ) {
	$numero  = gp_whatsapp_numero();
	$mensaje = rawurlencode( gp_whatsapp_mensaje( $titulo ) );
	return "https://wa.me/{$numero}?text={$mensaje}";
}

/**
 * Arma el array de datos de un producto, listo para pintar tarjetas,
 * el popup y los tooltips del chancho con imágenes de alta definición.
 */
function gp_get_producto_data( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || 'producto' !== $post->post_type ) {
		return null;
	}

	$categorias = wp_get_post_terms( $post_id, 'cat-prod', array( 'fields' => 'all' ) );
	$partes     = wp_get_post_terms( $post_id, 'parte_cerdo', array( 'fields' => 'slugs' ) );

	$imagen_large = get_the_post_thumbnail_url( $post_id, 'large' );
	$imagen_full  = get_the_post_thumbnail_url( $post_id, 'full' );

	return array(
		'id'            => $post_id,
		'titulo'        => get_the_title( $post_id ),
		'permalink'     => get_permalink( $post_id ),
		'imagen'        => $imagen_large ? $imagen_large : $imagen_full,
		'imagen_grande' => $imagen_full ? $imagen_full : $imagen_large,
		'presentacion'  => gp_field( 'presentacion', $post_id ),
		'tips'          => gp_field( 'tips_consumo', $post_id ),
		'categorias'    => is_wp_error( $categorias ) ? array() : $categorias,
		'cat_slugs'     => is_wp_error( $categorias ) ? array() : wp_list_pluck( $categorias, 'slug' ),
		'partes'        => is_wp_error( $partes ) ? array() : $partes,
		'destacado'     => gp_is_destacado( $post_id ),
	);
}

/**
 * Contenido interno del popup/ficha de un producto (se reutiliza en el
 * <template> de las tarjetas y en el single de WordPress).
 * Utiliza imagen nítida en alta resolución ('full' o 'large') y srcset calibrado.
 */
function gp_render_detalle( $data, $echo = true ) {
	if ( empty( $data ) ) {
		return '';
	}

	ob_start();
	?>
	<div class="gp-detalle" data-id="<?php echo esc_attr( $data['id'] ); ?>">
		<?php if ( $data['imagen_grande'] || $data['imagen'] ) : ?>
			<div class="gp-detalle__media">
				<?php
				echo get_the_post_thumbnail(
					$data['id'],
					'full',
					array(
						'alt'     => $data['titulo'],
						'loading' => 'lazy',
						'sizes'   => '(max-width: 640px) 92vw, 600px',
					)
				);
				?>
			</div>
		<?php endif; ?>
		<div class="gp-detalle__info">
			<?php if ( ! empty( $data['categorias'] ) ) : ?>
				<p class="gp-detalle__cat">
					<?php echo esc_html( implode( ' · ', wp_list_pluck( $data['categorias'], 'name' ) ) ); ?>
				</p>
			<?php endif; ?>
			<h2 class="gp-detalle__titulo"><?php echo esc_html( $data['titulo'] ); ?></h2>
			<?php if ( $data['presentacion'] ) : ?>
				<span class="gp-detalle__etiqueta"><?php esc_html_e( 'Presentación', 'granalier-productos' ); ?></span>
				<p class="gp-detalle__presentacion"><?php echo esc_html( $data['presentacion'] ); ?></p>
			<?php endif; ?>
			<?php if ( $data['tips'] ) : ?>
				<div class="gp-detalle__tips">
					<span class="gp-detalle__etiqueta"><?php esc_html_e( 'Tip de consumo', 'granalier-productos' ); ?></span>
					<p><?php echo esc_html( $data['tips'] ); ?></p>
				</div>
			<?php endif; ?>
			<a class="gp-cta-whatsapp" target="_blank" rel="nofollow noopener" href="<?php echo esc_url( gp_whatsapp_url( $data['titulo'] ) ); ?>">
				<?php echo gp_whatsapp_icon(); ?>
				<span><?php esc_html_e( 'Quiero distribuir Granalier', 'granalier-productos' ); ?></span>
			</a>
		</div>
	</div>
	<?php
	$html = ob_get_clean();

	if ( $echo ) {
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	return $html;
}

/**
 * Cantidad de productos que tienen al menos un corte asignado.
 */
function gp_productos_con_corte() {
	$ids = get_posts(
		array(
			'post_type'      => 'producto',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'tax_query'      => array(
				array(
					'taxonomy' => 'parte_cerdo',
					'operator' => 'EXISTS',
				),
			),
		)
	);
	return count( $ids );
}

/**
 * Aviso que solo ve quien administra el sitio, para que una sección que
 * no aparece por falta de datos no quede fallando en silencio.
 */
function gp_aviso_admin( $mensaje, $url = '', $texto_enlace = '' ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="gp-aviso">
		<strong><?php esc_html_e( 'Granalier Productos', 'granalier-productos' ); ?>:</strong>
		<?php echo esc_html( $mensaje ); ?>
		<?php if ( $url ) : ?>
			<a href="<?php echo esc_url( $url ); ?>"><?php echo esc_html( $texto_enlace ); ?></a>
		<?php endif; ?>
		<em><?php esc_html_e( '(Este aviso solo lo ves vos, con sesión de administrador.)', 'granalier-productos' ); ?></em>
	</div>
	<?php
}

/**
 * Ícono limpio e inconfundible de cabeza de cerdo para el botón flotante en mobile.
 * ViewBox 24x24 cuadrado, proporciones verificadas con fill-rule evenodd.
 */
function gp_chancho_icon() {
	return '<svg class="gp-icon-chancho" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.2 6C10.6 5.2 13.4 5.2 15.8 6C17.4 3.4 20.2 3.2 21 4.6C21.8 6 21 8.2 20.3 9.4C21.2 10.9 21.6 12.4 21.6 13.8C21.6 18.2 17.4 21.2 12 21.2C6.6 21.2 2.4 18.2 2.4 13.8C2.4 12.4 2.8 10.9 3.7 9.4C3 8.2 2.2 6 3 4.6C3.8 3.2 6.6 3.4 8.2 6ZM8.2 9.45A1.15 1.15 0 1 0 8.2 11.75A1.15 1.15 0 1 0 8.2 9.45ZM15.8 9.45A1.15 1.15 0 1 0 15.8 11.75A1.15 1.15 0 1 0 15.8 9.45ZM12 12.2A4.7 3.2 0 1 0 12 18.6A4.7 3.2 0 1 0 12 12.2ZM12 13.45A3.4 1.95 0 1 0 12 17.35A3.4 1.95 0 1 0 12 13.45ZM10.6 14.6A0.8 0.8 0 1 0 10.6 16.2A0.8 0.8 0 1 0 10.6 14.6ZM13.4 14.6A0.8 0.8 0 1 0 13.4 16.2A0.8 0.8 0 1 0 13.4 14.6Z"/></svg>';
}

function gp_whatsapp_icon() {
	return '<svg class="gp-icon-wa" viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false"><path d="M16.04 2.67c-7.36 0-13.33 5.97-13.33 13.33 0 2.35.62 4.63 1.79 6.64L2.67 29.33l6.86-1.8a13.27 13.27 0 0 0 6.51 1.66h.01c7.36 0 13.33-5.97 13.33-13.33S23.4 2.67 16.04 2.67Zm0 24.4h-.01a11.1 11.1 0 0 1-5.65-1.55l-.4-.24-4.07 1.07 1.09-3.97-.26-.41a11.06 11.06 0 0 1-1.7-5.93c0-6.13 4.99-11.12 11.12-11.12 2.97 0 5.76 1.16 7.86 3.26a11.03 11.03 0 0 1 3.25 7.86c0 6.13-4.99 11.03-11.13 11.03Zm6.1-8.3c-.33-.17-1.97-.97-2.28-1.08-.31-.11-.53-.17-.76.17-.22.33-.87 1.08-1.07 1.3-.2.22-.39.25-.72.08-.33-.17-1.39-.51-2.65-1.63-.98-.87-1.64-1.95-1.83-2.28-.19-.33-.02-.5.15-.67.15-.15.33-.39.5-.58.16-.2.22-.33.33-.55.11-.22.06-.42-.03-.58-.08-.17-.76-1.83-1.04-2.5-.27-.65-.55-.56-.76-.57l-.65-.01c-.22 0-.58.08-.89.42-.31.33-1.17 1.14-1.17 2.79 0 1.64 1.2 3.23 1.36 3.45.17.22 2.35 3.6 5.7 5.05.8.35 1.42.55 1.9.7.8.26 1.53.22 2.1.13.64-.1 1.97-.8 2.25-1.58.28-.77.28-1.43.2-1.57-.08-.14-.3-.22-.63-.39Z"/></svg>';
}
