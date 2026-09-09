<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Pantalla mínima de ajustes: número y mensaje de WhatsApp. Así, si el
 * formato del número no engancha bien con WhatsApp, se corrige acá
 * sin tocar código.
 */
class GP_Settings {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	const IMAGEN_DEFAULT = 'https://granalier.com.ar/wp-content/uploads/2023/01/img-chanchoHotSpot-blanco.png';

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'registrar_ajustes' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_assets' ) );
	}

	public static function imagen_chancho() {
		$imagen = get_option( 'gp_chancho_imagen', '' );
		return $imagen ? $imagen : self::IMAGEN_DEFAULT;
	}

	public function admin_assets( $hook ) {
		if ( 'settings_page_granalier-productos' !== $hook ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_script( 'granalier-productos-admin-settings', GP_PLUGIN_URL . 'assets/js/admin-settings.js', array(), gp_asset_version( 'assets/js/admin-settings.js' ), true );
	}

	public function menu() {
		add_options_page(
			__( 'Granalier Productos', 'granalier-productos' ),
			__( 'Granalier Productos', 'granalier-productos' ),
			'manage_options',
			'granalier-productos',
			array( $this, 'render' )
		);
	}

	public function registrar_ajustes() {
		register_setting( 'gp_ajustes', 'gp_whatsapp_numero', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'gp_ajustes', 'gp_whatsapp_mensaje', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'gp_ajustes', 'gp_chancho_imagen', array( 'sanitize_callback' => 'esc_url_raw' ) );
	}

	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Granalier Productos', 'granalier-productos' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'gp_ajustes' ); ?>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="gp_whatsapp_numero"><?php esc_html_e( 'Número de WhatsApp', 'granalier-productos' ); ?></label></th>
						<td>
							<input type="text" id="gp_whatsapp_numero" name="gp_whatsapp_numero" class="regular-text" value="<?php echo esc_attr( get_option( 'gp_whatsapp_numero', '543434706157' ) ); ?>" />
							<p class="description"><?php esc_html_e( 'Solo números, con código de país (ej: 5493434706157). Si el link de WhatsApp no abre el chat, probá agregando o quitando el 9 después del 54.', 'granalier-productos' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="gp_whatsapp_mensaje"><?php esc_html_e( 'Mensaje predefinido', 'granalier-productos' ); ?></label></th>
						<td>
							<input type="text" id="gp_whatsapp_mensaje" name="gp_whatsapp_mensaje" class="large-text" value="<?php echo esc_attr( get_option( 'gp_whatsapp_mensaje', 'Hola! Me interesa distribuir productos Granalier{producto}.' ) ); ?>" />
							<p class="description"><?php esc_html_e( 'Usá {producto} donde quieras que aparezca "(Nombre del producto)".', 'granalier-productos' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="gp_chancho_imagen"><?php esc_html_e( 'Imagen del chancho', 'granalier-productos' ); ?></label></th>
						<td>
							<input type="url" id="gp_chancho_imagen" name="gp_chancho_imagen" class="regular-text" value="<?php echo esc_attr( get_option( 'gp_chancho_imagen', '' ) ); ?>" placeholder="<?php echo esc_attr( self::IMAGEN_DEFAULT ); ?>" />
							<button type="button" class="button" id="gp-elegir-imagen"><?php esc_html_e( 'Elegir de la biblioteca', 'granalier-productos' ); ?></button>
							<p class="description"><?php esc_html_e( 'Por defecto usa el chancho blanco ya subido al sitio. Reemplazalo si suben una versión nueva.', 'granalier-productos' ); ?></p>
							<div id="gp-preview-imagen" style="margin-top:0.75rem;max-width:320px;">
								<?php $preview = get_option( 'gp_chancho_imagen', '' ) ? get_option( 'gp_chancho_imagen' ) : self::IMAGEN_DEFAULT; ?>
								<img src="<?php echo esc_url( $preview ); ?>" style="max-width:100%;background:#5c1414;padding:1rem;border-radius:8px;" />
							</div>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Shortcodes disponibles', 'granalier-productos' ); ?></h2>
			<ul style="list-style:disc;padding-left:1.5em;">
				<li><code>[granalier_productos_archivo]</code> — <?php esc_html_e( 'Listado completo con filtro de categorías en vivo.', 'granalier-productos' ); ?></li>
				<li><code>[granalier_productos_destacados cantidad="6" categoria=""]</code> — <?php esc_html_e( 'Grilla de destacados para el home, sin fondo.', 'granalier-productos' ); ?></li>
				<li><code>[granalier_chancho]</code> — <?php esc_html_e( 'Diagrama interactivo del chancho.', 'granalier-productos' ); ?></li>
				<li><code>[granalier_producto id="123"]</code> — <?php esc_html_e( 'Ficha de un producto puntual, embebida (sin popup).', 'granalier-productos' ); ?></li>
			</ul>
			<p>
				<?php esc_html_e( 'Las zonas del diagrama del chancho se editan en', 'granalier-productos' ); ?>
				<a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=parte_cerdo&post_type=producto' ) ); ?>"><?php esc_html_e( 'Productos → Parte del cerdo', 'granalier-productos' ); ?></a>.
			</p>
		</div>
		<?php
	}
}
