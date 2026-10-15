import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { AlertsPage } from './pages/AlertsPage'
import { RendezvousPage } from './pages/RendezvousPage'
import { SearchPage } from './pages/SearchPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<SearchPage />} />
          <Route path="rendezvous" element={<RendezvousPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
