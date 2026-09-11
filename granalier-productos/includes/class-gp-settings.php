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

		register_setting(
			'gp_ajustes_img',
			'gp_webp',
			array(
				'sanitize_callback' => function ( $valor ) {
					return $valor ? '1' : '';
				},
			)
		);
		register_setting(
			'gp_ajustes_img',
			'gp_calidad',
			array(
				'sanitize_callback' => function ( $valor ) {
					$valor = (int) $valor;
					return ( $valor >= 40 && $valor <= 100 ) ? $valor : GP_Imagenes::CALIDAD_DEFAULT;
				},
			)
		);
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
			<h2><?php esc_html_e( 'Imágenes', 'granalier-productos' ); ?></h2>
			<form method="post" action="options.php">
				<?php settings_fields( 'gp_ajustes_img' ); ?>
				<table class="form-table">
					<tr>
						<th scope="row"><?php esc_html_e( 'Convertir a WebP', 'granalier-productos' ); ?></th>
						<td>
							<?php if ( GP_Imagenes::webp_disponible() ) : ?>
								<label>
									<input type="checkbox" name="gp_webp" value="1" <?php checked( get_option( 'gp_webp' ), '1' ); ?> />
									<?php esc_html_e( 'Generar en WebP los tamaños de las imágenes que se suban', 'granalier-productos' ); ?>
								</label>
								<p class="description">
									<?php esc_html_e( 'Solo afecta a las imágenes nuevas: las que ya están cargadas siguen igual hasta que se regeneren las miniaturas. El archivo original queda como se subió.', 'granalier-productos' ); ?>
								</p>
							<?php else : ?>
								<p class="description">
									<?php esc_html_e( 'Este servidor no puede escribir WebP (ni Imagick ni GD lo soportan), así que la conversión no está disponible. Se pueden subir las imágenes ya convertidas.', 'granalier-productos' ); ?>
								</p>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="gp_calidad"><?php esc_html_e( 'Calidad de compresión', 'granalier-productos' ); ?></label></th>
						<td>
							<input type="number" id="gp_calidad" name="gp_calidad" min="40" max="100" value="<?php echo esc_attr( get_option( 'gp_calidad', GP_Imagenes::CALIDAD_DEFAULT ) ); ?>" class="small-text" />
							<p class="description"><?php esc_html_e( 'Entre 40 y 100. WordPress usa 82 por defecto; bajar a 70-75 suele achicar bastante sin que se note.', 'granalier-productos' ); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Estado del diagrama', 'granalier-productos' ); ?></h2>
			<?php
			$terminos  = get_terms(
				array(
					'taxonomy'   => GP_Parte_Cerdo::TAXONOMY,
					'hide_empty' => false,
				)
			);
			$total     = is_wp_error( $terminos ) ? 0 : count( $terminos );
			$ubicados  = count( GP_Parte_Cerdo::obtener_partes() );
			$con_corte = gp_productos_con_corte();
			$productos = (int) wp_count_posts( 'producto' )->publish;
			?>
			<table class="widefat" style="max-width:640px;">
				<tbody>
					<tr>
						<td><?php echo $ubicados ? '✅' : '⚠️'; ?></td>
						<td><?php esc_html_e( 'Cortes con su punto ubicado en el diagrama', 'granalier-productos' ); ?></td>
						<td><strong><?php echo esc_html( $ubicados . ' / ' . $total ); ?></strong></td>
						<td><a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=parte_cerdo&post_type=producto' ) ); ?>"><?php esc_html_e( 'Ubicar', 'granalier-productos' ); ?></a></td>
					</tr>
					<tr>
						<td><?php echo $con_corte ? '✅' : '⚠️'; ?></td>
						<td><?php esc_html_e( 'Productos con su parte del cerdo asignada', 'granalier-productos' ); ?></td>
						<td><strong><?php echo esc_html( $con_corte . ' / ' . $productos ); ?></strong></td>
						<td><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=producto' ) ); ?>"><?php esc_html_e( 'Asignar', 'granalier-productos' ); ?></a></td>
					</tr>
				</tbody>
			</table>
			<p class="description">
				<?php esc_html_e( 'Sin cortes ubicados el diagrama no aparece en el archivo ni en el home. Sin productos asignados aparece, pero no filtra nada.', 'granalier-productos' ); ?>
			</p>

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
