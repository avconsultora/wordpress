<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cuando alguien entra directo a la URL de un producto (ej. compartido
 * por WhatsApp o indexado en Google), se muestra una versión simple de
 * la ficha dentro del theme (header/footer de Hello Elementor), en vez
 * del single por defecto.
 */
class GP_Template {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_filter( 'template_include', array( $this, 'template_single' ) );
	}

	public function template_single( $template ) {
		if ( is_singular( 'producto' ) ) {
			GP_Assets::encolar();
			$custom = GP_PLUGIN_DIR . 'templates/single-producto.php';
			if ( file_exists( $custom ) ) {
				return $custom;
			}
		}
		return $template;
	}
}
