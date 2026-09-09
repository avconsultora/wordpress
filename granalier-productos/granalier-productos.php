<?php
/**
 * Plugin Name: Granalier Productos
 * Description: CPT Productos (fotos, presentacion, tips de consumo), diagrama interactivo del chancho y shortcodes de archivo, destacados, chanchito y ficha de producto en popup, con CTA a WhatsApp.
 * Version: 1.1.0
 * Author: AV Consultora
 * Text Domain: granalier-productos
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GP_PLUGIN_FILE', __FILE__ );
define( 'GP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'GP_VERSION', '1.1.0' );

require_once GP_PLUGIN_DIR . 'includes/helpers.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-post-types.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-parte-cerdo.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-fields.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-assets.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-shortcodes.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-template.php';
require_once GP_PLUGIN_DIR . 'includes/class-gp-settings.php';

register_activation_hook( __FILE__, array( 'GP_Post_Types', 'activate' ) );
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

GP_Post_Types::instance();
GP_Parte_Cerdo::instance();
GP_Fields::instance();
GP_Assets::instance();
GP_Shortcodes::instance();
GP_Template::instance();
GP_Settings::instance();
