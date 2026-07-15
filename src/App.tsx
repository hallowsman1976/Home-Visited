import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { VisitsPage } from './pages/VisitsPage';
import { VisitWizardPage } from './pages/VisitWizardPage';
import { CareContinuityPage } from './pages/CareContinuityPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SystemDiagnosticsPage } from './pages/SystemDiagnosticsPage';

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  { element: <ProtectedRoute />, children: [
    { path: '/change-password', element: <ChangePasswordPage /> },
    { path: '/', element: <AppShell />, children: [
    { index: true, element: <DashboardPage /> },
    { path: 'patients', element: <PatientsPage /> },
    { path: 'patients/:id', element: <PatientDetailPage /> },
    { path: 'patients/:id/care', element: <CareContinuityPage /> },
    { path: 'patients/:id/documents', element: <DocumentsPage /> },
    { path: 'visits', element: <VisitsPage /> },
    { path: 'visits/new', element: <VisitWizardPage /> },
    { path: 'visits/:id/edit', element: <VisitWizardPage /> },
    { path: 'follow-ups', element: <FollowUpsPage /> },
    { path: 'reports', element: <ReportsPage /> },
    { path: 'settings', element: <SystemDiagnosticsPage /> },
  ]}]},
]);

export default function App() { return <AuthProvider><RouterProvider router={router} /></AuthProvider>; }
