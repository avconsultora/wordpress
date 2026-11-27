( function () {
	'use strict';

	var abrirModalGlobal = function () {};

	function init() {
		prepararContenedores();
		iniciarFiltros();
		iniciarModal();
		iniciarChancho();
	}

	function prepararContenedores() {
		var raices = document.querySelectorAll( '.gp-hero, .gp-catalogo-wrap, .gp-seccion-partes' );
		if ( ! raices.length ) {
			return;
		}
		if ( document.querySelector( '.gp-catalogo-wrap, .gp-hero' ) ) {
			document.body.classList.add( 'gp-pagina-archivo' );
		}
		raices.forEach( function ( el ) {
			var nodo = el.parentElement;
			while ( nodo && nodo !== document.body ) {
				if (
					nodo.classList.contains( 'e-con' ) ||
					nodo.classList.contains( 'e-con-inner' ) ||
					nodo.classList.contains( 'elementor-widget' ) ||
					nodo.classList.contains( 'elementor-widget-container' )
				) {
					nodo.classList.add( 'gp-e-con-limpio' );
				}
				nodo = nodo.parentElement;
			}
		} );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

	/* ---------------- Archivo: filtros y chancho interactivo ---------------- */

	function iniciarFiltros() {
		document.querySelectorAll( '.gp-archivo' ).forEach( iniciarArchivo );
	}

	function iniciarArchivo( archivo ) {
		var grid = archivo.querySelector( '[data-gp-grid]' );
		if ( ! grid ) {
			return;
		}

		var botones       = archivo.querySelectorAll( '.gp-filtro' );
		var tarjetas      = grid.querySelectorAll( '.gp-card' );
		var chip          = archivo.querySelector( '[data-gp-chip]' );
		var chipNombre    = archivo.querySelector( '[data-gp-chip-nombre]' );
		var sinResultados = archivo.querySelector( '[data-gp-sin-resultados]' );
		var panel         = archivo.querySelector( '[data-gp-panel-chancho]' );
		var chancho       = archivo.querySelector( '[data-gp-modo="filtro"]' );

		var estado = { categoria: 'todos', parte: null };

		function partesDe( tarjeta ) {
			return ( tarjeta.getAttribute( 'data-partes' ) || '' )
				.toLowerCase()
				.split( /\s+/ )
				.filter( Boolean );
		}

		function aplicar() {
			var visibles = 0;

			tarjetas.forEach( function ( tarjeta ) {
				var cats   = ( tarjeta.getAttribute( 'data-cats' ) || '' ).toLowerCase().split( /\s+/ );
				var partes = partesDe( tarjeta );

				var okCat = 'todos' === estado.categoria || cats.indexOf( estado.categoria.toLowerCase() ) !== -1;
				var okPar = ! estado.parte || partes.indexOf( estado.parte.toLowerCase() ) !== -1;
				var visible = okCat && okPar;

				tarjeta.classList.toggle( 'gp-oculto', ! visible );
				if ( visible ) {
					visibles++;
				}
			} );

			if ( chip ) {
				chip.hidden = ! estado.parte;
				if ( estado.parte ) {
					chip.removeAttribute( 'hidden' );
				} else {
					chip.setAttribute( 'hidden', '' );
				}
			}

			if ( sinResultados ) {
				sinResultados.hidden = visibles > 0;
			}

			if ( chancho ) {
				chancho.querySelectorAll( '.gp-hotspot, .gp-parte-chip' ).forEach( function ( el ) {
					var slug = ( el.getAttribute( 'data-parte' ) || '' ).toLowerCase();
					el.classList.toggle( 'is-activo', !! estado.parte && slug === estado.parte.toLowerCase() );
				} );
			}
		}

		function elegirParte( slug, nombre ) {
			if ( ! slug ) {
				return;
			}
			var normalizado = slug.toLowerCase().trim();
			estado.parte = ( estado.parte === normalizado ) ? null : normalizado;

			if ( estado.parte && chipNombre ) {
				chipNombre.textContent = nombre || slug;
			}

			limpiarResaltado();
			aplicar();
			cerrarPanel();
		}

		botones.forEach( function ( boton ) {
			boton.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				botones.forEach( function ( b ) {
					b.classList.remove( 'is-activo' );
				} );
				boton.classList.add( 'is-activo' );
				estado.categoria = boton.getAttribute( 'data-gp-filtro' ) || 'todos';
				aplicar();
			} );
		} );

		var limpiar = archivo.querySelector( '[data-gp-chip-limpiar]' );
		if ( limpiar ) {
			limpiar.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				estado.parte = null;
				limpiarResaltado();
				aplicar();
			} );
		}

		/* ---- Resaltado cruzado tarjeta <-> punto del chancho ---- */

		function limpiarResaltado() {
			tarjetas.forEach( function ( t ) {
				t.classList.remove( 'gp-resaltado', 'gp-atenuado' );
			} );
			if ( chancho ) {
				chancho.querySelectorAll( '.gp-hotspot' ).forEach( function ( h ) {
					var slug = ( h.getAttribute( 'data-parte' ) || '' ).toLowerCase();
					if ( ! estado.parte || slug !== estado.parte.toLowerCase() ) {
						h.classList.remove( 'is-activo' );
					}
				} );
			}
		}

		if ( ! chancho ) {
			aplicar();
			return;
		}

		var etiqueta = chancho.querySelector( '[data-gp-etiqueta]' );
		var hotspots = chancho.querySelectorAll( '.gp-hotspot' );

		// Pasar el mouse por una tarjeta resalta los hotspots de sus cortes
		tarjetas.forEach( function ( tarjeta ) {
			function prender() {
				var partes = partesDe( tarjeta );
				hotspots.forEach( function ( h ) {
					var slug = ( h.getAttribute( 'data-parte' ) || '' ).toLowerCase();
					if ( partes.indexOf( slug ) !== -1 ) {
						h.classList.add( 'is-activo' );
					}
				} );
			}
			tarjeta.addEventListener( 'mouseenter', prender );
			tarjeta.addEventListener( 'focus', prender );
			tarjeta.addEventListener( 'mouseleave', limpiarResaltado );
			tarjeta.addEventListener( 'blur', limpiarResaltado );
		} );

		// Pasar el mouse por un punto resalta sus productos en la grilla y muestra la etiqueta
		hotspots.forEach( function ( hotspot ) {
			function resaltar() {
				var slug = ( hotspot.getAttribute( 'data-parte' ) || '' ).toLowerCase();
				if ( ! slug ) {
					return;
				}

				// Verificar si existe al menos un producto visible que coincida
				var hayCoincidencia = false;
				tarjetas.forEach( function ( t ) {
					if ( ! t.classList.contains( 'gp-oculto' ) && partesDe( t ).indexOf( slug ) !== -1 ) {
						hayCoincidencia = true;
					}
				} );

				// Si el corte no tiene productos en la vista actual, no alterar opacidades de la grilla
				if ( ! hayCoincidencia ) {
					limpiarResaltado();
					return;
				}

				tarjetas.forEach( function ( t ) {
					if ( t.classList.contains( 'gp-oculto' ) ) {
						return;
					}
					var coincide = partesDe( t ).indexOf( slug ) !== -1;
					t.classList.toggle( 'gp-resaltado', coincide );
					t.classList.toggle( 'gp-atenuado', ! coincide );
				} );

				if ( etiqueta ) {
					var nombre = hotspot.getAttribute( 'data-nombre' ) || slug;
					etiqueta.textContent = nombre.toUpperCase();
					etiqueta.removeAttribute( 'hidden' );
					etiqueta.style.display = 'block';
					etiqueta.style.left = hotspot.style.left;
					etiqueta.style.top = hotspot.style.top;
				}
			}

			function apagar() {
				limpiarResaltado();
				if ( etiqueta ) {
					etiqueta.setAttribute( 'hidden', '' );
					etiqueta.style.display = 'none';
				}
			}

			hotspot.addEventListener( 'mouseenter', resaltar );
			hotspot.addEventListener( 'focus', resaltar );
			hotspot.addEventListener( 'mouseleave', apagar );
			hotspot.addEventListener( 'blur', apagar );

			hotspot.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				elegirParte( hotspot.getAttribute( 'data-parte' ), hotspot.getAttribute( 'data-nombre' ) );
			} );
		} );

		chancho.querySelectorAll( '.gp-parte-chip' ).forEach( function ( boton ) {
			boton.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				elegirParte( boton.getAttribute( 'data-parte' ), boton.getAttribute( 'data-nombre' ) );
			} );
		} );

		/* ---- Panel del chancho en mobile ---- */

		var abrir  = archivo.querySelector( '[data-gp-panel-abrir]' );
		var cerrar = archivo.querySelector( '[data-gp-panel-cerrar]' );

		function cerrarPanel() {
			if ( ! panel ) {
				return;
			}
			panel.classList.remove( 'is-abierto' );
			if ( abrir ) {
				abrir.setAttribute( 'aria-expanded', 'false' );
			}
		}

		if ( abrir && panel ) {
			abrir.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				var abierto = panel.classList.toggle( 'is-abierto' );
				abrir.setAttribute( 'aria-expanded', abierto ? 'true' : 'false' );
			} );

			// Botón flotante visible solo mientras el catálogo está en viewport
			if ( 'IntersectionObserver' in window ) {
				new IntersectionObserver( function ( entradas ) {
					var enPantalla = entradas[ 0 ].isIntersecting;
					abrir.classList.toggle( 'is-visible', enPantalla );
					if ( ! enPantalla ) {
						cerrarPanel();
					}
				} ).observe( archivo );
			} else {
				abrir.classList.add( 'is-visible' );
			}
		}

		if ( cerrar ) {
			cerrar.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				cerrarPanel();
			} );
		}

		if ( panel ) {
			panel.addEventListener( 'click', function ( evento ) {
				if ( ! evento.target.closest( '.gp-panel' ) ) {
					cerrarPanel();
				}
			} );
		}

		document.addEventListener( 'keydown', function ( evento ) {
			if ( 'Escape' === evento.key ) {
				cerrarPanel();
			}
		} );

		aplicar();
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
				evento.preventDefault();
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

	/* ---------------- Diagrama del chancho (Modo Popup) ---------------- */

	function iniciarChancho() {
		document.querySelectorAll( '[data-gp-chancho][data-gp-modo="popup"]' ).forEach( function ( contenedor ) {
			var popover  = contenedor.querySelector( '[data-gp-popover-render]' );
			var hotspots = contenedor.querySelectorAll( '.gp-hotspot' );
			var activo   = null;

			if ( ! popover ) {
				return;
			}

			function posicionar( hotspot ) {
				var rectHotspot = hotspot.getBoundingClientRect();
				var rectBase    = contenedor.getBoundingClientRect();
				var margen      = 8;

				var haciaAbajo = ( rectHotspot.top - popover.offsetHeight - 20 ) < rectBase.top;
				popover.classList.toggle( 'gp-popover--abajo', haciaAbajo );
				popover.style.top = ( rectHotspot.top - rectBase.top + ( haciaAbajo ? rectHotspot.height : 0 ) ) + 'px';

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
					evento.preventDefault();
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
