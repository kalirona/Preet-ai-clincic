/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AITools } from './pages/AITools';
import { Clients } from './pages/Clients';
import { Appointments } from './pages/Appointments';
import { Automations } from './pages/Automations';
import { Billing } from './pages/Billing';
import { Settings } from './pages/Settings';
import BookPublic from './pages/BookPublic';
import { Toaster } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/book/:slug" element={<BookPublic />} />
          <Route path="/book" element={<BookPublic />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="clients" element={<Clients />} />
            <Route path="crm" element={<Navigate to="/clients" replace />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="automations" element={<Automations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </TooltipProvider>
  );
}
