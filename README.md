# Libreria Machapa

Tienda de libros hecha con React. El visitante recorre el catálogo por categoría y los datos llegan desde una API REST simulada con Mock Service Worker. No hay un backend real: el navegador intercepta las peticiones y responde con el catálogo local.

Sitio publicado: https://SebastianTapia1104.github.io/Libreria-Sebastian-Tapia-PFY2202/

## Qué hace

- Muestra las categorías con `GET /api/categories`. El menú y el inicio se arman con esa respuesta.
- Muestra los libros de un género con `GET /api/books?genre=...`. La ruta es `/genre/:genre`, configurada con React Router.
- Informa cada consulta. Una barra superior dice «Consultando el catálogo...» y, si hay más de una petición a la vez, indica cuántas van en curso. La sección también muestra «Cargando categorías...» o «Cargando libros...».
- Trata los errores con un mensaje claro y una salida: reintentar, volver al inicio o seguir por otra categoría.
- Evita consultas repetidas. Las categorías se piden una sola vez, un género ya visitado se lee desde la caché y, al cambiar de género, se cancela la petición anterior.

## Respuestas del mock

| Consulta | Resultado |
|---|---|
| Ficción, Ciencia Ficción y Misterio | Listado de libros |
| Drama | Respuesta correcta, sin libros |
| Terror | Error 500 del servidor |
| Un género que no existe, por ejemplo `/genre/Fantasia` | Error 404 |
| Una ruta distinta, por ejemplo `/no-existe` | Página no encontrada |

La búsqueda filtra en pantalla las categorías o los libros que ya se cargaron. No genera otra llamada a la API.

## Cómo ejecutarlo

```bash
npm install
npm start
```

La aplicación abre en http://localhost:3000. Ese comando vale igual si clonas el repositorio: en local las consultas siguen siendo `/api/categories` y `/api/books`. La carpeta del repositorio solo se antepone al compilar para GitHub Pages.

## Cómo publicarlo

`main` guarda el código fuente. GitHub Pages publica la versión compilada, que queda en la rama `gh-pages`.

```bash
npm run deploy
```

Ese comando genera `build`, copia `index.html` como `404.html` para que las rutas del catálogo funcionen al recargar, y sube el resultado.
