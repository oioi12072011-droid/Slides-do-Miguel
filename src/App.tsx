import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { AdminLogin } from './pages/AdminLogin';
import { TeamLogin } from './pages/TeamLogin';
import { VisualEditor } from './pages/Editor';
import { Viewer } from './pages/Viewer';
import { FullscreenPresentation } from './pages/FullscreenPresentation';
import { Settings } from './pages/Settings';
import { MySlides } from './pages/MySlides';
import { Assets } from './pages/Assets';
import { Teams } from './pages/Teams';
import { PresentationProvider } from './contexts/PresentationContext';
import { TeamsProvider } from './contexts/TeamsContext';
import { AssetsProvider } from './contexts/AssetsContext';
import { ModalProvider } from './contexts/ModalContext';
import { UIPreferencesProvider } from './contexts/UIPreferencesContext';
import { PremiumModal } from './components/PremiumModal';
import { GlobalUIElements } from './components/GlobalUIElements';

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-bg-primary">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UIPreferencesProvider>
          <ModalProvider>
            <PresentationProvider>
              <TeamsProvider>
                <AssetsProvider>
                  <Router>
                    <GlobalUIElements />
                    <Routes>

                      <Route path="/" element={<Home />} />
                      <Route path="/presentation/:id" element={<Viewer />} />
                      <Route path="/present/:id" element={<FullscreenPresentation />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/access" element={<TeamLogin />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route
                        path="/my-slides"
                        element={<RoleProtectedRoute allowedRoles={['admin', 'editor']}><MySlides /></RoleProtectedRoute>}
                      />
                      <Route
                        path="/assets"
                        element={<RoleProtectedRoute allowedRoles={['admin', 'editor']}><Assets /></RoleProtectedRoute>}
                      />
                      <Route
                        path="/projects"
                        element={<RoleProtectedRoute allowedRoles={['admin', 'editor']}><MySlides /></RoleProtectedRoute>}
                      />
                      <Route
                        path="/favorites"
                        element={<RoleProtectedRoute allowedRoles={['admin', 'editor']}><Assets /></RoleProtectedRoute>}
                      />
                      <Route
                        path="/editor/:id"
                        element={
                          <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                            <VisualEditor />
                          </RoleProtectedRoute>
                        }
                      />
                      <Route
                        path="/teams"
                        element={<RoleProtectedRoute allowedRoles={['admin']}><Teams /></RoleProtectedRoute>}
                      />
                      <Route
                        path="/admin/settings"
                        element={
                          <RoleProtectedRoute allowedRoles={['admin']}>
                            <Settings />
                          </RoleProtectedRoute>
                        }
                      />
                      <Route path="/category/:id" element={<Home />} />
                    </Routes>
                  </Router>
                  <PremiumModal />
                </AssetsProvider>
              </TeamsProvider>
            </PresentationProvider>
          </ModalProvider>
        </UIPreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
