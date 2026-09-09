<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GP_Shortcodes {

	private static $instance = null;
	protected static $ids_renderizados = array();
	protected static $modal_impreso    = false;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_shortcode( 'granalier_productos_archivo', array( $this, 'shortcode_archivo' ) );
		add_shortcode( 'granalier_productos_destacados', array( $this, 'shortcode_destacados' ) );
		add_shortcode( 'granalier_chancho', array( $this, 'shortcode_chancho' ) );
		add_shortcode( 'granalier_producto', array( $this, 'shortcode_producto' ) );

		add_action( 'wp_footer', array( $this, 'imprimir_modal' ) );
	}

	private function encolar_assets() {
		GP_Assets::encolar();
	}

	/* ---------------------------------------------------------------
	 * Helpers de render compartidos
	 * ------------------------------------------------------------- */

	private function render_templates_producto( $ids ) {
		foreach ( (array) $ids as $id ) {
			$id = (int) $id;
			if ( isset( self::$ids_renderizados[ $id ] ) ) {
				continue;
			}
			$data = gp_get_producto_data( $id );
			if ( ! $data ) {
				continue;
			}
			self::$ids_renderizados[ $id ] = true;
			echo '<template id="gp-tpl-' . esc_attr( $id ) . '">';
			gp_render_detalle( $data );
			echo '</template>';
		}
	}

	private function render_card( $data, $sin_fondo = false ) {
		if ( empty( $data ) ) {
			return;
		}
		$clases  = 'gp-card' . ( $sin_fondo ? ' gp-card--sinfondo' : '' );
		$clases .= $data['imagen'] ? '' : ' gp-card--sin-foto';
		?>
		<button type="button"
			class="<?php echo esc_attr( $clases ); ?>"
			data-gp-open="<?php echo esc_attr( $data['id'] ); ?>"
			data-cats="<?php echo esc_attr( implode( ' ', $data['cat_slugs'] ) ); ?>"
			aria-haspopup="dialog">
			<?php if ( $data['imagen'] ) : ?>
				<span class="gp-card__media">
					<img src="<?php echo esc_url( $data['imagen'] ); ?>" alt="<?php echo esc_attr( $data['titulo'] ); ?>" loading="lazy" />
				</span>
			<?php endif; ?>
			<span class="gp-card__body">
				<span class="gp-card__titulo"><?php echo esc_html( $data['titulo'] ); ?></span>
				<?php if ( $data['presentacion'] ) : ?>
					<span class="gp-card__presentacion"><?php echo esc_html( $data['presentacion'] ); ?></span>
				<?php endif; ?>
			</span>
		</button>
		<?php
		$this->render_templates_producto( array( $data['id'] ) );
	}

	public function imprimir_modal() {
		if ( self::$modal_impreso || empty( self::$ids_renderizados ) ) {
			return;
		}
		self::$modal_impreso = true;
		?>
		<div id="gp-modal" class="gp-modal" hidden aria-hidden="true">
			<div class="gp-modal__overlay" data-gp-close></div>
			<div class="gp-modal__dialog" role="dialog" aria-modal="true">
				<button type="button" class="gp-modal__cerrar" data-gp-close aria-label="<?php esc_attr_e( 'Cerrar', 'granalier-productos' ); ?>">&times;</button>
				<div class="gp-modal__body"></div>
			</div>
		</div>
		<?php
	}

	/* ---------------------------------------------------------------
	 * [granalier_productos_archivo]
	 * ------------------------------------------------------------- */

	public function shortcode_archivo( $atts ) {
		$this->encolar_assets();

		$posts = get_posts(
			array(
				'post_type'      => 'producto',
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);

		$categorias = get_terms(
			array(
				'taxonomy'   => 'cat-prod',
				'hide_empty' => false,
			)
		);

		ob_start();
		?>
		<div class="gp-archivo">
			<?php if ( ! is_wp_error( $categorias ) && $categorias ) : ?>
				<div class="gp-filtros" role="tablist" aria-label="<?php esc_attr_e( 'Filtrar por categoría', 'granalier-productos' ); ?>">
					<button type="button" class="gp-filtro is-activo" data-gp-filtro="todos"><?php esc_html_e( 'Todos', 'granalier-productos' ); ?></button>
					<?php foreach ( $categorias as $cat ) : ?>
						<button type="button" class="gp-filtro" data-gp-filtro="<?php echo esc_attr( $cat->slug ); ?>"><?php echo esc_html( $cat->name ); ?></button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<div class="gp-grid" data-gp-grid>
				<?php
				if ( $posts ) {
					foreach ( $posts as $post ) {
						$this->render_card( gp_get_producto_data( $post->ID ) );
					}
				} else {
					echo '<p class="gp-vacio">' . esc_html__( 'Todavía no hay productos cargados.', 'granalier-productos' ) . '</p>';
				}
				?>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/* ---------------------------------------------------------------
	 * [granalier_productos_destacados cantidad="6" categoria="cortes"]
	 * ------------------------------------------------------------- */

	public function shortcode_destacados( $atts ) {
		$this->encolar_assets();

		$atts = shortcode_atts(
			array(
				'cantidad'  => 6,
				'categoria' => '',
			),
			$atts,
			'granalier_productos_destacados'
		);

		$args = array(
			'post_type'      => 'producto',
			'posts_per_page' => (int) $atts['cantidad'],
			'meta_key'       => 'gp_destacado',
			'meta_value'     => '1',
			'orderby'        => 'title',
			'order'          => 'ASC',
		);

		if ( $atts['categoria'] ) {
			$args['tax_query'] = array(
				array(
					'taxonomy' => 'cat-prod',
					'field'    => 'slug',
					'terms'    => sanitize_title( $atts['categoria'] ),
				),
			);
		}

		$posts = get_posts( $args );

		if ( ! $posts ) {
			unset( $args['meta_key'], $args['meta_value'] );
			$args['orderby'] = 'date';
			$args['order']   = 'DESC';
			$posts           = get_posts( $args );
		}

		ob_start();
		?>
		<div class="gp-grid gp-grid--destacados">
			<?php foreach ( $posts as $post ) : ?>
				<?php $this->render_card( gp_get_producto_data( $post->ID ), true ); ?>
			<?php endforeach; ?>
		</div>
		<?php
		return ob_get_clean();
	}

	/* ---------------------------------------------------------------
	 * [granalier_chancho]
	 * ------------------------------------------------------------- */

	public function shortcode_chancho( $atts ) {
		$this->encolar_assets();

		$partes = GP_Parte_Cerdo::obtener_partes();

		foreach ( $partes as $indice => $parte ) {
			$productos = get_posts(
				array(
					'post_type'      => 'producto',
					'posts_per_page' => -1,
					'tax_query'      => array(
						array(
							'taxonomy' => 'parte_cerdo',
							'field'    => 'slug',
							'terms'    => $parte['slug'],
						),
					),
				)
			);
			$partes[ $indice ]['productos'] = $productos;
		}

		ob_start();
		?>
		<div class="gp-chancho" data-gp-chancho>
			<div class="gp-chancho__lienzo">
				<img class="gp-chancho__img" src="<?php echo esc_url( GP_Settings::imagen_chancho() ); ?>" alt="<?php esc_attr_e( 'Diagrama de cortes de cerdo Granalier', 'granalier-productos' ); ?>" />

				<?php foreach ( $partes as $parte ) : ?>
					<?php
					$vacio = empty( $parte['productos'] );
					$solo_id = ( 1 === count( $parte['productos'] ) ) ? $parte['productos'][0]->ID : '';
					?>
					<button
						type="button"
						class="gp-hotspot<?php echo $vacio ? ' gp-hotspot--vacio' : ''; ?>"
						style="left:<?php echo esc_attr( $parte['x'] ); ?>%;top:<?php echo esc_attr( $parte['y'] ); ?>%;"
						data-parte="<?php echo esc_attr( $parte['slug'] ); ?>"
						<?php if ( $solo_id ) : ?>data-gp-solo="<?php echo esc_attr( $solo_id ); ?>"<?php endif; ?>
						aria-label="<?php echo esc_attr( $parte['nombre'] ); ?>"
					><span class="gp-hotspot__anillo"></span></button>
				<?php endforeach; ?>
			</div>

			<?php foreach ( $partes as $parte ) : ?>
				<?php $productos = $parte['productos']; ?>
				<template data-gp-popover="<?php echo esc_attr( $parte['slug'] ); ?>">
					<div class="gp-popover__titulo"><?php echo esc_html( $parte['nombre'] ); ?></div>
					<?php if ( $productos ) : ?>
						<ul class="gp-popover__lista">
							<?php foreach ( $productos as $post ) : ?>
								<li>
									<button type="button" data-gp-open="<?php echo esc_attr( $post->ID ); ?>">
										<?php if ( has_post_thumbnail( $post ) ) : ?>
											<?php echo get_the_post_thumbnail( $post, 'thumbnail' ); ?>
										<?php endif; ?>
										<span><?php echo esc_html( get_the_title( $post ) ); ?></span>
									</button>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php else : ?>
						<p class="gp-popover__vacio"><?php esc_html_e( 'Próximamente', 'granalier-productos' ); ?></p>
					<?php endif; ?>
				</template>
				<?php $this->render_templates_producto( wp_list_pluck( $productos, 'ID' ) ); ?>
			<?php endforeach; ?>

			<div class="gp-popover" data-gp-popover-render hidden></div>
		</div>
		<?php
		return ob_get_clean();
	}

	/* ---------------------------------------------------------------
	 * [granalier_producto id="123"]
	 * ------------------------------------------------------------- */

	public function shortcode_producto( $atts ) {
		$this->encolar_assets();

		$atts = shortcode_atts(
			array(
				'id'   => 0,
				'slug' => '',
			),
			$atts,
			'granalier_producto'
		);

		$post_id = 0;
		if ( $atts['id'] ) {
			$post_id = (int) $atts['id'];
		} elseif ( $atts['slug'] ) {
			$post = get_page_by_path( $atts['slug'], OBJECT, 'producto' );
			$post_id = $post ? $post->ID : 0;
		}

		if ( ! $post_id ) {
			return '';
		}

		$data = gp_get_producto_data( $post_id );
		if ( ! $data ) {
			return '';
		}

		ob_start();
		echo '<div class="gp-producto-embebido">';
		gp_render_detalle( $data );
		echo '</div>';
		return ob_get_clean();
	}
}
