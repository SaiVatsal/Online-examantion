import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-xs">
            E
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">ExamFlow</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Enterprise Online Examination & Evaluation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 shadow-sm border border-border sm:rounded-lg sm:px-10">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Encrypted Session • Server-Authoritative Proctoring Active</span>
        </div>
      </div>
    </div>
  );
};
