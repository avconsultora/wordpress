# ELEVATOR AV

Arcade 8-bit mobile-first para eventos de **AV Marketing Integral**. La consigna es **frenar el ascensor en el piso AV**. Cada acierto sube el objetivo y la velocidad. Si te pasás o te quedás corto, termina la partida.

- Vanilla JS con módulos ES. Sin frameworks ni build step.
- Pesa 84 KB en total con la fuente incluida, 34 KB con gzip.
- El ranking y los leads se guardan en Supabase. El sitio es estático y se sube a Hostinger.

```
elevator-av/
├── public/            ← ESTO es lo que se sube al hosting
│   ├── index.html     pantallas, estilos
│   ├── config.js      ÚNICO archivo de configuración (gameplay, Supabase, evento, frases, malas palabras)
│   ├── game.js        loop, estados, input, render, pantallas
│   ├── logic.js       lógica pura: difficultyFor(), evaluación del tap, moderación, WhatsApp
│   ├── sprites.js     pixel art en código (paleta + matrices), edificio procedural, logo AV
│   ├── audio.js       sonidos chiptune con Web Audio
│   ├── ranking.js     llamadas a Supabase
│   ├── display.js     vista de pantalla grande (?display=1)
│   ├── qr.js          generador de QR sin dependencias
│   ├── fonts/         Press Start 2P (OFL), subset con ¡ ¿ á é í ó ú ñ
│   └── .htaccess      HTTPS, gzip, cache
├── supabase.sql       tablas, RLS, funciones y validaciones (pegar en SQL Editor)
└── tests/             tests de lógica (node --test)
```

---

## 1. Configurar Supabase (una sola vez)

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Pegá todo el contenido de `supabase.sql` y tocá **Run**. Se puede correr más de una vez: no borra datos.
3. Revisá `public/config.js`:

   ```js
   export const EVENT_ID = 'evento-2026';        // nombre del evento
   export const SUPABASE = {
     url: 'https://iwoplqimdafucvghfovk.supabase.co',
     key: 'sb_publishable_…',                    // Project Settings → API → publishable/anon key
   };
   export const GAME_URL = 'https://juego.avconsultora.marketing/'; // lo que codifica el QR
   ```

   La key *publishable/anon* es pública por diseño; lo que protege los datos es el RLS.
   **Nunca** pongas la `service_role` key en el front.

### Qué hace el SQL

| Tabla / función | Qué puede hacer la anon key |
|---|---|
| `scores` | INSERT y SELECT. **Sin** UPDATE ni DELETE. |
| `leads` | **Nada** directo: ni SELECT, ni INSERT, ni UPDATE, ni DELETE. Solo se puede escribir con `submit_lead()`. |
| `banned_words` | Nada (solo se edita desde el panel). |
| `get_ranking(event, game_id)` | Top 10 (mejor score por nickname) + tu puesto. |
| `submit_lead(...)` | Inserta el lead. Si el WhatsApp ya estaba cargado para ese evento, responde OK igual y no duplica. |

Validaciones en la base:

- `score` entre 0 y 200.
- `duration_ms` coherente con el score, según la curva de dificultad (función `min_duration_ms`).
- `game_id` único: una partida es un solo envío.
- Como máximo un envío cada 5 s por nickname.
- Filtro de malas palabras sobre el nickname: si matchea, se reemplaza por `JUGADOR####`. Solo se permiten letras, números, espacio y acentos.
- WhatsApp con formato `^\+?[0-9]{8,15}$` y nombre de hasta 40 caracteres.

### Verificar que nadie puede leer los leads

Con la anon key, esto tiene que fallar con `permission denied` (código `42501`):

```bash
curl 'https://iwoplqimdafucvghfovk.supabase.co/rest/v1/leads?select=*' \
  -H 'apikey: TU_PUBLISHABLE_KEY'
```

Y esto tiene que devolver el ranking:

```bash
curl -X POST 'https://iwoplqimdafucvghfovk.supabase.co/rest/v1/rpc/get_ranking' \
  -H 'apikey: TU_PUBLISHABLE_KEY' -H 'Content-Type: application/json' \
  -d '{"p_event_id":"evento-2026"}'
```

---

## 2. Deploy en Hostinger

No hay build: se sube la carpeta `public/` tal cual.

1. **Elegí dónde va.** Lo recomendable es un subdominio, por ejemplo `juego.avconsultora.marketing`:
   hPanel → **Dominios → Subdominios** → crear `juego`. Hostinger le asigna una carpeta, del tipo `public_html/juego/` o `domains/juego.avconsultora.marketing/public_html/`.
