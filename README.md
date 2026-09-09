# Granalier Productos

Plugin de WordPress para el CPT **Productos** de granalier.com.ar: archivo filtrable, destacados para el home, diagrama interactivo del chancho y ficha de producto en popup con CTA a WhatsApp.

## Instalación

1. Copiá la carpeta `granalier-productos/` a `wp-content/plugins/`.
2. Activá **Granalier Productos** desde Plugins.
3. (Recomendado) Tener **Advanced Custom Fields** activo — el plugin lo detecta solo. Si no está, usa un metabox nativo como respaldo para los campos propios.

El plugin **no** vuelve a crear el CPT `producto` ni la taxonomía `cat-prod` si ya existen en el sitio (como es el caso hoy); solo los registra como red de seguridad si se instala en un sitio nuevo.

## Campos del producto

- **Imagen destacada**, **Título**: los de siempre.
- **presentacion**: campo de ACF que ya existía, el plugin solo lo lee.
- **Tip de consumo** (`tips_consumo`): campo nuevo, opcional. Se muestra en la ficha del producto si tiene contenido.
- **Destacado en home**: checkbox nuevo para elegir qué productos salen en `[granalier_productos_destacados]`. Si ninguno está marcado, el shortcode muestra los últimos productos cargados.
- **Categoría** (`cat-prod`): ya existente (Embutidos / Cortes / Congelados), se usa para los filtros del archivo.
- **Parte del cerdo** (`parte_cerdo`): taxonomía nueva. Asignale a cada producto la parte del chancho de la que sale (podés marcar más de una), para que aparezca en el diagrama.

## El diagrama del chancho

Usa la imagen del chancho ya publicada en el sitio (`img-chanchoHotSpot-blanco.png`) en vez de redibujarla, para respetar el logo tal cual. Si se sube una versión nueva, cambiala en **Ajustes → Granalier Productos → Imagen del chancho**.

Los puntos ya no se cargan con el plugin "hotspot" anterior: se ubican desde **Productos → Parte del cerdo**. Al crear o editar una parte (ej. "Bondiola", "Jamón"), aparece la imagen del chancho: **hacé clic sobre el punto exacto** y las coordenadas se guardan solas (también se pueden ajustar a mano en los campos X% / Y% que aparecen debajo).

- Pasar el mouse sobre un punto muestra el/los producto(s) asociados a esa parte, con foto y nombre.
- Si hay un solo producto en esa parte, un clic abre directo su ficha (popup).
- Si hay varios, el clic muestra la lista y desde ahí se abre cada uno.
- Los puntos sin producto cargado todavía se ven más tenues y dicen "Próximamente".

Vienen 11 partes precargadas sin ubicar (Cabeza, Papada, Bondiola, Paleta, Carré, Lomo, Costillar, Panceta, Matambre, Jamón, Pata) — se pueden renombrar, borrar o agregar más, como cualquier taxonomía.

## Shortcodes

| Shortcode | Qué hace |
|---|---|
| `[granalier_productos_archivo]` | Listado completo de productos con filtro de categorías en vivo (sin recargar la página). |
| `[granalier_productos_destacados cantidad="6" categoria=""]` | Grilla de productos destacados para el home, misma estética de tarjeta que el archivo pero sin fondo. `categoria` es opcional (slug de `cat-prod`). |
| `[granalier_chancho]` | El diagrama interactivo, para insertar en el home. |
| `[granalier_producto id="123"]` | Ficha de un producto puntual embebida en la página (no en popup). También acepta `slug="..."`. |

Todas las tarjetas (archivo, destacados y los productos del chancho) abren la ficha completa en un popup, con imagen grande, presentación, tip de consumo (si tiene) y el botón de WhatsApp.

Al entrar directo a la URL de un producto (`/producto/nombre/`), se muestra la misma ficha dentro del header/footer del theme, para que los links compartidos funcionen bien.

## WhatsApp

En **Ajustes → Granalier Productos** se configura el número y el mensaje predefinido (por defecto: *"Hola! Me interesa distribuir productos Granalier (Nombre del producto)."*). Ojo: para que el link de WhatsApp abra bien en Argentina puede hacer falta el "9" después del 54 (`5493434706157` en vez de `543434706157`) — si el botón no abre el chat, probá cambiándolo ahí.

## Estética

Sigue el home y el catálogo oficial:

- **Tarjetas**: la foto es la tarjeta (esquinas redondeadas, sombra suave, título en blanco arriba), igual que la grilla de productos del home. La presentación aparece abajo al pasar el mouse; en celular se ve siempre y van 2 por fila.
- **Filtros y CTA**: botones rectangulares en bordó con texto blanco en mayúscula y espaciado, como el botón CONTACTANOS.
- **Ficha de producto**: replica la hoja del catálogo — fondo bordó, foto con marco blanco, nombre en itálica, la etiqueta "Presentación" finita y el dato en negrita, y el tip separado por una línea arena.

Paleta tomada del catálogo (variables CSS al principio de `assets/css/granalier-productos.css`):

| Variable | Valor | Uso |
|---|---|---|
| `--gp-bordo` | `#832931` | Botones, filtro activo, títulos de sección |
| `--gp-bordo-oscuro` | `#5c1a21` | Fondo de la ficha y del bloque del chancho |
| `--gp-arena` | `#d8b88e` | Etiquetas, líneas y CTA sobre bordó |

El plugin no pisa la tipografía del theme: hereda `font-family`, tamaños y `line-height` de Hello Elementor, y solo estiliza sus propios componentes.

**Por qué hay `!important` en algunas reglas:** las tarjetas y los filtros son `<button>` y las fotos son `<img>`, y Elementor genera reglas como `.elementor-kit-9 button { ... }` / `.elementor-kit-9 img { height: auto }` que cargan después del plugin y le ganan a una clase suelta. Sin blindaje, las tarjetas heredan los botones del sitio (fondo blanco, borde del color de acento, títulos cortados por `white-space: nowrap`) y las fotos dejan de recortarse. Por eso los selectores van anclados al contenedor (`.gp-grid .gp-card`), el CSS se encola con prioridad tardía y las pocas propiedades que el theme pisa llevan `!important`.

## Fase 2 (pendiente, ya con lugar preparado)

- **Descripción del producto**: no está en el MVP a propósito. Cuando esté aprobada por la empresa, se puede sumar como un campo ACF más (`descripcion`) y mostrarla en `gp_render_detalle()` (`includes/helpers.php`) sin tocar el resto.
- **Tips de consumo**: ya implementado (`tips_consumo`), es el MVP mencionado para lo que sigue.
- **CPT de recetas / formas de cocción**: no está creado todavía. La forma más directa de unirlo a Productos cuando llegue el contenido es una taxonomía compartida (por ejemplo, reutilizar `parte_cerdo` o `cat-prod`) o un campo de relación de ACF en el nuevo CPT apuntando a `producto`; `gp_get_producto_data()` es el lugar natural para agregar las recetas relacionadas de un producto.
