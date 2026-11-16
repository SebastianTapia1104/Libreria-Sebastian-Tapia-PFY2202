// Acceso al mock REST.
// La caché evita repetir una consulta que ya respondió bien.
// Si la misma URL ya está en curso, se reutiliza esa petición.
// Al cambiar de género se cancela la consulta anterior para no gastar una respuesta que ya no se va a mostrar.

const cache = new Map();
const enCurso = new Map();
const controladores = new Map();

let pendientes = 0;
const oyentes = new Set();
let urlLibrosActiva = null;

function notificarCarga() {
  oyentes.forEach((oyente) => oyente(pendientes));
}

export function suscribirCarga(oyente) {
  oyentes.add(oyente);
  oyente(pendientes);
  return () => oyentes.delete(oyente);
}

function rastrear(promesa) {
  pendientes += 1;
  notificarCarga();
  return promesa.finally(() => {
    pendientes -= 1;
    notificarCarga();
  });
}

export function urlLibros(genre) {
  return `/api/books?genre=${encodeURIComponent(genre)}`;
}

export function leerCache(url) {
  return cache.has(url) ? cache.get(url) : null;
}

function mensajePorEstado(status) {
  if (status === 404) return 'No encontramos la información solicitada.';
  if (status === 500) return 'El servicio tuvo un problema al responder.';
  if (status === 400) return 'La consulta no es válida.';
  return `El servicio respondió con un error (${status}).`;
}

function errorHttp(response, body) {
  const error = new Error((body && body.message) || mensajePorEstado(response.status));
  error.name = 'HttpError';
  error.status = response.status;
  error.alternativas = Array.isArray(body && body.alternativas) ? body.alternativas : [];
  return error;
}

function errorDeRed() {
  const error = new Error('No hay conexión con el catálogo. Revisa tu red e inténtalo otra vez.');
  error.name = 'NetworkError';
  error.status = 0;
  error.alternativas = [];
  return error;
}

function cancelar(url) {
  const controller = controladores.get(url);
  if (controller) controller.abort();
}

export function getJson(url, { force = false } = {}) {
  if (!force && cache.has(url)) {
    return Promise.resolve(cache.get(url));
  }

  if (!force && enCurso.has(url)) {
    return enCurso.get(url);
  }

  if (force) {
    cache.delete(url);
    cancelar(url);
  }

  const controller = new AbortController();
  controladores.set(url, controller);

  const promesa = rastrear(
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (controller.signal.aborted || controladores.get(url) !== controller) {
          const abortado = new Error('Petición cancelada');
          abortado.name = 'AbortError';
          throw abortado;
        }

        const body = await response.json().catch(() => null);

        if (controller.signal.aborted || controladores.get(url) !== controller) {
          const abortado = new Error('Petición cancelada');
          abortado.name = 'AbortError';
          throw abortado;
        }

        if (!response.ok) {
          throw errorHttp(response, body);
        }

        cache.set(url, body);
        return body;
      })
      .catch((error) => {
        if (error.name === 'AbortError') throw error;
        if (error.name === 'HttpError') throw error;
        throw errorDeRed();
      })
  ).finally(() => {
    if (controladores.get(url) === controller) controladores.delete(url);
    if (enCurso.get(url) === promesa) enCurso.delete(url);
  });

  enCurso.set(url, promesa);
  return promesa;
}

export function getCategorias({ force = false } = {}) {
  return getJson('/api/categories', { force });
}

export function getLibros(genre, { force = false } = {}) {
  const url = urlLibros(genre);

  if (urlLibrosActiva && urlLibrosActiva !== url) {
    cancelar(urlLibrosActiva);
  }
  urlLibrosActiva = url;

  return getJson(url, { force });
}
