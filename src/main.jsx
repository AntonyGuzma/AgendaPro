import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Importação global do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  // permite que você encontre bugs comuns em seus 
  // componentes logo no início do desenvolvimento.
  <StrictMode>
      <App />
  </StrictMode>,
)
