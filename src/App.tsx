import { BrowserRouter, Route, Routes } from 'react-router'

import { AppLayout } from './components/layout/AppLayout'
import { Alertas } from './pages/Alertas'
import { Compras } from './pages/Compras'
import { Dashboard } from './pages/Dashboard'
import { Estoque } from './pages/Estoque'
import { Fornecedores } from './pages/Fornecedores'
import { Produtos } from './pages/Produtos'
import { Vendas } from './pages/Vendas'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/alertas" element={<Alertas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App