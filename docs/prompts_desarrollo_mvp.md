# Prompts para desarrollar la PWA — MVP "Frutas y verduras imperfectas"

Cómo usar este documento: son prompts pensados para pegar directamente en Claude Code, Cursor u otro asistente de desarrollo, en el orden en que están numerados. Cada uno construye sobre el anterior. No los peguen todos juntos — úsenlos módulo por módulo, revisen el resultado, y recién avancen al siguiente. Con 5 devs en el equipo, pueden repartirse los módulos 3 en adelante en paralelo una vez que el 0-2 esté listo, porque dependen del mismo esquema de datos.

Contexto que ya está fijado por las decisiones anteriores (no lo cambien sin volver a revisar el modelo financiero):
- Sin pasarela de pago integrada. El cobro de la tarifa por publicación se registra en la app pero el pago real ocurre fuera (QR/efectivo/Tigo Money), confirmado manualmente por un admin en esta fase.
- 2 publicaciones gratis por vendedor por mes calendario; desde la 3ra, tarifa según tramo de valor declarado.
- Sin delivery ni almacenamiento propio: solo coordinación de recojo.
- Categorías priorizadas: papa, cebolla, zanahoria, zapallo, manzana, cítricos (baja perecibilidad).

---

## Prompt 0 — Setup del proyecto y stack

```
Actúa como un ingeniero de software senior especializado en PWAs. Vamos a construir el MVP de una plataforma de marketplace local para conectar vendedores de frutas/verduras "estéticamente imperfectas pero aptas para consumo" con compradores (pensiones, comedores, familias) en Tarija, Bolivia.

Restricciones de contexto que DEBES respetar:
- Presupuesto de infraestructura Bs 0 en esta fase: usa exclusivamente free tier de los servicios elegidos.
- Conectividad inestable en zonas periurbanas: la app debe ser una PWA instalable, funcionar razonablemente con conexión intermitente, y cargar rápido en redes 3G/4G lentas.
- Sin pasarela de pago en dólares (Stripe, etc.) — no la incluyas en ningún flujo.
- El equipo tiene 2 devs backend, 2 frontend, 1 fullstack: elige un stack que permita trabajo paralelo claro entre frontend y backend, no un framework full-stack monolítico que difumine esa separación.

Tareas:
1. Propón un stack técnico concreto (frontend, backend/BaaS, base de datos, hosting, auth, almacenamiento de imágenes) que cumpla lo anterior, priorizando Supabase (Postgres + Auth + Storage, free tier) y Next.js o Vite+React desplegado en Vercel/Netlify. Justifica cada elección en 1-2 líneas.
2. Genera la estructura de carpetas inicial del proyecto siguiendo buenas prácticas para trabajo en equipo (separación clara de features, no todo en un solo archivo).
3. Configura el manifest.json y service worker mínimo necesario para que la app sea instalable como PWA (ícono, nombre, tema de color, modo standalone).
4. Configura variables de entorno de ejemplo (.env.example) sin exponer ninguna clave real.
5. Entrega un README.md corto explicando cómo levantar el proyecto localmente, para que cualquiera de los 6 fundadores pueda clonar y correr en minutos.

No implementes lógica de negocio todavía, solo el esqueleto.
```

---

## Prompt 1 — Esquema de base de datos

