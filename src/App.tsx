import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router'

import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { Alertas } from './pages/Alertas'
import { AmazonFBA } from './pages/AmazonFBA'
import { Compras } from './pages/Compras'
import { ConciliacaoOlistAmazon } from './pages/ConciliacaoOlistAmazon'
import { ConciliacaoOlistPrimelyEstoque } from './pages/ConciliacaoOlistPrimelyEstoque'
import { Dashboard } from './pages/Dashboard'
import { Estoque } from './pages/Estoque'
import { Fornecedores } from './pages/Fornecedores'
import { Login } from './pages/Login'
import { Lotes } from './pages/Lotes'
import { Movimentacoes } from './pages/Movimentacoes'
import { Produtos } from './pages/Produtos'
import { Vendas } from './pages/Vendas'

function RotaProtegida() {
  const { autenticado, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Primely Store
          </p>

          <h1 className="mt-4 text-2xl font-bold">
            Verificando sessão...
          </h1>

          <p className="mt-3 text-slate-400">
            Aguarde enquanto validamos seu acesso.
          </p>
        </div>
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/amazon-fba" element={<AmazonFBA />} />
          <Route
            path="/conciliacao-olist-amazon"
            element={<ConciliacaoOlistAmazon />}
          />
          <Route
            path="/conciliacao-olist-primely-estoque"
            element={<ConciliacaoOlistPrimelyEstoque />}
          />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/movimentacoes" element={<Movimentacoes />} />
          <Route path="/alertas" element={<Alertas />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
