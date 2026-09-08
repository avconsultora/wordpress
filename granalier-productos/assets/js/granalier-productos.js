( function () {
	'use strict';

	var abrirModalGlobal = function () {};

	document.addEventListener( 'DOMContentLoaded', function () {
		iniciarFiltros();
		iniciarModal();
		iniciarChancho();
	} );

	/* ---------------- Filtros del archivo ---------------- */

	function iniciarFiltros() {
		document.querySelectorAll( '.gp-archivo' ).forEach( function ( archivo ) {
			var botones = archivo.querySelectorAll( '.gp-filtro' );
			var grid    = archivo.querySelector( '[data-gp-grid]' );
			if ( ! grid ) {
				return;
			}
			var tarjetas = grid.querySelectorAll( '.gp-card' );

			botones.forEach( function ( boton ) {
				boton.addEventListener( 'click', function () {
					botones.forEach( function ( b ) {
						b.classList.remove( 'is-activo' );
					} );
					boton.classList.add( 'is-activo' );

					var filtro = boton.getAttribute( 'data-gp-filtro' );
					tarjetas.forEach( function ( tarjeta ) {
						var cats = ( tarjeta.getAttribute( 'data-cats' ) || '' ).split( ' ' );
						var visible = 'todos' === filtro || cats.indexOf( filtro ) !== -1;
						tarjeta.classList.toggle( 'gp-oculto', ! visible );
					} );
				} );
			} );
		} );
	}

	/* ---------------- Modal de producto ---------------- */

	function iniciarModal() {
		var modal = document.getElementById( 'gp-modal' );
		if ( ! modal ) {
			return;
		}
		var cuerpo = modal.querySelector( '.gp-modal__body' );

		document.addEventListener( 'click', function ( evento ) {
			var disparador = evento.target.closest( '[data-gp-open]' );
			if ( disparador ) {
				evento.preventDefault();
				abrirModal( disparador.getAttribute( 'data-gp-open' ) );
				return;
			}
			if ( evento.target.closest( '[data-gp-close]' ) ) {
				cerrarModal();
			}
		} );

		document.addEventListener( 'keydown', function ( evento ) {
			if ( 'Escape' === evento.key && ! modal.hasAttribute( 'hidden' ) ) {
				cerrarModal();
			}
		} );

		function abrirModal( id ) {
			var plantilla = document.getElementById( 'gp-tpl-' + id );
			if ( ! plantilla ) {
				return;
			}
			cuerpo.innerHTML = '';
			cuerpo.appendChild( plantilla.content.cloneNode( true ) );
			modal.removeAttribute( 'hidden' );
			modal.setAttribute( 'aria-hidden', 'false' );
			document.body.classList.add( 'gp-modal-abierto' );
			var cerrar = modal.querySelector( '.gp-modal__cerrar' );
			if ( cerrar ) {
				cerrar.focus();
			}
		}

		function cerrarModal() {
			modal.setAttribute( 'hidden', '' );
			modal.setAttribute( 'aria-hidden', 'true' );
			document.body.classList.remove( 'gp-modal-abierto' );
			cuerpo.innerHTML = '';
		}

		abrirModalGlobal = abrirModal;
	}

	/* ---------------- Diagrama del chancho ---------------- */

	function iniciarChancho() {
		document.querySelectorAll( '[data-gp-chancho]' ).forEach( function ( contenedor ) {
			var popover = contenedor.querySelector( '[data-gp-popover-render]' );
			var hotspots = contenedor.querySelectorAll( '.gp-hotspot' );
			var activo = null;

			function posicionar( hotspot ) {
				var rectHotspot = hotspot.getBoundingClientRect();
				var rectBase    = contenedor.getBoundingClientRect();
				var margen      = 8;

				// Se abre hacia abajo si contra el borde de arriba no entra.
				var haciaAbajo = ( rectHotspot.top - popover.offsetHeight - 20 ) < rectBase.top;
				popover.classList.toggle( 'gp-popover--abajo', haciaAbajo );
				popover.style.top = ( rectHotspot.top - rectBase.top + ( haciaAbajo ? rectHotspot.height : 0 ) ) + 'px';

				// Centrado en el punto, pero sin salirse del contenedor:
				// lo que se corrige de más se le descuenta a la flecha.
				var mitad  = popover.offsetWidth / 2;
				var centro = rectHotspot.left - rectBase.left + rectHotspot.width / 2;
				var minimo = mitad + margen;
				var maximo = rectBase.width - mitad - margen;
				var x      = ( maximo < minimo ) ? rectBase.width / 2 : Math.max( minimo, Math.min( maximo, centro ) );

				popover.style.left = x + 'px';
				popover.style.setProperty( '--gp-flecha', ( centro - x ) + 'px' );
			}

			function mostrar( hotspot ) {
				var slug = hotspot.getAttribute( 'data-parte' );
				var plantilla = contenedor.querySelector( '[data-gp-popover="' + slug + '"]' );
				if ( ! plantilla ) {
					return;
				}
				popover.innerHTML = '';
				popover.appendChild( plantilla.content.cloneNode( true ) );
				popover.removeAttribute( 'hidden' );
				posicionar( hotspot );
				hotspots.forEach( function ( h ) {
					h.classList.toggle( 'is-activo', h === hotspot );
				} );
				activo = hotspot;
			}

			function ocultar() {
				popover.setAttribute( 'hidden', '' );
				hotspots.forEach( function ( h ) {
					h.classList.remove( 'is-activo' );
				} );
				activo = null;
			}

			hotspots.forEach( function ( hotspot ) {
				hotspot.addEventListener( 'mouseenter', function () {
					mostrar( hotspot );
				} );
				hotspot.addEventListener( 'focus', function () {
					mostrar( hotspot );
				} );
				hotspot.addEventListener( 'click', function ( evento ) {
					evento.stopPropagation();
					var soloId = hotspot.getAttribute( 'data-gp-solo' );
					if ( soloId ) {
						ocultar();
						abrirModalGlobal( soloId );
						return;
					}
					if ( activo === hotspot ) {
						ocultar();
					} else {
						mostrar( hotspot );
					}
				} );
			} );

			contenedor.addEventListener( 'mouseleave', ocultar );

			popover.addEventListener( 'mouseleave', ocultar );

			popover.addEventListener( 'click', function ( evento ) {
				if ( evento.target.closest( '[data-gp-open]' ) ) {
					ocultar();
				}
			} );

			document.addEventListener( 'click', function ( evento ) {
				if ( activo && ! contenedor.contains( evento.target ) ) {
					ocultar();
				}
			} );

			document.addEventListener( 'keydown', function ( evento ) {
				if ( 'Escape' === evento.key && activo ) {
					ocultar();
				}
			} );

			window.addEventListener( 'scroll', function () {
				if ( activo ) {
					posicionar( activo );
				}
			}, { passive: true } );
		} );
	}
} )();
