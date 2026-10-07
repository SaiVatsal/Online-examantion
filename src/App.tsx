import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ExamLayout } from './layouts/ExamLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { StudentsManagementPage } from './pages/admin/StudentsManagementPage';
import { InstructorsManagementPage } from './pages/admin/InstructorsManagementPage';
import { QuestionBankPage } from './pages/questions/QuestionBankPage';
import { ExamsListPage } from './pages/exams/ExamsListPage';
import { ExamBuilderPage } from './pages/exams/ExamBuilderPage';
import { ExamResultsListPage } from './pages/results/ExamResultsListPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Instructor Pages
import { InstructorDashboardPage } from './pages/instructor/InstructorDashboardPage';
import { EssayGradingPage } from './pages/instructor/EssayGradingPage';

// Student Pages
import { AvailableExamsPage } from './pages/student/AvailableExamsPage';
import { ExamInstructionsPage } from './pages/student/ExamInstructionsPage';
import { ExamInterfacePage } from './pages/student/ExamInterfacePage';
import { StudentResultsListPage } from './pages/student/StudentResultsListPage';
import { StudentResultPage } from './pages/results/StudentResultPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Root redirect handler based on current user role
const RootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  if (currentUser.role === 'instructor') return <Navigate to="/instructor" replace />;
  return <Navigate to="/student/exams" replace />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* ADMIN ROUTES */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="students" element={<StudentsManagementPage />} />
              <Route path="instructors" element={<InstructorsManagementPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="exams" element={<ExamsListPage />} />
              <Route path="exams/create" element={<ExamBuilderPage />} />
              <Route path="exams/:id/edit" element={<ExamBuilderPage />} />
              <Route path="results" element={<ExamResultsListPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* INSTRUCTOR ROUTES */}
            <Route
              path="/instructor"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InstructorDashboardPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="exams" element={<ExamsListPage />} />
              <Route path="exams/create" element={<ExamBuilderPage />} />
              <Route path="exams/:id/edit" element={<ExamBuilderPage />} />
              <Route path="grading" element={<EssayGradingPage />} />
              <Route path="results" element={<ExamResultsListPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* STUDENT ROUTES */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'instructor']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="exams" element={<AvailableExamsPage />} />
              <Route path="exam/:id/instructions" element={<ExamInstructionsPage />} />
              <Route path="results" element={<StudentResultsListPage />} />
              <Route path="results/:id" element={<StudentResultPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
            </Route>

            {/* STANDALONE LIVE PROCTORED EXAM HALL */}
            <Route
              path="/student/exam/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'instructor']}>
                  <ExamLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ExamInterfacePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
