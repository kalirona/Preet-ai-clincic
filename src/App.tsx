/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AITools = lazy(() => import('./pages/AITools'));
const Clients = lazy(() => import('./pages/Clients'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Automations = lazy(() => import('./pages/Automations'));
const Billing = lazy(() => import('./pages/Billing'));
const Settings = lazy(() => import('./pages/Settings'));
const BookPublic = lazy(() => import('./pages/BookPublic'));
const Agents = lazy(() => import('./pages/Agents'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Forms = lazy(() => import('./pages/Forms'));
const FormResponses = lazy(() => import('./pages/FormResponses'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
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
              <Route path="agents" element={<Agents />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="forms" element={<Forms />} />
              <Route path="forms/:id/responses" element={<FormResponses />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </Router>
    </TooltipProvider>
  );
}
