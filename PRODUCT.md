# Product

## Register

product

> Nota: el proyecto tiene dos superficies con peso similar. La **app** (publicar,
> listados, detalle, perfil, formularios) es el default `product` que guía la
> mayoría de las decisiones. La **landing** (`/`) se trata como `brand` por tarea
> cuando se trabaja específicamente en ella.

## Users

Usuarios principales, normalmente en un momento emocional y con cierta urgencia:

- **Dueños que perdieron a su mascota.** Angustiados, quieren difundir la ficha de
  su mascota y que la comunidad los ayude a encontrarla cuanto antes.
- **Personas que encontraron un animal.** Quieren reportarlo (con foto y ubicación)
  para dar con su dueño.

Secundarios: personas que buscan **adoptar** y quienes **reportan casos de ayuda**
(animal herido o en peligro). El núcleo del producto es el ciclo
**perdido ↔ encontrado** (reencuentro).

Contexto de uso: mayormente desde el móvil, a veces bajo estrés y con prisa. Ecuador
(la app maneja provincia/cantón/sector como geografía).

## Product Purpose

Pet's Lighthouse conecta a quienes buscan a su mascota con quienes la encuentran, y
facilita adopción y reporte de casos de ayuda. Una publicación lleva foto(s),
especie/raza, ubicación, fecha y contacto, para maximizar la probabilidad de
reencuentro. El éxito se mide en **reencuentros y adopciones concretadas**: cada
reporte debe acercar a una mascota a su hogar.

## Brand Personality

Cálida, esperanzadora y humana. Transmite que el reencuentro es posible, con un tono
emotivo pero con peso: hay vidas y familias reales en juego, así que la calidez nunca
cae en lo frívolo ni lo infantil. Voz cercana, en segunda persona (tú), clara y
orientada a la acción.

Tres palabras: **cálida, esperanzadora, humana**.

## Anti-references

Lo que el sitio NO debe parecer:

- **Frío / corporativo.** Nada de azul-banca, gris SaaS impersonal o sensación de
  herramienta financiera.
- **Genérico tipo plantilla.** Evitar el look de plantilla Bootstrap sin
  personalidad (cards idénticas, defaults sin intención).
- **Infantil / caricaturesco.** Evitar colores chillones, redondeces de juguete y
  tono de app para niños. Es cálido, no cursi.
- **Recargado / saturado.** Evitar ruido visual y elementos compitiendo; la emoción
  se transmite con foco, no con exceso.

## Design Principles

1. **El reencuentro primero.** Cada pantalla debe mover al usuario hacia reunir a una
   mascota con su familia: reducir fricción para reportar, buscar y contactar.
2. **Claridad antes que ingenio.** La gente llega estresada y con prisa; legibilidad,
   jerarquía y velocidad ganan a cualquier floritura.
3. **Calidez con propósito, no decoración.** El tono cálido sirve a la emoción y la
   confianza; nunca es ruido. Si un elemento no aporta, sobra.
4. **Humano, ni corporativo ni de juguete.** El punto medio entre el SaaS frío y la
   app caricaturesca: cercano, esperanzador y creíble.
5. **Confianza por defecto.** Los usuarios comparten datos de contacto y actúan sobre
   la información; la interfaz debe sentirse fiable y cuidada.

## Accessibility & Inclusion

Objetivo **WCAG 2.1 AA**: contraste de texto suficiente, foco visible, navegación por
teclado en formularios, y texto escalable (tamaños en `rem`, sin bloquear el zoom).
Considerar reduced-motion al añadir animaciones.
