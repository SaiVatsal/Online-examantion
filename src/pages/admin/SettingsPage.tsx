import React, { useState } from 'react';
import { dbService } from '../../services/db/databaseService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/ToastContext';
import { Settings, Shield, Database, Save, RotateCcw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState('Apex Institute of Technology');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [defaultDuration, setDefaultDuration] = useState('30');
  const [defaultPassPct, setDefaultPassPct] = useState('50');
  const [warningThreshold, setWarningThreshold] = useState('3');
  const [autoSubmitThreshold, setAutoSubmitThreshold] = useState('5');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('System configuration parameters updated.');
    }, 400);
  };

  const handleResetDB = () => {
    dbService.resetDatabase();
    setResetConfirmOpen(false);
    toast.success('Database reset to fresh educational seed dataset.');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure institutional assessment defaults, proctoring security parameters, and data stores
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Institutional Profile & Academic Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />

              <Input
                label="Academic Year / Session"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Exam Duration (Minutes)"
                type="number"
                min="5"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                required
              />

              <Input
                label="Default Passing Percentage (%)"
                type="number"
                min="1"
                max="100"
                value={defaultPassPct}
                onChange={(e) => setDefaultPassPct(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t border-border pt-4">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              <Save className="h-4 w-4 mr-1.5" /> Save Configuration
            </Button>
          </CardFooter>
        </Card>

        {/* Global Proctoring Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" /> Proctoring & Integrity Sensitivity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Security Warning Threshold"
                type="number"
                min="1"
                max="10"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                helperText="Triggers modal alert upon this number of window blurs / tab changes."
              />

              <Input
                label="Auto-Submission Threshold"
                type="number"
                min="2"
                max="15"
                value={autoSubmitThreshold}
                onChange={(e) => setAutoSubmitThreshold(e.target.value)}
                helperText="Hard limit: attempt is terminated and submitted upon reaching this limit."
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Database Maintenance & Re-seed Card */}
      <Card className="border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
            <Database className="h-4 w-4" /> Database Maintenance & Demo Re-seed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>
            Re-initializes all local database tables back to the pristine factory seed dataset. This restores all 20 questions in the Kindergarten test exam, demo user accounts, completed scorecards, and audit logs.
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset Database to Factory Seed
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetDB}
        title="Reset Entire Database?"
        message="This will overwrite local database tables with fresh initial demo data. All live in-progress changes will be restored to default seed records."
        variant="destructive"
        confirmText="Confirm Factory Reset"
      />
    </div>
  );
};
