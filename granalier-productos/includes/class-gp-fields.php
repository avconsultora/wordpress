<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Campos propios del plugin en el producto:
 * - tips_consumo (Fase 2, MVP de "recetas / formas de cocción")
 * - gp_destacado (checkbox para elegir qué sale en el home)
 *
 * El campo "presentacion" ya existe como campo de ACF en el sitio y
 * no se toca acá, solo se lee (ver gp_field() en helpers.php).
 *
 * Si ACF está activo se agrega un grupo de campos local (no hace
 * falta tocar nada en el admin de ACF). Si no está activo, se usa
 * un metabox nativo de WordPress como respaldo.
 */
class GP_Fields {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		if ( function_exists( 'acf_add_local_field_group' ) ) {
			add_action( 'acf/init', array( $this, 'registrar_acf' ) );
		} else {
			add_action( 'add_meta_boxes', array( $this, 'registrar_metabox' ) );
			add_action( 'save_post_producto', array( $this, 'guardar_metabox' ) );
		}
	}

	public function registrar_acf() {
		acf_add_local_field_group(
			array(
				'key'      => 'group_gp_producto',
				'title'    => __( 'Granalier - Datos adicionales', 'granalier-productos' ),
				'fields'   => array(
					array(
						'key'   => 'field_gp_tips_consumo',
						'label' => __( 'Tip de consumo', 'granalier-productos' ),
						'name'  => 'tips_consumo',
						'type'  => 'textarea',
						'rows'  => 3,
						'instructions' => __( 'Un tip corto de cómo consumir o cocinar el producto.', 'granalier-productos' ),
					),
					array(
						'key'   => 'field_gp_destacado',
						'label' => __( 'Destacado en home', 'granalier-productos' ),
						'name'  => 'gp_destacado',
						'type'  => 'true_false',
						'ui'    => 1,
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => 'producto',
						),
					),
				),
			)
		);
	}

	public function registrar_metabox() {
		add_meta_box(
			'gp_datos_adicionales',
			__( 'Granalier - Datos adicionales', 'granalier-productos' ),
			array( $this, 'render_metabox' ),
			'producto',
			'normal',
			'default'
		);
	}

	public function render_metabox( $post ) {
		wp_nonce_field( 'gp_guardar_producto', 'gp_producto_nonce' );
		$tips      = get_post_meta( $post->ID, 'tips_consumo', true );
		$destacado = get_post_meta( $post->ID, 'gp_destacado', true );
		?>
		<p>
			<label for="gp_tips_consumo"><strong><?php esc_html_e( 'Tip de consumo', 'granalier-productos' ); ?></strong></label><br />
			<textarea name="gp_tips_consumo" id="gp_tips_consumo" rows="3" style="width:100%;"><?php echo esc_textarea( $tips ); ?></textarea>
		</p>
		<p>
			<label>
				<input type="checkbox" name="gp_destacado" value="1" <?php checked( $destacado, '1' ); ?> />
				<?php esc_html_e( 'Destacado en home', 'granalier-productos' ); ?>
			</label>
		</p>
		<?php
	}

	public function guardar_metabox( $post_id ) {
		if ( ! isset( $_POST['gp_producto_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['gp_producto_nonce'] ) ), 'gp_guardar_producto' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		if ( isset( $_POST['gp_tips_consumo'] ) ) {
			update_post_meta( $post_id, 'tips_consumo', sanitize_textarea_field( wp_unslash( $_POST['gp_tips_consumo'] ) ) );
		}
		update_post_meta( $post_id, 'gp_destacado', isset( $_POST['gp_destacado'] ) ? '1' : '' );
	}
}
