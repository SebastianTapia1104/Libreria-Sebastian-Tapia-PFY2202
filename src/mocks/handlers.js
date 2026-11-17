import { http, HttpResponse, delay } from 'msw';
import { basePublica } from '../api/catalogo';

const categorias = [
  {
    id: 'ficcion',
    name: 'Ficción',
    slug: 'Ficcion',
    description: 'Novelas y relatos de narrativa clásica y contemporánea.',
  },
  {
    id: 'ciencia-ficcion',
    name: 'Ciencia Ficción',
    slug: 'CienciaFiccion',
    description: 'Futuros, tecnología y otros mundos.',
  },
  {
    id: 'misterio',
    name: 'Misterio',
    slug: 'Misterio',
    description: 'Enigmas, crímenes e investigaciones.',
  },
  {
    id: 'drama',
    name: 'Drama',
    slug: 'Drama',
    description: 'Historias centradas en el conflicto humano.',
  },
  {
    id: 'terror',
    name: 'Terror',
    slug: 'Terror',
    description: 'Relatos de miedo y suspenso.',
  },
];

const librosPorGenero = {
  Ficcion: [
    { id: 'fic-1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', price: '$12.990' },
    { id: 'fic-2', title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', price: '$14.990' },
    { id: 'fic-3', title: 'La casa de los espíritus', author: 'Isabel Allende', price: '$13.490' },
  ],
  CienciaFiccion: [
    { id: 'cf-1', title: 'Dune', author: 'Frank Herbert', price: '$15.990' },
    { id: 'cf-2', title: 'Neuromante', author: 'William Gibson', price: '$12.990' },
    { id: 'cf-3', title: 'Fahrenheit 451', author: 'Ray Bradbury', price: '$11.990' },
  ],
  Misterio: [
    { id: 'mi-1', title: 'El nombre de la rosa', author: 'Umberto Eco', price: '$14.990' },
    { id: 'mi-2', title: 'Los crímenes de la calle Morgue', author: 'Edgar Allan Poe', price: '$9.990' },
    { id: 'mi-3', title: 'El código Da Vinci', author: 'Dan Brown', price: '$10.990' },
  ],
  // Respuesta 200 vacía: el frontend muestra el estado sin libros y ofrece otras categorías.
  Drama: [],
};

function alternativasDe(exceptoSlug) {
  return categorias
    .filter((categoria) => categoria.slug !== exceptoSlug)
    .map(({ slug, name }) => ({ slug, name }));
}

export const handlers = [
  http.get(`${basePublica()}/api/categories`, async () => {
    await delay(800);
    return HttpResponse.json(categorias);
  }),

  http.get(`${basePublica()}/api/books`, async ({ request }) => {
    await delay(1000);

    const genre = new URL(request.url).searchParams.get('genre');

    if (!genre) {
      return HttpResponse.json(
        { message: 'Debes indicar un género para consultar el catálogo.' },
        { status: 400 }
      );
    }

    // Terror siempre responde 500 para poder revisar el mensaje, el reintento y las alternativas.
    if (genre === 'Terror') {
      return HttpResponse.json(
        {
          message: 'No pudimos consultar los libros de Terror. El servicio respondió con un error interno.',
          alternativas: alternativasDe('Terror'),
        },
        { status: 500 }
      );
    }

    if (!Object.prototype.hasOwnProperty.call(librosPorGenero, genre)) {
      return HttpResponse.json(
        {
          message: `No existe la categoría "${genre}".`,
          alternativas: alternativasDe(genre),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(librosPorGenero[genre]);
  }),
];
