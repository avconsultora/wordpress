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
		// Prioridad tardía a propósito: así el CSS del plugin se imprime
		// después del de Elementor y el theme, y gana los empates de
		// especificidad en vez de perderlos por orden de carga.
		add_action( 'wp_enqueue_scripts', array( $this, 'registrar' ), 999 );
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
		self::encolar();
	}

	public static function encolar() {
		if ( self::$usado ) {
			return;
		}
		self::$usado = true;

		$css = 'assets/css/granalier-productos.css';
		$js  = 'assets/js/granalier-productos.js';

		wp_enqueue_style( 'granalier-productos', GP_PLUGIN_URL . $css, array(), gp_asset_version( $css ) );
		wp_enqueue_script( 'granalier-productos', GP_PLUGIN_URL . $js, array(), gp_asset_version( $js ), true );
	}
}
