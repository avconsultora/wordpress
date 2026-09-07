<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra el CPT "producto" y la taxonomía "cat-prod" solo si todavía
 * no existen en el sitio (hoy ya están creados en granalier.com.ar,
 * así que en producción esta clase no hace nada salvo servir de red
 * de seguridad si el plugin se instala en un sitio nuevo).
 */
class GP_Post_Types {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'registrar' ), 5 );
	}

	public static function activate() {
		$instance = self::instance();
		$instance->registrar();
		flush_rewrite_rules();
	}

	public function registrar() {
		if ( ! post_type_exists( 'producto' ) ) {
			register_post_type(
				'producto',
				array(
					'label'        => __( 'Productos', 'granalier-productos' ),
					'labels'       => array(
						'name'          => __( 'Productos', 'granalier-productos' ),
						'singular_name' => __( 'Producto', 'granalier-productos' ),
						'add_new_item'  => __( 'Agregar producto', 'granalier-productos' ),
						'edit_item'     => __( 'Editar producto', 'granalier-productos' ),
					),
					'public'       => true,
					'has_archive'  => true,
					'show_in_rest' => true,
					'menu_icon'    => 'dashicons-carrot',
					'rewrite'      => array( 'slug' => 'producto' ),
					'supports'     => array( 'title', 'thumbnail', 'excerpt' ),
				)
			);
		}

		if ( ! taxonomy_exists( 'cat-prod' ) ) {
			register_taxonomy(
				'cat-prod',
				'producto',
				array(
					'label'        => __( 'Categoría', 'granalier-productos' ),
					'hierarchical' => true,
					'public'       => true,
					'show_in_rest' => true,
					'rewrite'      => array( 'slug' => 'cat-prod' ),
				)
			);
		}
	}
}
