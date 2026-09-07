<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GP_Assets {

	private static $instance = null;
	public static $usado = false;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'registrar' ) );
	}

	/**
	 * Se encolan siempre en el frontend (son ~4kb en total) para que
	 * los shortcodes funcionen sin importar si se insertan por
	 * Elementor, un widget o un template, casos en los que detectar
	 * el shortcode en post_content de antemano no es confiable.
	 */
	public function registrar() {
		if ( is_admin() ) {
			return;
		}
		wp_enqueue_style( 'granalier-productos', GP_PLUGIN_URL . 'assets/css/granalier-productos.css', array(), GP_VERSION );
		wp_enqueue_script( 'granalier-productos', GP_PLUGIN_URL . 'assets/js/granalier-productos.js', array(), GP_VERSION, true );
	}

	public static function encolar() {
		if ( self::$usado ) {
			return;
		}
		self::$usado = true;
		wp_enqueue_style( 'granalier-productos', GP_PLUGIN_URL . 'assets/css/granalier-productos.css', array(), GP_VERSION );
		wp_enqueue_script( 'granalier-productos', GP_PLUGIN_URL . 'assets/js/granalier-productos.js', array(), GP_VERSION, true );
	}
}