```
Con el stack ya definido (Supabase/Postgres), diseña el esquema de base de datos para el MVP. Antes de escribir el SQL, muéstrame el modelo entidad-relación en texto (tablas, campos clave, relaciones) para que lo revisemos.

Entidades mínimas necesarias:
- usuarios: pueden ser "vendedor" o "comprador" (un mismo usuario podría ser ambos en el futuro, pero en el MVP maneja un rol principal). Campos: nombre, teléfono (usado como identificador principal, no email — la mayoría de nuestros usuarios usa WhatsApp como canal principal), ubicación aproximada (mercado/zona), rol, fecha de registro.
- publicaciones: producto (de una lista cerrada: papa, cebolla, zanahoria, zapallo, manzana, cítricos, otro), cantidad, unidad de medida, precio total declarado del lote (este campo es clave: de él depende el tramo de tarifa), fotos (mínimo 1, máximo 4), ubicación/punto de recojo, horario de recojo disponible, estado (activa, vendida, vencida, retirada), fecha de creación, fecha de expiración automática (ej. 7 días).
- tarifas_publicacion: registro de cada publicación que superó las 2 gratis del mes, con el tramo aplicado, el monto, y estado de pago (pendiente/confirmado por admin), fecha.
- cuota_mensual_vendedor: contador de publicaciones gratis usadas por vendedor en el mes calendario actual (se resetea el día 1 de cada mes).
- contactos_interes: cuando un comprador expresa interés en una publicación (equivalente a "match"), registrar quién, cuándo, y si terminó en transacción reportada por el vendedor (opcional, sin verificación en MVP).
- métricas_impacto: tabla o vista agregada que permita calcular kg totales publicados/rescatados y Bs generados para vendedores — esto lo va a pedir el pitch, no lo dejes para después.

Requisitos:
1. Usa UUID como llave primaria.
2. Define los ENUM de Postgres para: rol de usuario, categoría de producto, estado de publicación, estado de pago de tarifa.
3. Agrega los índices necesarios para las consultas más frecuentes (listar publicaciones activas por categoría/ubicación, contar publicaciones del mes por vendedor).
4. Escribe las políticas de Row Level Security (RLS) de Supabase necesarias: un vendedor solo puede editar sus propias publicaciones; cualquier usuario autenticado puede leer publicaciones activas; solo un rol "admin" puede confirmar pagos de tarifa.
5. Entrega el SQL de migración completo, comentado.
```

---

## Prompt 2 — Autenticación por teléfono (no email)

```
Implementa el flujo de autenticación usando número de teléfono como identificador principal (vía Supabase Auth con OTP por SMS, o alternativa: registro simple con teléfono + verificación manual por WhatsApp si el SMS OTP resulta costoso en Bolivia — evalúa el costo de SMS OTP de Supabase/Twilio en nuestro contexto de escasez de dólares y dime si conviene o si es mejor un login más simple para el piloto, ej. teléfono + PIN de 4 dígitos sin verificación SMS, aceptando el riesgo de suplantación como algo a resolver después).

Requisitos:
1. Pantalla de registro: nombre, teléfono, rol (vendedor/comprador), zona/mercado habitual.
2. Pantalla de login simple.
3. Manejo de sesión persistente (que no tenga que loguearse cada vez que abre la PWA, importante para conectividad intermitente).
4. Estado de carga y error claros, en español, sin jerga técnica (ej. "No pudimos verificar tu número, inténtalo de nuevo" en vez de un código de error crudo).

Dame primero tu recomendación razonada de qué mecanismo usar antes de escribir código, considerando que nuestros usuarios (comerciantes de mercado) pueden no tener mucha familiaridad con apps.
```

---

## Prompt 3 — Publicar producto (con lógica de tarifa)