2. **Subí los archivos.** En hPanel → **Archivos → Administrador de archivos**, entrá a esa carpeta y subí **el contenido** de `public/`: `index.html`, todos los `.js`, la carpeta `fonts/` y `.htaccess`.
   - `.htaccess` empieza con punto y a veces queda oculto. En el Administrador de archivos activá *Mostrar archivos ocultos*.
   - Por FTP (FileZilla): hPanel → **Archivos → Cuentas FTP** te da host, usuario y contraseña. Arrastrá el contenido de `public/` a la carpeta del subdominio.
3. **HTTPS.** En hPanel → **Seguridad → SSL**, verificá que el certificado del dominio o subdominio esté *Activo* (Hostinger lo instala gratis; puede tardar unos minutos). El `.htaccess` ya fuerza la redirección a `https://`.
4. **Probalo.** Abrí `https://juego.avconsultora.marketing` en el celular, jugá una partida y guardala en el ranking.
5. **QR.** Poné esa URL en `GAME_URL` (en `config.js`) y usala también para el QR impreso del evento.

El `.htaccess` incluido fuerza HTTPS, activa gzip, pone cache largo a la fuente y revalida siempre `index.html` y `config.js`, así los cambios se ven al toque. El resto del JS queda cacheado 10 minutos.

### Al actualizar archivos

Cada `.js` se carga con un número de versión (`game.js?v=4`). Así el navegador nunca mezcla archivos viejos de la caché con archivos nuevos. Al subir una actualización:

- subí **todos** los archivos que cambiaron, junto con el `index.html`;
- no hace falta tocar `config.js` salvo que quieras cambiar algo de configuración.

Si algo no carga, en 6 segundos aparece "No se pudo cargar el juego" con un botón RECARGAR y el error exacto en letra chica. Mandame ese texto si pasa.

> El juego usa módulos ES, así que no funciona abriendo `index.html` con doble click (`file://`). Para probarlo en la compu: `npx http-server public`.

---

## 3. Vista de pantalla grande (tele del stand)

Abrí `https://juego.avconsultora.marketing/?display=1` en el navegador de la tele o de la notebook conectada, y ponelo en pantalla completa con F11.
Muestra el top 10 en grande, el QR con `GAME_URL` y **ESCANEÁ Y SUPERÁ AL #1**. Se actualiza sola cada 10 s (`DISPLAY_REFRESH_MS`).

---

## 4. Leads (consulta gratis)

**Ver los leads:** Supabase → **Table Editor** → `leads`. Solo se ven desde el panel.

**Exportar a CSV:** en **Table Editor** → `leads`, tocá **Export → Export to CSV**.
Otra opción es el SQL Editor:

```sql
select created_at, whatsapp, nombre, nickname, score, status
from leads where event_id = 'evento-2026' order by created_at;
```

y después **Download CSV**, arriba a la derecha del resultado.

**Marcar como contactado:** en el Table Editor, doble click en la celda `status` y cambiá `nuevo` por `contactado`.

El link para escribir por WhatsApp es `https://wa.me/` seguido del número sin el `+`.

El botón **🎁 GANASTE UNA CONSULTA GRATIS** aparece desde `CONFIG.consultaMinScore` aciertos (5 por defecto; en 0 aparece siempre). Una vez que alguien la pide, ese dispositivo ya no ve el botón durante el evento.

---

## 5. Operación del ranking

### Borrar un nickname inapropiado (30 segundos)

1. Supabase → **Table Editor** → `scores`.
2. **Filter** → `nickname` `equals` `NOMBRE`.
3. Tildá las filas → **Delete**. La pantalla grande lo saca en el próximo refresco (10 s).

O en el SQL Editor:

```sql
delete from scores where event_id = 'evento-2026' and nickname = 'NOMBRE';
```

Para que la palabra no vuelva a pasar: **Table Editor** → `banned_words` → **Insert row**, en minúsculas y sin acentos.
En el front también está la lista `BAD_WORDS`, en `config.js`, que sirve para que el jugador vea el reemplazo al toque. La que manda es la de la base.

### Ranking nuevo para otro evento

Cambiá `EVENT_ID` en `config.js`, por ejemplo `'expo-marzo-2027'`, y subí de nuevo ese archivo. Cada evento tiene su propio ranking y los datos anteriores quedan guardados.
Si además querés borrar un evento:

