import React from 'react';
import { Outlet } from 'react-router-dom';

export const ExamLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col select-none">
      <Outlet />
    </div>
  );
};