```
Implementa el flujo de "publicar producto" para vendedores. Esta es la funcionalidad más importante del MVP — tómate tu tiempo.

Flujo:
1. El vendedor selecciona categoría (lista cerrada: papa, cebolla, zanahoria, zapallo, manzana, cítricos, otro), sube 1-4 fotos reales del producto, indica cantidad y unidad, precio total del lote, punto de recojo (texto libre + referencia de mercado/zona), y horario(s) disponibles para recojo.
2. Antes de confirmar la publicación, el sistema debe:
   a. Consultar cuántas publicaciones gratis lleva usadas ese vendedor en el mes calendario actual.
   b. Si le quedan publicaciones gratis (de las 2 mensuales), publicar sin costo.
   c. Si ya las usó, calcular el tramo de tarifa según el precio total declarado del lote:
      - Hasta Bs 100 → Bs 2
      - Bs 101–500 → Bs 5
      - Bs 501–1.500 → Bs 10
      - Más de Bs 1.500 → Bs 20
   d. Mostrar al vendedor, ANTES de publicar, un resumen claro: "Esta publicación no es gratis (ya usaste tus 2 gratis de este mes). Tarifa: Bs X. Se paga por publicar, no importa si vendes todo o no." — esto es intencional, así el vendedor entiende la lógica y no se siente engañado después.
   e. Al confirmar, crear la publicación en estado "pendiente de pago" si corresponde tarifa, o "activa" directamente si fue gratis.
3. Si la publicación queda "pendiente de pago", mostrar instrucciones simples de cómo pagar (QR/Tigo Money — deja el dato como configurable, no hardcodeado) y que un admin la activará al confirmar el pago.
4. Agregar la funcionalidad de "republicar gratis" si un lote no vendido se marca como vencido dentro de los 7 días y el vendedor quiere volver a publicarlo (primera republicación sin costo adicional, ver reglas del modelo financiero).
5. Manejo de errores: fotos muy pesadas (comprimir automáticamente antes de subir, pensando en conexiones lentas), campos vacíos, precio inválido.

Escribe primero la lógica de cálculo de tarifa como una función pura y testeable, separada de la UI, y agrégale tests unitarios cubriendo los 4 tramos y los casos límite (Bs 100 exacto, Bs 500 exacto, Bs 1.500 exacto).
```

---

## Prompt 4 — Explorar y contactar (comprador)

```
Implementa el flujo de exploración para compradores (sin necesidad de registro obligatorio para solo mirar — el registro sí es obligatorio para poder contactar al vendedor, para que quede trazado el interés en la tabla contactos_interes).

Requisitos:
1. Listado de publicaciones activas, con filtro por categoría y por zona/mercado. Ordenar por más recientes primero.
2. Cada tarjeta de publicación muestra: foto principal, categoría, cantidad, precio total, zona de recojo, y cuánto falta para que expire (ej. "vence en 3 días").
3. Vista de detalle de una publicación: todas las fotos, descripción, punto de recojo exacto, horarios disponibles, y un botón "Contactar al vendedor" que abre WhatsApp con un mensaje pre-armado (usa el esquema wa.me con el teléfono del vendedor y un texto tipo: "Hola, vi tu publicación de [producto] en la plataforma y me interesa").
4. Al presionar "Contactar", registra el evento en contactos_interes antes de redirigir a WhatsApp (esto es importante para medir impacto, no lo omitas).
5. Optimiza las imágenes para carga rápida en conexión lenta (lazy loading, tamaños responsivos).

Prioriza que este flujo funcione perfecto sin registro previo hasta el momento de contactar — no pongas paywalls ni registros forzosos antes de eso, es la parte que más fricción le puede quitar a la adopción.
```

---

## Prompt 5 — Panel de administración (equipo del proyecto)

```
Implementa un panel de administración simple (solo accesible para usuarios con rol "admin", que serán los propios fundadores durante el piloto) con estas pantallas:

1. Publicaciones pendientes de pago de tarifa: lista con botón "Confirmar pago" que cambia el estado a "activa". Esto reemplaza, por ahora, a una pasarela de pago automática.
2. Moderación básica: lista de publicaciones nuevas con un checklist simple para marcar "revisada" (foto se ve razonable, no hay señales evidentes de producto en mal estado, precio no es absurdo). No implementes IA ni verificación automática — es criterio humano simple del equipo en esta etapa.
3. Dashboard de métricas de impacto, con estos números calculados en tiempo real:
   - Total de vendedores activos (con al menos 1 publicación en los últimos 30 días).
   - Total de publicaciones activas.
   - Kg totales publicados por categoría.
   - Bs totales declarados en lotes publicados (proxy de "valor rescatado").
   - Total de contactos_interes generados (proxy de demanda).
   - Ingresos por tarifas confirmados en el mes.
4. Todo en una sola vista simple, sin necesidad de gráficos complejos por ahora — números claros con etiquetas, priorizando que el equipo pueda revisar esto a diario durante el piloto sin fricción.

Protege estas rutas para que solo usuarios con rol "admin" puedan acceder (verificar tanto en frontend como con RLS en Supabase).
```

