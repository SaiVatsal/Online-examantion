import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HelpCircle,
  FileSpreadsheet,
  CheckSquare,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Settings,
  LogOut,
  Menu,
  X,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DashboardLayout: React.FC = () => {
  const { currentUser, logout, isAdmin, isInstructor, openJwtModal, jwtToken } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Define navigation items based on user role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Students', path: '/admin/students', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Instructors', path: '/admin/instructors', icon: <Users className="h-4 w-4" /> },
        { label: 'Question Bank', path: '/admin/questions', icon: <HelpCircle className="h-4 w-4" /> },
        { label: 'Examinations', path: '/admin/exams', icon: <FileSpreadsheet className="h-4 w-4" /> },
        { label: 'Results', path: '/admin/results', icon: <CheckSquare className="h-4 w-4" /> },
        { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldAlert className="h-4 w-4" /> },
        { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
      ];
    }

    if (isInstructor) {
      return [
        { label: 'Dashboard', path: '/instructor', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Question Bank', path: '/instructor/questions', icon: <HelpCircle className="h-4 w-4" /> },
        { label: 'My Exams', path: '/instructor/exams', icon: <FileSpreadsheet className="h-4 w-4" /> },
        { label: 'Essay Grading', path: '/instructor/grading', icon: <FileCheck className="h-4 w-4" /> },
        { label: 'Student Results', path: '/instructor/results', icon: <CheckSquare className="h-4 w-4" /> },
        { label: 'Analytics', path: '/instructor/analytics', icon: <BarChart3 className="h-4 w-4" /> },
      ];
    }

    // Student
    return [
      { label: 'Available Exams', path: '/student/exams', icon: <FileSpreadsheet className="h-4 w-4" /> },
      { label: 'My Results', path: '/student/results', icon: <CheckSquare className="h-4 w-4" /> },
      { label: 'Student Profile', path: '/student/profile', icon: <UserCheck className="h-4 w-4" /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-muted focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Brand Logo */}
            <div
              onClick={() => navigate(isAdmin ? '/admin' : isInstructor ? '/instructor' : '/student/exams')}
              className="flex items-center space-x-2.5 cursor-pointer"
            >
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight leading-tight text-foreground">
                  ExamFlow
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Assessment Platform
                </span>
              </div>
            </div>
          </div>

          {/* Center Attribution Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-full text-xs">
            <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-muted-foreground">Candidates:</span>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              V Surendra (2500040073)
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              K Dileep Kumar (2500040145)
            </span>
          </div>

          {/* Right actions: Security badges & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Anti-SQLi Shield indicator */}
            <div className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>SQLi Protected</span>
            </div>

            {/* JWT Token Button */}
            <button
              onClick={openJwtModal}
              className="px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inspect Active JWT Token"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">JWT Token</span>
              <span className={`h-1.5 w-1.5 rounded-full ${jwtToken ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            </button>

            {/* User Profile Pill */}
            {currentUser && (
              <div className="flex items-center space-x-3 border-l border-border pl-3 sm:pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-foreground leading-none">{currentUser.fullName}</p>
                  <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                    {currentUser.role} {currentUser.registrationNumber ? `(${currentUser.registrationNumber})` : ''}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-full w-full object-cover" />
                  ) : (
                    currentUser.fullName.charAt(0)
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Sign Out"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </span>
              <Badge variant={isAdmin ? 'default' : isInstructor ? 'warning' : 'success'} size="sm">
                {currentUser?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/instructor'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer with Credits */}
          <div className="p-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
            <div className="text-[11px] text-muted-foreground">
              <p className="font-semibold text-foreground">Project Contributors:</p>
              <p>• V Surendra (2500040073)</p>
              <p>• K Dileep Kumar (2500040145)</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              <ShieldCheck className="h-3 w-3" />
              <span>JWT & SQLi Shield Active</span>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-card border-r border-border flex flex-col p-4 shadow-xl z-10">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="font-semibold text-foreground">ExamFlow</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Contributor info */}
              <div className="py-2 border-b border-border text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground">Candidates:</p>
                <p>V Surendra (2500040073)</p>
                <p>K Dileep Kumar (2500040145)</p>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin' || item.path === '/instructor'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openJwtModal();
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2 text-primary" />
                  Inspect JWT Token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            <Outlet />
          </div>

          {/* Footer bar */}
          <footer className="mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
            <div>
              &copy; {new Date().getFullYear()} ExamFlow Assessment System. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Candidates:</span>
              <span>V Surendra (2500040073) & K Dileep Kumar (2500040145)</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
