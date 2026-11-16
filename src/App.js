import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useParams } from 'react-router-dom';
import { getCategorias, getLibros, leerCache, suscribirCarga, urlLibros } from './api/catalogo';
import './App.css';

function App() {
  const categoriasEstado = useCategorias();
  const [busqueda, setBusqueda] = useState('');

  return (
    <Router basename={process.env.PUBLIC_URL || ''}>
      <div className="App">
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        <p className="aviso">Retiro en tienda y despacho a todo Chile</p>
        <header className="cabecera">
          <Link to="/" className="marca">
            <span className="logo-marco">
              <img className="logo" src={`${process.env.PUBLIC_URL}/logo-machapa.jpg`} alt="" />
            </span>
            <span>
              <span className="marca-linea">Libreria Machapa</span>
              <h1>Tienda de Libros</h1>
            </span>
          </Link>

          <form className="busqueda" role="search" onSubmit={(evento) => evento.preventDefault()}>
            <label className="sr-only" htmlFor="busqueda">Búsqueda</label>
            <input
              id="busqueda"
              type="search"
              placeholder="Búsqueda"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
            <IconoBuscar />
          </form>

          <div className="iconos" aria-hidden="true">
            <IconoBolsa />
          </div>
        </header>

        <MenuGeneros {...categoriasEstado} />
        <IndicadorCarga />

        <main className="principal" id="contenido">
          <Routes>
            <Route path="/" element={<Inicio {...categoriasEstado} busqueda={busqueda} />} />
            <Route path="/genre/:genre" element={<RutaLibros categorias={categoriasEstado.categorias} busqueda={busqueda} />} />
            <Route path="*" element={<NoEncontrada />} />
          </Routes>
        </main>

        <footer>
          <div className="pie">
            <strong>Libreria Machapa</strong>
            <p>Explora el catálogo por categoría.</p>
          </div>
          <p>© 2026 Tienda de Libros</p>
        </footer>
      </div>
    </Router>
  );
}

