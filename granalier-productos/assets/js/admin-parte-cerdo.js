( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		var wrap = document.querySelector( '[data-gp-ubicador]' );
		if ( ! wrap ) {
			return;
		}

		var lienzo = wrap.querySelector( '.gp-ubicador__lienzo' );
		var punto  = wrap.querySelector( '[data-gp-punto]' );
		var campoX = wrap.querySelector( '[data-gp-x]' );
		var campoY = wrap.querySelector( '[data-gp-y]' );

		function ubicar( x, y ) {
			x = Math.max( 0, Math.min( 100, x ) );
			y = Math.max( 0, Math.min( 100, y ) );
			punto.style.left = x + '%';
			punto.style.top  = y + '%';
			punto.style.display = 'block';
			campoX.value = x.toFixed( 1 );
			campoY.value = y.toFixed( 1 );
		}

		lienzo.addEventListener( 'click', function ( evento ) {
			var rect = lienzo.getBoundingClientRect();
			var x = ( ( evento.clientX - rect.left ) / rect.width ) * 100;
			var y = ( ( evento.clientY - rect.top ) / rect.height ) * 100;
			ubicar( x, y );
		} );

		[ campoX, campoY ].forEach( function ( input ) {
			input.addEventListener( 'input', function () {
				var x = parseFloat( campoX.value ) || 0;
				var y = parseFloat( campoY.value ) || 0;
				punto.style.left = x + '%';
				punto.style.top  = y + '%';
				punto.style.display = 'block';
			} );
		} );
	} );
} )();
