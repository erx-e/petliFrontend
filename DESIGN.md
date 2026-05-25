# Design

Sistema visual de Pet's Lighthouse. Refleja el estado actual del código
(`src/styles.scss` + componentes). Marca con "→ futuro" las mejoras pendientes.

## Theme

Claro y cálido. Fondos en azul muy claro (`--light-blue`), superficies en un gris
azulado suave, texto en azul muy oscuro casi tinta. No hay modo oscuro. La calidez
viene de la tipografía serif (Fraunces) y del amarillo como acento puntual, no de
colores saturados de fondo.

Escena: una persona en el móvil, a veces angustiada por una mascota perdida, buscando
o publicando rápido. La interfaz debe sentirse clara, esperanzadora y de confianza.

## Color

Paleta actual (definida como variables CSS en `:root`, `src/styles.scss`):

| Token | Valor | Rol |
|---|---|---|
| `--blue` | `#06003e` | Texto principal / oscuro de marca |
| `--blue-transparent` | `#06003e5c` | Overlays / estados sutiles |
| `--yellow` | `#ffb703` | Acento "luz del faro" y CTAs (botones de acción) |
| `--light-blue` | `#ebebf5` | Fondo de página |
| `--darker-light-blue` | `#d9d8e6` | Superficies / tarjetas |
| `--lighter-light-blue` | `#f4f4fa` | Inputs / fondos sutiles |
| `--grey` | `#5f5e7a` | Texto secundario / mudo |
| `--green` | `#2ba84a` | Éxito / validación correcta |
| `--red` | `#ff1d15` | Error / validación incorrecta |

Estrategia de color: **restrained** (neutros azulados + un acento dorado de uso
limitado para CTAs).

Concepto de marca: el azul profundo `#06003e` es la **noche/el mar**, y el dorado
marigold `#ffb703` es la **luz del faro/linterna** que encuentra a la mascota. Antes
era `#faff00` (lima eléctrico, frío y "neón"); el ámbar cálido representa mejor la luz
y encaja con el tono esperanzador, evitando la anti-referencia "infantil/chillón".

Los neutros están **tintados hacia el indigo de marca** (antes tiraban a cian), con
croma muy bajo, para que "pertenezcan" a la paleta. El `--grey` se oscureció para
cumplir contraste AA como texto secundario.

→ futuro: migrar la paleta a **OKLCH** para un control de croma/lightness más preciso.
El marigold para texto pequeño sobre claro tiene poco contraste: usarlo en fondos con
texto oscuro encima (como en los CTAs), no como color de texto. Quedan colores ad-hoc
sueltos en componentes (`white`, `#03091e`, `#555a81`) que convendría tokenizar.

## Typography

- **Titulares:** Fraunces (serif cálido, con eje óptico). Pesos 500/600/700.
  Aplicada a `h1`–`h6`, `.title` y `.register-texto`. line-height 1.15.
- **Cuerpo / UI:** Mulish (sans humanista). Pesos 400/500/600/700. line-height 1.55.
- Carga vía Google Fonts con `preconnect` + `display=swap` (`src/index.html`).
- Variables: `--font-heading`, `--font-body`.

Escala tipográfica (rem, ratio ~1.25), nombres semánticos en `:root`:

| Token | Valor | ~px |
|---|---|---|
| `--text-xs` | 0.8rem | ~13 |
| `--text-sm` | 0.9rem | ~14 |
| `--text-base` | 1rem | 16 |
| `--text-lg` | 1.25rem | 20 |
| `--text-xl` | 1.563rem | ~25 |
| `--text-2xl` | 1.953rem | ~31 |
| `--text-3xl` | 2.441rem | ~39 |

El `h1` de la landing usa `clamp(2rem, 6vw, 2.5rem)` (fluido, por ser superficie de
marca). El resto de la app usa la escala fija en `rem`.

## Layout & Spacing

- Mobile-first; contenedores que crecen hasta ~1280px en desktop.
- Listados de mascotas en grilla de tarjetas (2–4 columnas según breakpoint).
- Reset propio (`src/app/styles/reset.scss`) aporta `box-sizing: border-box`,
  `cursor: pointer` en botones y `label { display: inline-block }` (reglas que antes
  daba el Reboot de Bootstrap, ya no importado).

Escala de espaciado (base 4px) en `:root`, lista para usar:

| Token | Valor | px |
|---|---|---|
| `--space-1` | 0.25rem | 4 |
| `--space-2` | 0.5rem | 8 |
| `--space-3` | 0.75rem | 12 |
| `--space-4` | 1rem | 16 |
| `--space-5` | 1.5rem | 24 |
| `--space-6` | 2rem | 32 |
| `--space-7` | 3rem | 48 |
| `--space-8` | 4rem | 64 |

→ en curso: migrar los paddings/márgenes sueltos en px a estos tokens. Conviene hacerlo
por pantalla y verificando, porque snappear valores fuera de escala (9, 15, 18, 20px)
cambia ligeramente el layout.

## Components

- **Botones:** CTA principal en fondo amarillo (`--yellow`), texto oscuro, peso 700.
  Usa clases de Bootstrap (`btn`, `btn-outline-primary`, `btn-check`, `btn-group`).
- **Formularios:** Bootstrap forms (`form-control`, `form-label`, `form-select`,
  `form-floating`) + estados `is-valid`/`is-invalid` con `--green`/`--red`. Solo se
  importan los módulos de formularios y botones de Bootstrap (sin Reboot ni grid).
- **Tarjetas de mascota** (`app-postpet`): imagen + datos sobre `--darker-light-blue`;
  esqueleto de carga reutilizando la misma tarjeta cuando no hay datos.
- **Uploader:** subida directa a S3 con barra de progreso; bloquea sin sesión y
  muestra errores en la tarjeta.
- **Nav, spinner, not-found** completan el sistema.

## Motion

Mínima por ahora. → futuro: añadir microinteracciones con ease-out (sin bounce), sin
animar propiedades de layout, respetando `prefers-reduced-motion`.

## Bibliotecas

- Bootstrap 5.3 (solo formularios + botones).
- Reset propio (Meyer + 3 reglas heredadas del Reboot).
- Angular 20, SCSS por componente con encapsulación.
