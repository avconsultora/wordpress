<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Optimización de imágenes apoyada en WordPress, sin librerías extra.
 *
 * WordPress genera varios tamaños de cada imagen que se sube; el filtro
 * image_editor_output_format (core 5.8+) permite que esos tamaños se
 * escriban en WebP en vez de JPEG/PNG. Dos límites que conviene tener
 * presentes:
 *
 * - Solo afecta a las imágenes que se suban de ahora en más. Las que ya
 *   están en la biblioteca necesitan regenerar miniaturas.
 * - El archivo original queda como se subió; lo que cambia son los
 *   tamaños derivados, que son los que el plugin muestra.
 */
class GP_Imagenes {

	const CALIDAD_DEFAULT = 82;

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_filter( 'image_editor_output_format', array( $this, 'formato_salida' ) );
		add_filter( 'wp_editor_set_quality', array( $this, 'calidad' ), 10, 2 );
	}

	/**
	 * ¿El servidor puede escribir WebP? Depende de Imagick o GD.
	 */
	public static function webp_disponible() {
		return wp_image_editor_supports( array( 'mime_type' => 'image/webp' ) );
	}

	public static function webp_activo() {
		return get_option( 'gp_webp' ) && self::webp_disponible();
	}

	public function formato_salida( $formatos ) {
		if ( ! self::webp_activo() ) {
			return $formatos;
		}
		$formatos['image/jpeg'] = 'image/webp';
		$formatos['image/png']  = 'image/webp';
		return $formatos;
	}

	public function calidad( $calidad, $mime = '' ) {
		$opcion = (int) get_option( 'gp_calidad', self::CALIDAD_DEFAULT );
		return ( $opcion >= 40 && $opcion <= 100 ) ? $opcion : $calidad;
	}
}
