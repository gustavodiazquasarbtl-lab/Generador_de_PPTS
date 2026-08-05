# Auditoría BTL — Supermercados Peruanos

App de una sola página (HTML/CSS/JS puro, sin build) para auditar elementos BTL
en tienda (Plaza Vea, Vivanda, Makro): jalavistas, ganchera, collarín, floor
graphic, etc.

## Qué incluye

- **Inicio**: accesos directos a Instrucciones, Formulario y Dashboard, con
  KPIs resumen.
- **Formulario**: selección de tienda/supervisor/fecha → acordeón de preguntas
  (cerrado por defecto, se despliega el detalle por elemento) → envío.
- **Dashboard**: aro de cumplimiento general, cumplimiento por pregunta, por
  tienda (semáforo 🟢🟡🔴), tabla de auditorías recientes, exportar a CSV.
- **Instrucciones**: guía paso a paso y criterios de calificación.
- **Configuración**: administrar tiendas y elementos estándar.

## Dónde vive la información

Por defecto, todo se guarda en `localStorage` del navegador (clave
`btl_auditoria_data_v1`), así que la app funciona sin nada más. Pero si
conectas Google Sheets (ver más abajo), **la hoja de cálculo pasa a ser la
fuente de verdad compartida**: todos los supervisores que abran la misma URL
ven y editan el mismo historial, y `localStorage` queda solo como caché
offline por si se cae la conexión.

## Conectar Google Sheets (backend gratis, con edición)

Esto te da: guardado compartido entre supervisores, un Dashboard consolidado
en tiempo real, y la posibilidad de **editar una auditoría ya enviada** desde
la propia app (botón "✏️ Editar" en el Dashboard).

### 1) Crear la hoja y el script

1. Crea una hoja de cálculo nueva en Google Sheets (vacía, sin pestañas
   especiales — el script crea "Auditorias" y "Respuestas" solo).
2. Menú **Extensiones → Apps Script**.
3. Borra el contenido de `Code.gs` que trae por defecto y pega **todo** el
   contenido del archivo `Code.gs` que te entregué junto a este README.
4. Guarda el proyecto (ícono de disco o Ctrl+S).

### 2) Publicar como Aplicación web

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configuración:
   - **Ejecutar como:** Yo (tu cuenta de Google).
   - **Quién tiene acceso:** Cualquier usuario.
4. Clic en **Implementar** y autoriza los permisos que pida Google (es tu
   propio script accediendo a tu propia hoja).
5. Copia la URL que termina en `/exec`.

> Cada vez que edites `Code.gs` más adelante, tienes que crear una **nueva
> versión** de la implementación (Implementar → Gestionar implementaciones →
> ✏️ → Nueva versión) para que los cambios se reflejen en esa misma URL.

### 3) Fijar la URL en el código (para que quede lista para todos, sin configurar nada)

Antes de subir `index.html` a Vercel/Netlify, ábrelo y busca esta línea cerca
del inicio del `<script>`:

```js
const DEFAULT_WEBAPP_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT_TERMINADA_EN_/exec';
```

Reemplaza el texto entre comillas por la URL `/exec` que copiaste en el paso
anterior, por ejemplo:

```js
const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

Guarda el archivo y despliega (o vuelve a desplegar) en Vercel/Netlify. A
partir de ahí, **cualquiera que abra el link de la app ya queda conectado al
mismo consolidado**, sin ir a Configuración ni pegar nada — todas las
auditorías, de cualquier supervisor y cualquier dispositivo, caen en la
misma hoja de Google Sheets.

La pantalla de Configuración de la app sigue existiendo por si en algún
momento necesitas apuntar puntualmente a otra hoja desde un dispositivo (por
ejemplo, para hacer pruebas), pero no hace falta tocarla para el uso normal
del equipo.

### ¿Es gratis?

Sí, completamente. Google Sheets y Apps Script no tienen costo para este uso
(no hay límites que vayas a rozar con volumen de auditorías BTL). El único
límite práctico de Apps Script son cuotas de ejecuciones diarias muy altas,
pensadas para consumo mucho mayor al de este caso.

### Editar una auditoría ya enviada

En el Dashboard, cada fila de la tabla tiene un botón **"✏️ Editar"**: abre
esa auditoría en el formulario con las respuestas ya cargadas, permite
modificarlas y, al guardar, actualiza la misma fila en Sheets (no crea una
duplicada). Internamente queda registrada la fecha de última edición.

## Desplegar en Vercel (recomendado, igual que Generador de Geo)

1. Crea un repositorio nuevo en GitHub y sube estos dos archivos
   (`index.html`, `README.md`) — no necesitas nada más, no hay `package.json`
   ni build step.
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el
   repositorio.
3. Framework Preset: **Other** (o "Static"). No hay que tocar build command
   ni output directory.
4. Deploy. Listo — la URL que te da Vercel ya sirve `index.html` en la raíz.

## Desplegar en Netlify (alternativa)

1. Arrastra la carpeta con `index.html` directamente a
   [app.netlify.com/drop](https://app.netlify.com/drop), o conéctala por
   GitHub igual que en Vercel.
2. No hace falta build command.

## Personalizar

Todo el contenido editable está al inicio del `<script>`, en el objeto
`DEFAULT_DATA`:

- `tiendas`: lista de tiendas del desplegable (también editable desde la
  pantalla de Configuración dentro de la app).
- `elementos`: elementos BTL que se cargan por defecto en cada auditoría.
- `preguntas`: las preguntas del acordeón (`id` interno + `texto` visible).

Los colores de marca están en `:root` al inicio del `<style>` (`--brand`,
`--ok`, `--warn`, `--bad`) si necesitas ajustar la paleta.

## Archivos de este entregable

- `index.html` — la app completa (frontend).
- `Code.gs` — backend de Google Apps Script (pegar en el editor de Apps
  Script de tu hoja, no se sube a Vercel/Netlify).
- `README.md` — este archivo.
