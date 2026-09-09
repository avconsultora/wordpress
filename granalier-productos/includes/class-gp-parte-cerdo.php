<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomía "Parte del cerdo": une cada producto con un punto del
 * diagrama del chancho. Cada término guarda su posición (x/y en %
 * sobre la imagen) como term meta, editable desde Productos > Parte
 * del cerdo con un selector visual: se hace clic sobre la imagen del
 * chancho y listo, sin tocar código ni coordenadas a mano.
 */
class GP_Parte_Cerdo {

	const TAXONOMY = 'parte_cerdo';

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'registrar_taxonomia' ), 5 );
		add_action( 'init', array( $this, 'crear_terminos_por_defecto' ), 20 );

		add_action( self::TAXONOMY . '_add_form_fields', array( $this, 'campo_alta' ) );
		add_action( self::TAXONOMY . '_edit_form_fields', array( $this, 'campo_edicion' ) );
		add_action( 'created_' . self::TAXONOMY, array( $this, 'guardar_meta' ) );
		add_action( 'edited_' . self::TAXONOMY, array( $this, 'guardar_meta' ) );

		add_filter( 'manage_edit-' . self::TAXONOMY . '_columns', array( $this, 'columnas' ) );
		add_filter( 'manage_' . self::TAXONOMY . '_custom_column', array( $this, 'columna_contenido' ), 10, 3 );

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_assets' ) );
	}

	public function registrar_taxonomia() {
		if ( taxonomy_exists( self::TAXONOMY ) ) {
			return;
		}

		register_taxonomy(
			self::TAXONOMY,
			'producto',
			array(
				'label'             => __( 'Parte del cerdo', 'granalier-productos' ),
				'labels'            => array(
					'name'          => __( 'Partes del cerdo', 'granalier-productos' ),
					'singular_name' => __( 'Parte del cerdo', 'granalier-productos' ),
					'add_new_item'  => __( 'Agregar parte', 'granalier-productos' ),
				),
				'hierarchical'      => false,
				'public'            => false,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'rewrite'           => false,
			)
		);
	}

	/**
	 * Cortes sugeridos para arrancar (sin posición todavía: se ubican
	 * con un clic sobre la imagen en Productos > Parte del cerdo).
	 */
	public function partes_por_defecto() {
		return array(
			'cabeza'     => __( 'Cabeza', 'granalier-productos' ),
			'papada'     => __( 'Papada', 'granalier-productos' ),
			'bondiola'   => __( 'Bondiola', 'granalier-productos' ),
			'paleta'     => __( 'Paleta', 'granalier-productos' ),
			'carre'      => __( 'Carré', 'granalier-productos' ),
			'lomo'       => __( 'Lomo', 'granalier-productos' ),
			'costillar'  => __( 'Costillar', 'granalier-productos' ),
			'panceta'    => __( 'Panceta', 'granalier-productos' ),
			'matambre'   => __( 'Matambre', 'granalier-productos' ),
			'jamon'      => __( 'Jamón', 'granalier-productos' ),
			'pata'       => __( 'Pata / manitas', 'granalier-productos' ),
		);
	}

	public function crear_terminos_por_defecto() {
		if ( get_option( 'gp_partes_creadas' ) ) {
			return;
		}

		foreach ( $this->partes_por_defecto() as $slug => $nombre ) {
			if ( ! term_exists( $slug, self::TAXONOMY ) ) {
				wp_insert_term( $nombre, self::TAXONOMY, array( 'slug' => $slug ) );
			}
		}

		update_option( 'gp_partes_creadas', 1 );
	}

	public function admin_assets( $hook ) {
		global $taxnow, $pagenow;
		if ( self::TAXONOMY !== $taxnow ) {
			return;
		}
		if ( ! in_array( $pagenow, array( 'edit-tags.php', 'term.php' ), true ) ) {
			return;
		}
		wp_enqueue_style( 'granalier-productos-admin', GP_PLUGIN_URL . 'assets/css/admin.css', array(), gp_asset_version( 'assets/css/admin.css' ) );
		wp_enqueue_script( 'granalier-productos-admin', GP_PLUGIN_URL . 'assets/js/admin-parte-cerdo.js', array(), gp_asset_version( 'assets/js/admin-parte-cerdo.js' ), true );
	}

	private function ubicador_html( $x = '', $y = '' ) {
		?>
		<div class="gp-ubicador" data-gp-ubicador>
			<div class="gp-ubicador__lienzo">
				<img src="<?php echo esc_url( GP_Settings::imagen_chancho() ); ?>" alt="" />
				<span class="gp-ubicador__punto" data-gp-punto style="left:<?php echo esc_attr( $x ); ?>%;top:<?php echo esc_attr( $y ); ?>%;<?php echo ( '' === $x ) ? 'display:none;' : ''; ?>"></span>
			</div>
			<p class="description"><?php esc_html_e( 'Hacé clic sobre la imagen para ubicar el punto de esta parte.', 'granalier-productos' ); ?></p>
			<p>
				<label><?php esc_html_e( 'X %', 'granalier-productos' ); ?> <input type="number" step="0.1" min="0" max="100" name="gp_pos_x" data-gp-x value="<?php echo esc_attr( $x ); ?>" style="width:80px;" /></label>
				&nbsp;
				<label><?php esc_html_e( 'Y %', 'granalier-productos' ); ?> <input type="number" step="0.1" min="0" max="100" name="gp_pos_y" data-gp-y value="<?php echo esc_attr( $y ); ?>" style="width:80px;" /></label>
			</p>
		</div>
		<?php
	}

	public function campo_alta() {
		?>
		<div class="form-field">
			<label><?php esc_html_e( 'Ubicación en el diagrama', 'granalier-productos' ); ?></label>
			<?php $this->ubicador_html(); ?>
		</div>
		<?php
		wp_nonce_field( 'gp_guardar_parte', 'gp_parte_nonce' );
	}

	public function campo_edicion( $term ) {
		$x = get_term_meta( $term->term_id, 'gp_pos_x', true );
		$y = get_term_meta( $term->term_id, 'gp_pos_y', true );
		?>
		<tr class="form-field">
			<th scope="row"><label><?php esc_html_e( 'Ubicación en el diagrama', 'granalier-productos' ); ?></label></th>
			<td>
				<?php $this->ubicador_html( $x, $y ); ?>
				<?php wp_nonce_field( 'gp_guardar_parte', 'gp_parte_nonce' ); ?>
			</td>
		</tr>
		<?php
	}

	public function guardar_meta( $term_id ) {
		if ( ! isset( $_POST['gp_parte_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['gp_parte_nonce'] ) ), 'gp_guardar_parte' ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_categories' ) ) {
			return;
		}
		if ( isset( $_POST['gp_pos_x'] ) && '' !== $_POST['gp_pos_x'] ) {
			update_term_meta( $term_id, 'gp_pos_x', number_format( (float) $_POST['gp_pos_x'], 2, '.', '' ) );
		}
		if ( isset( $_POST['gp_pos_y'] ) && '' !== $_POST['gp_pos_y'] ) {
			update_term_meta( $term_id, 'gp_pos_y', number_format( (float) $_POST['gp_pos_y'], 2, '.', '' ) );
		}
	}

	public function columnas( $columns ) {
		$columns['gp_pos'] = __( 'Ubicado', 'granalier-productos' );
		return $columns;
	}

	public function columna_contenido( $content, $column_name, $term_id ) {
		if ( 'gp_pos' === $column_name ) {
			$x = get_term_meta( $term_id, 'gp_pos_x', true );
			$content = ( '' !== $x ) ? '✅' : '—';
		}
		return $content;
	}

	/**
	 * Todas las partes con posición cargada, para pintar el diagrama.
	 */
	public static function obtener_partes() {
		$terms  = get_terms(
			array(
				'taxonomy'   => self::TAXONOMY,
				'hide_empty' => false,
			)
		);
		$partes = array();

		if ( is_wp_error( $terms ) ) {
			return $partes;
		}

		foreach ( $terms as $term ) {
			$x = get_term_meta( $term->term_id, 'gp_pos_x', true );
			$y = get_term_meta( $term->term_id, 'gp_pos_y', true );
			if ( '' === $x || '' === $y ) {
				continue;
			}
			$partes[] = array(
				'slug'   => $term->slug,
				'nombre' => $term->name,
				'x'      => $x,
				'y'      => $y,
			);
		}

		return $partes;
	}
}