function useCategorias() {
  const [intento, setIntento] = useState(0);
  const forzarRef = useRef(false);
  const [categorias, setCategorias] = useState(() => leerCache('/api/categories') || []);
  const [cargando, setCargando] = useState(() => !leerCache('/api/categories'));
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    const force = forzarRef.current;
    forzarRef.current = false;
    const enCache = force ? null : leerCache('/api/categories');

    if (enCache) {
      setCategorias(enCache);
      setError(null);
      setCargando(false);
      return undefined;
    }

    setCargando(true);
    setError(null);

    getCategorias({ force })
      .then((data) => {
        if (activo) setCategorias(data);
      })
      .catch((err) => {
        if (activo && err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [intento]);

  function reintentar() {
    forzarRef.current = true;
    setIntento((valor) => valor + 1);
  }

  return { categorias, cargando, error, reintentar };
}

function IndicadorCarga() {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => suscribirCarga(setPendientes), []);

  if (pendientes === 0) return null;

  const texto = pendientes === 1
    ? 'Consultando el catálogo...'
    : `Consultando el catálogo (${pendientes} peticiones)...`;

  return (
    <div className="carga-global" role="status" aria-live="polite">
      <div className="carga-barra" aria-hidden="true" />
      <p className="carga-texto">{texto}</p>
    </div>
  );
}

function MenuGeneros({ categorias, cargando, error, reintentar }) {
  return (
    <nav className="menu" aria-label="Categorías">
      {cargando && (
        <p className="estado" role="status">
          {categorias.length > 0 ? 'Actualizando categorías...' : 'Cargando categorías...'}
        </p>
      )}
      {error && categorias.length === 0 && (
        <div className="alerta alerta-compacta" role="alert">
          <p>No se pudieron cargar los géneros.</p>
          <button type="button" onClick={reintentar}>Reintentar</button>
        </div>
      )}
      {categorias.length > 0 && (
        <ul>
          <li>
            <NavLink to="/" end>Inicio</NavLink>
          </li>
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <NavLink to={`/genre/${categoria.slug}`}>{categoria.name}</NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

function Inicio({ categorias, cargando, error, reintentar, busqueda }) {
  useEffect(() => {
    document.title = 'Tienda de Libros';
  }, []);

  const consulta = busqueda.trim().toLowerCase();
  const visibles = categorias.filter((categoria) => {
    if (!consulta) return true;
    return `${categoria.name} ${categoria.description}`.toLowerCase().includes(consulta);
  });

  return (
    <section aria-busy={cargando}>
      {!consulta && (
        <div className="hero">
          <div>
            <p className="etiqueta">Novedad</p>
            <h2>Cien años de soledad</h2>
            <p className="hero-autor">Gabriel García Márquez</p>
            <Link to="/genre/Ficcion">Ver más</Link>
          </div>
          <div className="hero-portada" aria-hidden="true">
            <span>Cien años de soledad</span>
          </div>
        </div>
      )}

      <h2 className="seccion">Categorías</h2>
      <p className="bajada">Selecciona una categoría para ver los libros disponibles.</p>

      {cargando && categorias.length === 0 && (
        <div className="grilla grilla-categorias" aria-hidden="true">
          <Esqueletos cantidad={5} />
        </div>
      )}

      {!cargando && error && categorias.length === 0 && (
        <PanelError error={error} onRetry={reintentar} />
      )}

      {!cargando && !error && visibles.length === 0 && (
        <p className="vacio">No encontramos resultados para «{busqueda.trim()}».</p>
      )}

      {visibles.length > 0 && (
        <div className="grilla grilla-categorias">
          {visibles.map((categoria) => (
            <Link key={categoria.id} to={`/genre/${categoria.slug}`} className="tarjeta">
              <h3>{categoria.name}</h3>
              <p>{categoria.description}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function RutaLibros({ categorias, busqueda }) {
  const { genre } = useParams();
  return <ListaLibros key={genre} genre={genre} categorias={categorias} busqueda={busqueda} />;
}

function ListaLibros({ genre, categorias, busqueda }) {
  const url = urlLibros(genre);
  const cacheInicial = leerCache(url);
  const [books, setBooks] = useState(cacheInicial || []);
  const [cargando, setCargando] = useState(!cacheInicial);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const forzarRef = useRef(false);
  const categoria = categorias.find((item) => item.slug === genre);
  const nombre = categoria ? categoria.name : genre;

  useEffect(() => {
    document.title = `Libros de ${nombre} · Tienda de Libros`;
  }, [nombre]);

  useEffect(() => {
    let activo = true;
    const force = forzarRef.current;
    forzarRef.current = false;
    const enCache = force ? null : leerCache(url);

    if (!enCache) {
      setCargando(true);
      setError(null);
    }

    getLibros(genre, { force })
      .then((data) => {
        if (!activo) return;
        setBooks(data);
        setError(null);
      })
      .catch((err) => {
        if (!activo || err.name === 'AbortError') return;
        setBooks([]);
        setError(err);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [genre, url, intento]);

  function reintentar() {
    forzarRef.current = true;
    setIntento((valor) => valor + 1);
  }

  const consulta = busqueda.trim().toLowerCase();
  const visibles = books.filter((book) => {
    if (!consulta) return true;
    return `${book.title} ${book.author}`.toLowerCase().includes(consulta);
  });

  return (
    <section aria-busy={cargando}>
      <h2 className="seccion">Libros de {nombre}</h2>
      {categoria && <p className="bajada">{categoria.description}</p>}

      {cargando && (
        <>
          <p className="estado" role="status">Cargando libros...</p>
          <div className="grilla grilla-libros" aria-hidden="true">
            <Esqueletos cantidad={4} tipo="libro" />
          </div>
        </>
      )}

      {!cargando && error && <PanelError error={error} onRetry={reintentar} />}

      {!cargando && !error && books.length === 0 && (
        <div className="vacio">
          <p>No hay libros disponibles para este género.</p>
          <OtrasCategorias categorias={categorias} actual={genre} />
        </div>
      )}

      {!cargando && !error && books.length > 0 && visibles.length === 0 && (
        <p className="vacio">No encontramos resultados para «{busqueda.trim()}».</p>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <div className="grilla grilla-libros">
          {visibles.map((book) => (
            <article key={book.id} className="libro">
              <Portada id={book.id} />
              <h3>{book.title}</h3>
              <p className="autor">{book.author}</p>
              <p className="precio">{book.price}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function OtrasCategorias({ categorias, actual }) {
  const otras = categorias.filter((categoria) => categoria.slug !== actual);
  if (otras.length === 0) return null;

  return (
    <div>
      <p>Puedes continuar con otra categoría:</p>
      <ul className="alternativas">
        {otras.map((categoria) => (
          <li key={categoria.slug}>
            <Link to={`/genre/${categoria.slug}`}>{categoria.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelError({ error, onRetry }) {
  const alternativas = Array.isArray(error.alternativas) ? error.alternativas : [];

  return (
    <div className="alerta" role="alert">
      <h3>{tituloError(error.status)}</h3>
      <p>{error.message}</p>
      <div className="acciones">
        <button type="button" onClick={onRetry}>Reintentar</button>
        <Link to="/">Volver al inicio</Link>
      </div>
      {alternativas.length > 0 && (
        <div>
          <p>Puedes continuar con otra categoría:</p>
          <ul className="alternativas">
            {alternativas.map((alternativa) => (
              <li key={alternativa.slug}>
                <Link to={`/genre/${alternativa.slug}`}>{alternativa.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function tituloError(status) {
  if (status === 404) return 'No encontramos esa categoría';
  if (status === 500) return 'El servicio no pudo completar la consulta';
  if (status === 400) return 'La consulta está incompleta';
  if (status === 0) return 'No pudimos conectar con el catálogo';
  return 'No pudimos cargar la información';
}

function NoEncontrada() {
  return (
    <section className="vacio">
      <h2>Esta página no existe</h2>
      <p>La dirección no corresponde a una sección de la tienda.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}

function Esqueletos({ cantidad, tipo }) {
  return Array.from({ length: cantidad }, (_, indice) => (
    <div className={tipo === 'libro' ? 'esqueleto esqueleto-libro' : 'esqueleto'} key={indice} />
  ));
}

function Portada({ id }) {
  return <div className={`portada tono-${tonoDe(id)}`} aria-hidden="true" />;
}

function tonoDe(id) {
  const texto = String(id);
  let suma = 0;
  for (let indice = 0; indice < texto.length; indice += 1) suma += texto.charCodeAt(indice);
  return suma % 6;
}

function IconoBuscar() {
  return (
    <svg className="icono" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 16.2L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconoBolsa() {
  return (
    <svg className="icono" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8h11l-.8 11H7.3L6.5 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default App;