---

## Prompt 6 — Reseteo mensual de cuota gratis (tarea programada)

```
Implementa la lógica que resetea el contador de "publicaciones gratis usadas" de cada vendedor el día 1 de cada mes calendario.

Opciones a evaluar (dime cuál recomiendas para nuestro caso, dado que estamos en free tier de Supabase):
1. Un cron job de Supabase (pg_cron) que corra el día 1 de cada mes.
2. Calcular la cuota "al vuelo" en cada consulta, filtrando publicaciones del vendedor creadas dentro del mes calendario actual, sin necesidad de resetear nada físicamente (esto evita depender de un cron y es más robusto ante fallos).

Implementa la opción que consideres más simple y confiable para un equipo pequeño manteniendo el sistema, y explica el trade-off de la que descartaste.
```

---

## Prompt 7 — PWA: instalabilidad y modo offline básico

```
Refuerza las capacidades de PWA del proyecto:

1. Verifica que el manifest.json y el service worker cumplan los criterios de instalabilidad (Lighthouse PWA checklist): ícono en varios tamaños, theme_color, display standalone, start_url correcto.
2. Implementa cacheo básico con el service worker para que:
   - La app cargue (shell básico) incluso con conexión intermitente.
   - Las publicaciones ya vistas queden disponibles en modo lectura si se pierde la conexión momentáneamente.
3. Agrega un indicador visual simple de "sin conexión" cuando corresponda, en español y sin alarmar al usuario innecesariamente (ej. "Estás sin conexión. Te mostramos lo último que cargamos").
4. No implementes sincronización offline compleja (background sync de publicaciones creadas sin conexión) — está fuera de alcance del MVP, es una sobre-ingeniería para esta etapa. Si detectas que el usuario intentó publicar sin conexión, simplemente avisa que necesita conexión para publicar.

Corre una auditoría Lighthouse mental (o real si tienes la herramienta disponible) y lista qué le falta a la app para pasar el checklist de instalabilidad de PWA.
```

---

## Prompt 8 — Deploy y checklist pre-piloto

```
Prepara el proyecto para el despliegue en Vercel (frontend) + Supabase (backend), ambos en free tier.

Entrega:
1. Instrucciones paso a paso de despliegue, incluyendo cómo configurar las variables de entorno en Vercel sin exponer claves.
2. Un checklist de "listo para el piloto" que cubra: RLS activo y probado en todas las tablas sensibles, manejo de errores visible al usuario (no pantallas en blanco ni errores en inglés/técnicos), compresión de imágenes funcionando, flujo de tarifa probado con los 4 tramos, panel de admin protegido, PWA instalable verificada en un celular Android real (no solo en el navegador de escritorio).
3. Identifica y documenta los límites del free tier que estamos usando (filas de base de datos, almacenamiento, ancho de banda) y en qué momento (aproximado, en número de vendedores/publicaciones activas) tendríamos que empezar a pagar el siguiente escalón — esto lo necesitamos para el pitch financiero, no lo dejes solo en el código.
```

---

## Notas para el equipo

- **Orden sugerido de trabajo con 5 devs:** Prompts 0-2 los hace 1-2 personas primero (son la base que todos necesitan). Una vez lista la base, Prompt 3 (publicar) y Prompt 4 (explorar) se pueden trabajar en paralelo por equipos distintos, porque tocan partes distintas de la UI aunque compartan el esquema de datos. Prompt 5 (admin) y 6 (cuota mensual) pueden ir en paralelo también. Prompt 7 y 8 son al final, con el producto ya integrado.
- **No agreguen features que no estén en estos prompts** sin volver a revisar el modelo financiero — cada feature nueva (ej. chat interno, pasarela de pago, calificaciones) es tentador para un equipo técnico pero no es lo que hay que validar primero.
- Si algún prompt genera una propuesta de stack distinta a Supabase/Vercel, evalúenla, pero recuerden que la razón de elegir ese stack fue mantener el costo mensual en Bs 0 durante el piloto — cualquier alternativa debe cumplir esa misma restricción.
