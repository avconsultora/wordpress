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
		add_filter( 'body_class', array( $this, 'body_class_archivo' ) );
	}

	/**
	 * Agrega una clase al body solo en la página que contiene el catálogo,
	 * permitiendo que el header transparente y el ajuste de contenedores Elementor
	 * apliquen únicamente en esa pantalla sin afectar el resto del sitio.
	 */
	public function body_class_archivo( $classes ) {
		if ( is_singular() ) {
			$post_id = get_queried_object_id();
			$post    = get_post( $post_id );
			if ( $post ) {
				$tiene = has_shortcode( $post->post_content, 'granalier_productos_archivo' );
				if ( ! $tiene ) {
					$elementor_data = get_post_meta( $post_id, '_elementor_data', true );
					if ( is_string( $elementor_data ) && false !== strpos( $elementor_data, 'granalier_productos_archivo' ) ) {
						$tiene = true;
					}
				}
				if ( $tiene ) {
					$classes[] = 'gp-pagina-archivo';
				}
			}
		}
		return $classes;
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
			data-partes="<?php echo esc_attr( implode( ' ', $data['partes'] ) ); ?>"
			aria-haspopup="dialog">
			<?php if ( $data['imagen'] ) : ?>
				<span class="gp-card__media">
					<?php
					echo get_the_post_thumbnail(
						$data['id'],
						'large',
						array(
							'alt'     => $data['titulo'],
							'loading' => 'lazy',
							'sizes'   => '(max-width: 600px) 50vw, (max-width: 900px) 33vw, 450px',
						)
					);
					?>
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

		$atts = shortcode_atts(
			array(
				'chancho'        => 'si',
				'titulo'         => __( 'Lo mejor de lo nuestro, lo mejor de nuestra tierra', 'granalier-productos' ),
				'seccion_partes' => 'si',
				'hero'           => 'si',
				'banner'         => 'https://granalier.com.ar/wp-content/uploads/2023/01/banner-cortes.png',
			),
			$atts,
			'granalier_productos_archivo'
		);

		$partes      = GP_Parte_Cerdo::obtener_partes();
		$con_chancho = ( 'no' !== $atts['chancho'] ) && ! empty( $partes );
		$con_hero    = ( 'no' !== $atts['hero'] );

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
		<script>if(document.body){document.body.classList.add('gp-pagina-archivo');}</script>
		<?php if ( $con_hero ) : ?>
			<section class="gp-hero" style="--gp-hero-bg: url('<?php echo esc_url( $atts['banner'] ); ?>');">
				<div class="gp-hero__contenido">
					<?php if ( ! empty( $atts['titulo'] ) ) : ?>
						<h1 class="gp-archivo__titulo gp-hero__titulo"><?php echo esc_html( $atts['titulo'] ); ?></h1>
					<?php endif; ?>
					<div class="gp-hero__linea" aria-hidden="true"></div>
				</div>
			</section>
		<?php endif; ?>
		<div class="gp-catalogo-wrap<?php echo $con_hero ? ' gp-catalogo-wrap--con-hero' : ''; ?>">
			<div class="gp-catalogo-container">
				<?php
				if ( ! $con_chancho && 'no' !== $atts['chancho'] ) {
					gp_aviso_admin(
						__( 'el diagrama del chancho no se muestra porque todavía ningún corte tiene su punto ubicado sobre la imagen.', 'granalier-productos' ),
						admin_url( 'edit-tags.php?taxonomy=parte_cerdo&post_type=producto' ),
						__( 'Ubicar los cortes →', 'granalier-productos' )
					);
				} elseif ( $con_chancho && 0 === gp_productos_con_corte() ) {
					gp_aviso_admin(
						__( 'los cortes ya están ubicados, pero ningún producto tiene asignada su parte del cerdo, así que el diagrama no filtra nada todavía.', 'granalier-productos' ),
						admin_url( 'edit.php?post_type=producto' ),
						__( 'Asignar cortes a los productos →', 'granalier-productos' )
					);
				}
				?>
				<?php if ( ! $con_hero && ! empty( $atts['titulo'] ) ) : ?>
					<h2 class="gp-archivo__titulo"><?php echo esc_html( $atts['titulo'] ); ?></h2>
				<?php endif; ?>

				<div class="gp-archivo<?php echo $con_chancho ? ' gp-archivo--con-chancho' : ''; ?>" data-gp-archivo>
					<div class="gp-archivo__productos">
						<?php if ( ! is_wp_error( $categorias ) && $categorias ) : ?>
							<div class="gp-filtros" role="tablist" aria-label="<?php esc_attr_e( 'Filtrar por categoría', 'granalier-productos' ); ?>">
								<button type="button" class="gp-filtro is-activo" data-gp-filtro="todos"><?php esc_html_e( 'TODOS', 'granalier-productos' ); ?></button>
								<?php foreach ( $categorias as $cat ) : ?>
									<button type="button" class="gp-filtro" data-gp-filtro="<?php echo esc_attr( $cat->slug ); ?>"><?php echo esc_html( $cat->name ); ?></button>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>

						<?php if ( $con_chancho ) : ?>
							<div class="gp-chip" data-gp-chip hidden>
								<span><?php esc_html_e( 'Corte', 'granalier-productos' ); ?>: <strong data-gp-chip-nombre></strong></span>
								<button type="button" data-gp-chip-limpiar aria-label="<?php esc_attr_e( 'Quitar filtro de corte', 'granalier-productos' ); ?>">&times;</button>
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

						<p class="gp-vacio" data-gp-sin-resultados hidden><?php esc_html_e( 'No hay productos con esa combinación de filtros.', 'granalier-productos' ); ?></p>
					</div>

					<?php if ( $con_chancho ) : ?>
						<aside class="gp-archivo__chancho" data-gp-panel-chancho>
							<div class="gp-panel">
								<div class="gp-panel__cabecera">
									<button type="button" class="gp-panel__cerrar" data-gp-panel-cerrar aria-label="<?php esc_attr_e( 'Cerrar', 'granalier-productos' ); ?>">&times;</button>
								</div>
								<?php $this->render_chancho( 'filtro' ); ?>
								<p class="gp-panel__ayuda"><?php esc_html_e( 'Tocá un punto para ver los productos de ese corte.', 'granalier-productos' ); ?></p>
							</div>
						</aside>

						<button type="button" class="gp-chancho-fab" data-gp-panel-abrir aria-expanded="false">
							<?php echo gp_chancho_icon(); ?>
							<span><?php esc_html_e( 'Ver por corte', 'granalier-productos' ); ?></span>
						</button>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php if ( 'si' === $atts['seccion_partes'] && ! empty( $partes ) ) : ?>
			<section class="gp-seccion-partes">
				<div class="gp-seccion-partes__container">
					<div class="gp-seccion-partes__col-texto">
						<h2 class="gp-seccion-partes__titulo"><?php esc_html_e( '¿Conocés las partes del cerdo?', 'granalier-productos' ); ?></h2>
						<p class="gp-seccion-partes__descripcion"><?php esc_html_e( 'Saber lo que comemos y como se elabora nos ayuda a tener una mejor idea de nuestra dieta y del esfuerzo y dedicación que se requiere para producir los alimentos.', 'granalier-productos' ); ?></p>
						<div class="gp-seccion-partes__linea" aria-hidden="true"></div>
					</div>
					<div class="gp-seccion-partes__col-diagrama">
						<?php $this->render_chancho( 'popup' ); ?>
					</div>
				</div>
			</section>
		<?php endif; ?>
		<?php
		return trim( ob_get_clean() );
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
		return trim( ob_get_clean() );
	}

	/* ---------------------------------------------------------------
	 * [granalier_chancho seccion="no"]
	 * ------------------------------------------------------------- */

	public function shortcode_chancho( $atts ) {
		$this->encolar_assets();

		$atts = shortcode_atts(
			array(
				'seccion' => 'no',
			),
			$atts,
			'granalier_chancho'
		);

		$partes = GP_Parte_Cerdo::obtener_partes();

		ob_start();
		if ( empty( $partes ) ) {
			gp_aviso_admin(
				__( 'el diagrama se ve sin puntos porque todavía ningún corte tiene su ubicación cargada.', 'granalier-productos' ),
				admin_url( 'edit-tags.php?taxonomy=parte_cerdo&post_type=producto' ),
				__( 'Ubicar los cortes →', 'granalier-productos' )
			);
		}

		if ( 'si' === $atts['seccion'] ) {
			?>
			<section class="gp-seccion-partes">
				<div class="gp-seccion-partes__container">
					<div class="gp-seccion-partes__col-texto">
						<h2 class="gp-seccion-partes__titulo"><?php esc_html_e( '¿Conocés las partes del cerdo?', 'granalier-productos' ); ?></h2>
						<p class="gp-seccion-partes__descripcion"><?php esc_html_e( 'Saber lo que comemos y como se elabora nos ayuda a tener una mejor idea de nuestra dieta y del esfuerzo y dedicación que se requiere para producir los alimentos.', 'granalier-productos' ); ?></p>
						<div class="gp-seccion-partes__linea" aria-hidden="true"></div>
					</div>
					<div class="gp-seccion-partes__col-diagrama">
						<?php $this->render_chancho( 'popup' ); ?>
					</div>
				</div>
			</section>
			<?php
		} else {
			$this->render_chancho( 'popup' );
		}

		return trim( ob_get_clean() );
	}

	/**
	 * El diagrama, en dos modos:
	 * - popup: el del home y la sección educativa. Al pasar el mouse lista
	 *   los productos de esa parte y al hacer clic abre la ficha.
	 * - filtro: el de la columna del archivo. Al pasar el mouse resalta
	 *   los productos de esa parte en la grilla y al hacer clic filtra.
	 */
	private function render_chancho( $modo = 'popup' ) {
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

		$es_popup = ( 'popup' === $modo );
		?>
		<div class="gp-chancho gp-chancho--<?php echo esc_attr( $modo ); ?>" data-gp-chancho data-gp-modo="<?php echo esc_attr( $modo ); ?>">
			<div class="gp-chancho__lienzo">
				<img class="gp-chancho__img" src="<?php echo esc_url( GP_Settings::imagen_chancho() ); ?>" alt="<?php esc_attr_e( 'Diagrama de cortes de cerdo Granalier', 'granalier-productos' ); ?>" />

				<?php foreach ( $partes as $parte ) : ?>
					<?php
					$vacio = empty( $parte['productos'] );
					if ( $vacio ) {
						continue; // Ocultar puntos del cerdo sin productos asociados
					}
					$solo_id = ( $es_popup && 1 === count( $parte['productos'] ) ) ? $parte['productos'][0]->ID : '';
					?>
					<button
						type="button"
						class="gp-hotspot"
						style="left:<?php echo esc_attr( $parte['x'] ); ?>%;top:<?php echo esc_attr( $parte['y'] ); ?>%;"
						data-parte="<?php echo esc_attr( $parte['slug'] ); ?>"
						data-nombre="<?php echo esc_attr( $parte['nombre'] ); ?>"
						<?php if ( $solo_id ) : ?>data-gp-solo="<?php echo esc_attr( $solo_id ); ?>"<?php endif; ?>
						aria-label="<?php echo esc_attr( $parte['nombre'] ); ?>"
					><span class="gp-hotspot__anillo"></span></button>
				<?php endforeach; ?>

				<?php if ( ! $es_popup ) : ?>
					<span class="gp-etiqueta" data-gp-etiqueta hidden></span>
				<?php endif; ?>
			</div>

			<?php if ( $es_popup ) : ?>
				<?php foreach ( $partes as $parte ) : ?>
					<?php
					$productos = $parte['productos'];
					if ( empty( $productos ) ) {
						continue;
					}
					?>
					<template data-gp-popover="<?php echo esc_attr( $parte['slug'] ); ?>">
						<div class="gp-popover__titulo"><?php echo esc_html( $parte['nombre'] ); ?></div>
						<ul class="gp-popover__lista">
							<?php foreach ( $productos as $post ) : ?>
								<li>
									<button type="button" data-gp-open="<?php echo esc_attr( $post->ID ); ?>">
										<?php if ( has_post_thumbnail( $post ) ) : ?>
											<?php echo get_the_post_thumbnail( $post, 'medium', array( 'alt' => get_the_title( $post ) ) ); ?>
										<?php endif; ?>
										<span><?php echo esc_html( get_the_title( $post ) ); ?></span>
									</button>
								</li>
							<?php endforeach; ?>
						</ul>
					</template>
					<?php $this->render_templates_producto( wp_list_pluck( $productos, 'ID' ) ); ?>
				<?php endforeach; ?>

				<div class="gp-popover" data-gp-popover-render hidden></div>
			<?php else : ?>
				<ul class="gp-chancho__lista">
					<?php foreach ( $partes as $parte ) : ?>
						<?php if ( ! empty( $parte['productos'] ) ) : ?>
							<li>
								<button
									type="button"
									class="gp-parte-chip"
									data-parte="<?php echo esc_attr( $parte['slug'] ); ?>"
									data-nombre="<?php echo esc_attr( $parte['nombre'] ); ?>"
								><?php echo esc_html( $parte['nombre'] ); ?></button>
							</li>
						<?php endif; ?>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>
		<?php
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
			$post    = get_page_by_path( $atts['slug'], OBJECT, 'producto' );
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
		return trim( ob_get_clean() );
	}
}
