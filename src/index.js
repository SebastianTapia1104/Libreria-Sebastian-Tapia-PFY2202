import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

async function enableMocking() {
  const { worker } = await import('./mocks/browser')

  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${process.env.PUBLIC_URL}/mockServiceWorker.js`,
    },
  })
}

enableMocking().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})

reportWebVitals();
