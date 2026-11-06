import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Award } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-6 sm:px-6 lg:px-8">
      {/* Top Contributor & Candidates Banner */}
      <div className="max-w-xl mx-auto w-full mb-4 px-4">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-2 px-4 rounded-xl shadow-md flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Award className="h-4 w-4 text-amber-300" />
            <span>Portal Candidates:</span>
            <span className="font-bold underline decoration-amber-300 decoration-2">
              V Surendra (2500040073)
            </span>
            <span>&</span>
            <span className="font-bold underline decoration-amber-300 decoration-2">
              K Dileep Kumar (2500040145)
            </span>
          </div>
          <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
            KL University
          </span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
            E
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">ExamFlow</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Enterprise Online Examination & Evaluation Platform
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-7 px-6 shadow-sm border border-border sm:rounded-xl sm:px-8">
          <Outlet />
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Encrypted Session • JWT Token Engine • Anti-SQLi Shield Active</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            Engineered by <strong className="text-foreground">V Surendra</strong> (2500040073) &{' '}
            <strong className="text-foreground">K Dileep Kumar</strong> (2500040145)
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} ExamFlow Assessment System. All rights reserved.
      </div>
    </div>
  );
};