```sql
delete from scores where event_id = 'evento-2026';
```

---

## 6. Ajustar la dificultad

Todo está en `CONFIG`, en `config.js`:

| Para… | Tocá |
|---|---|
| Hacerlo **más fácil** | bajar `startSpeed` (1.6 → 1.3), bajar `speedMultiplier` (1.09 → 1.06), subir `hitTolerance` (0.30 → 0.35) o `minHitTolerance` |
| Hacerlo **más difícil** | subir `startSpeed` o `speedMultiplier`, bajar `hitTolerance` |
| Partidas más cortas | subir `speedMultiplier` o bajar `maxSpeed` más tarde |
| Menos espera entre rondas | bajar `roundTransitionMs` |
| Objetivos más lejos o más cerca | `minGap`, `maxGap`, `gapGrowthEvery`, `gapCap` |
| Terminar antes si no toca | bajar `overshootLimit` |

La velocidad llega al tope de 9 pisos/s alrededor del acierto 20.

**Importante:** si cambiás `startSpeed`, `speedMultiplier`, `maxSpeed`, `minGap`, `maxGap`, `gapGrowthEvery`, `gapCap`, la tolerancia o `roundTransitionMs`, copiá los mismos valores en `min_duration_ms()` (en `supabase.sql`) y volvé a correrlo. Si no, el anti-trampa podría rechazar partidas legítimas.

### Modo debug

Poné `debugEnabled: true` en `config.js` (solo en tu compu, **nunca en el hosting**) y abrí con `?debug=1`. Muestra la posición exacta, el objetivo, la tolerancia, la velocidad, la diferencia al frenar, los FPS y la banda de tolerancia en naranja. Sirve para calibrar.

---

## 7. Seguridad y anti-trampa

Todo está en `supabase.sql` (instalación nueva) o en `supabase-seguridad.sql` (para aplicar sobre una base existente). Los dos se pueden correr más de una vez.

**Ranking**
- El servidor registra cuándo empieza cada partida (`start_game`) y mide él la duración al guardar. La duración que manda el celular se ignora.
- Se exige al menos el 90% del tiempo mínimo teórico para ese score.
- El piso alcanzado tiene que ser coherente con los aciertos.
- Una partida se guarda una sola vez.
- **Tope de 80 aciertos** (`max_plausible_score()`). Si alguien bueno de verdad lo alcanza, subilo:
  ```sql
  create or replace function public.max_plausible_score() returns int language sql immutable as $fn$ select 120 $fn$;
  ```
- Pausar no da ventaja: al reanudar, la ronda vuelve al piso de salida.
- El modo debug está apagado en producción (`debugEnabled: false`).

**Datos**
- Con la key pública no se puede leer ninguna tabla: ni `scores`, ni `leads`, ni `games`. El ranking sale solo por `get_ranking`.
- Las funciones internas no se pueden llamar desde afuera.
- En los leads se limpian los caracteres que Excel interpreta como fórmula (`= + - @`).

**Límites por IP** (generosos, porque en un evento muchos celulares comparten el Wi-Fi)
- 120 partidas cada 10 minutos.
- 60 scores guardados cada 10 minutos.
- 40 consultas gratis por hora.

Para ver de qué IP vino un score sospechoso: Table Editor → `scores` → columna `ip`.

**Hosting** (`.htaccess`)
- HTTPS obligatorio (HSTS).
- Política de seguridad de contenido: solo scripts propios y solo conexiones a Supabase.
- No se puede embeber en otra página.

**Supabase: recomendado hacerlo a mano una vez**
- Authentication → Sign In / Providers → desactivá **Allow new users to sign up**. El juego no usa cuentas.

**Lo que ningún juego de navegador puede evitar del todo:** un bot que mire la pantalla y toque solo, o alguien que modifique el juego en su propio navegador para que vaya más lento. El tope de aciertos y los controles de tiempo lo hacen mucho más difícil. Si igual aparece algo imposible:

```sql
select nickname, score, max_floor, duration_ms, ip, created_at
from scores where event_id = 'evento-2026' order by score desc limit 20;
```

Una partida real dura unos 2,2 a 4 s por acierto. Se borra como en la sección 5.

## 8. Desarrollo

```bash
node --test tests/*.test.mjs        # lógica, dificultad, moderación, WhatsApp, sprites
npx http-server public -c-1         # servir local en http://localhost:8080
```
