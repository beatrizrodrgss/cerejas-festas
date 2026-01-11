import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetails from './pages/ClientDetails';
import Suppliers from './pages/Suppliers';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/items" element={
              <ProtectedRoute>
                <MainLayout>
                  <Items />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/clients" element={
              <ProtectedRoute>
                <MainLayout>
                  <Clients />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/clients/new" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientForm />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/clients/:id" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientDetails />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <MainLayout>
                  <Orders />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/orders/new" element={
              <ProtectedRoute>
                <MainLayout>
                  <OrderForm />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/suppliers" element={
              <ProtectedRoute>
                <MainLayout>
                  <Suppliers />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/finance" element={
              <ProtectedRoute>
                <MainLayout>
                  <Finance />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Redirects for legacy routes if any */}
            <Route path="/catalog" element={<Navigate to="/items" replace />} />
            <Route path="/rentals" element={<Navigate to="/orders" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;