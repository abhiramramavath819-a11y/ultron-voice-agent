import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Orders } from './pages/Orders';
import { Suppliers } from './pages/Suppliers';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/warehouses" element={<div className="p-6 text-muted-foreground">Warehouses module coming soon.</div>} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
