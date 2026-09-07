( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		var boton = document.getElementById( 'gp-elegir-imagen' );
		if ( ! boton || typeof wp === 'undefined' || ! wp.media ) {
			return;
		}

		var campo   = document.getElementById( 'gp_chancho_imagen' );
		var preview = document.getElementById( 'gp-preview-imagen' );

		boton.addEventListener( 'click', function ( evento ) {
			evento.preventDefault();
			var frame = wp.media( { title: 'Elegir imagen del chancho', multiple: false } );
			frame.on( 'select', function () {
				var adjunto = frame.state().get( 'selection' ).first().toJSON();
				campo.value = adjunto.url;
				preview.innerHTML = '<img src="' + adjunto.url + '" style="max-width:100%;background:#5c1414;padding:1rem;border-radius:8px;" />';
			} );
			frame.open();
		} );
	} );
} )();
