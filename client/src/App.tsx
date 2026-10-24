import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { AlertsPage } from './pages/AlertsPage'
import { AuthCallback } from './pages/AuthCallback'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { RendezvousPage } from './pages/RendezvousPage'
import { SearchPage } from './pages/SearchPage'
import { SearchResultsPage } from './pages/SearchResultsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<SearchPage />} />
          <Route path="search-results" element={<SearchResultsPage />} />
          <Route path="rendezvous" element={<RendezvousPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
