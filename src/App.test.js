import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getCategorias, getLibros } from './api/catalogo';

jest.mock('./api/catalogo', () => ({
  getCategorias: jest.fn(),
  getLibros: jest.fn(),
  leerCache: jest.fn(() => null),
  suscribirCarga: jest.fn((oyente) => {
    oyente(0);
    return () => {};
  }),
  urlCategorias: '/api/categories',
  urlLibros: jest.fn((genre) => `/api/books?genre=${encodeURIComponent(genre)}`),
}));

const categorias = [
  { id: 'ficcion', name: 'Ficción', slug: 'Ficcion', description: 'Narrativa clásica y contemporánea.' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', slug: 'CienciaFiccion', description: 'Futuros y otros mundos.' },
  { id: 'terror', name: 'Terror', slug: 'Terror', description: 'Relatos de miedo.' },
];

beforeEach(() => {
  window.history.pushState({}, '', '/');
  getCategorias.mockResolvedValue(categorias);
  getLibros.mockResolvedValue([]);
});

test('muestra el título y las categorías del catálogo', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Tienda de Libros' })).toBeInTheDocument();
  expect((await screen.findAllByRole('link', { name: 'Ficción' })).length).toBeGreaterThan(0);
  expect(screen.getByText('Narrativa clásica y contemporánea.')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText('Cargando categorías...')).not.toBeInTheDocument();
  });
});

test('muestra los libros al elegir una categoría', async () => {
  getLibros.mockResolvedValue([
    { id: 'dune', title: 'Dune', author: 'Frank Herbert', price: '$15.990' },
  ]);

  render(<App />);
  const enlaces = await screen.findAllByRole('link', { name: 'Ciencia Ficción' });
  await userEvent.click(enlaces[0]);

  expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
  expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
  expect(screen.getByText('$15.990')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText('Cargando libros...')).not.toBeInTheDocument();
  });
});

test('ofrece reintento y otra categoría cuando el servicio falla', async () => {
  getLibros.mockRejectedValue(Object.assign(
    new Error('No pudimos consultar los libros de Terror. El servicio respondió con un error interno.'),
    {
      name: 'HttpError',
      status: 500,
      alternativas: [{ slug: 'Ficcion', name: 'Ficción' }],
    }
  ));

  render(<App />);
  const enlaces = await screen.findAllByRole('link', { name: 'Terror' });
  await userEvent.click(enlaces[0]);

  expect(await screen.findByRole('heading', { name: 'El servicio no pudo completar la consulta' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Ficción' }).length).toBeGreaterThan(0);
});

test('ofrece reintentar cuando las categorías no cargan', async () => {
  getCategorias.mockRejectedValue(Object.assign(
    new Error('El servicio tuvo un problema al responder.'),
    { name: 'HttpError', status: 500, alternativas: [] }
  ));

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'El servicio no pudo completar la consulta' })).toBeInTheDocument();
  expect(screen.getByText('No se pudieron cargar los géneros.')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Reintentar' }).length).toBeGreaterThan(0);
});
