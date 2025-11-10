// C:\Users\Jose-Julian\Desktop\wombo\web\src\App.jsx
import { Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import TopBar from './components/TopBar.jsx';

// FASE 1
import Cliente from './pages/envio/fase1/Cliente.jsx';
import Agencia from './pages/envio/fase1/Agencia.jsx';
import Pedido from './pages/envio/fase1/Pedido.jsx';
import Abono from './pages/envio/fase1/Abono.jsx';
import Enviar from './pages/envio/fase1/Enviar.jsx';

// FASE 2
import Embalado from './pages/envio/fase2/Embalado.jsx';
import Imprimir from './pages/envio/fase2/Imprimir.jsx';
import EditarPedido from './pages/envio/fase2/editar/EditarPedido.jsx';


// FASE 3
import Enviados from './pages/envio/fase3/Enviados.jsx';

// FASE 4
import Todo from './pages/envio/fase4/Todo.jsx';

// Auth
import Login from './pages/Login.jsx';

// Admin
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx';
import AdminAgencias from './pages/admin/AdminAgencias.jsx';

import { getSession } from './utils/user.js';



function Home() {
  return (
    <main className="container">
      <section className="grid">
        <Link to="/envio" className="card">Gestión de envíos</Link>
        <Link to="/admin" className="card">Administrador</Link>
      </section>
    </main>
  );
}

function EnvioIndex() {
  return (
    <main className="container">
      <section className="grid">
        <Link to="/envio/fase1/cliente" className="card">Fase 1 (Registro)</Link>
        <Link to="/envio/fase2/embalar" className="card">Fase 2 (Embalado)</Link>
        <Link to="/envio/fase3/enviados" className="card">Fase 3 (Enviados)</Link>
        <Link to="/envio/fase4/todo" className="card">Fase 4 (Todo)</Link>
      </section>
    </main>
  );
}

// ---- PROTECCIONES BÁSICAS (sin estilos nuevos) ----
function RequireAuth({ children }) {
  const ses = getSession();
  if (!ses || !ses.usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAdmin() {
  const ses = getSession();
  if (!ses || ses.rol !== 'ADMIN') {
    return (
      <main className="container">
        <div className="card">Acceso denegado. Solo ADMIN.</div>
      </main>
    );
  }
  return <Outlet />;
}

export default function App() {
  return (
    <>
      <TopBar />

      <Routes>
        {/* PÚBLICO */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* OPERACIÓN / ENVÍO (requiere login) */}
        <Route
          path="/envio"
          element={
            <RequireAuth>
              <EnvioIndex />
            </RequireAuth>
          }
        />

        <Route
          path="/envio/fase1/cliente"
          element={
            <RequireAuth>
              <Cliente />
            </RequireAuth>
          }
        />
        <Route
          path="/envio/fase1/agencia"
          element={
            <RequireAuth>
              <Agencia />
            </RequireAuth>
          }
        />
        <Route
          path="/envio/fase1/pedido"
          element={
            <RequireAuth>
              <Pedido />
            </RequireAuth>
          }
        />
        <Route
          path="/envio/fase1/abono"
          element={
            <RequireAuth>
              <Abono />
            </RequireAuth>
          }
        />
        <Route
          path="/envio/fase1/enviar"
          element={
            <RequireAuth>
              <Enviar />
            </RequireAuth>
          }
        />

        {/* FASE 2 */}
        <Route
          path="/envio/fase2/embalar"
          element={
            <RequireAuth>
              <Embalado />
            </RequireAuth>
          }
        />
        <Route path="/envio/fase2/editar/:id" element={<EditarPedido />} />
        <Route
          path="/envio/fase2/imprimir/:id"
          element={
            <RequireAuth>
              <Imprimir />
            </RequireAuth>
          }
        />

        {/* FASE 3 */}
        <Route
          path="/envio/fase3/enviados"
          element={
            <RequireAuth>
              <Enviados />
            </RequireAuth>
          }
        />

        {/* FASE 4 */}
        <Route
          path="/envio/fase4/todo"
          element={
            <RequireAuth>
              <Todo />
            </RequireAuth>
          }
        />

        {/* ADMIN (con layout y protección) */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="agencias" element={<AdminAgencias />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
  
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ Service Worker registrado'))
      .catch(err => console.error('❌ Error registrando SW', err));
  });
}

