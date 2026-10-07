import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db/databaseService';
import { ExamResult, SecurityEvent } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/ToastContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const StudentProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setPhone(currentUser.phone || '');
      loadStudentData();
    }
  }, [currentUser]);

  const loadStudentData = async () => {
    if (!currentUser) return;
    const res = await dbService.getExamResults({ studentId: currentUser.id });
    setResults(res);
    const sec = await dbService.getSecurityEvents();
    setSecurityEvents(sec.filter((s) => s.studentId === currentUser.id));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await dbService.updateProfile(currentUser.id, { fullName, phone });
      toast.success('Your profile details have been updated.', 'Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = results.length;
  const passedCount = results.filter((r) => r.isPassed).length;
  const avgScore =
    completedCount > 0
      ? Math.round((results.reduce((acc, r) => acc + r.percentage, 0) / completedCount) * 10) / 10
      : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your examinee credentials, contact details, and institutional standing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Summary Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold mb-3 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                currentUser?.fullName.charAt(0)
              )}
            </div>
            <h3 className="font-semibold text-base text-foreground">{currentUser?.fullName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{currentUser?.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="default" size="sm">
                {currentUser?.registrationNumber || 'STU-REG'}
              </Badge>
              <Badge variant={currentUser?.isActive ? 'success' : 'destructive'} size="sm">
                {currentUser?.isActive ? 'Active Examinee' : 'Suspended'}
              </Badge>
            </div>

            <div className="w-full border-t border-border mt-6 pt-4 space-y-3 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Joined Date</span>
                <span className="font-medium text-foreground">{formatDate(currentUser?.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proctoring Status</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Edit Details & Academic Stats */}
        <div className="md:col-span-2 space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold text-foreground">{completedCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                  <p className="text-lg font-bold text-foreground">{passedCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Score</p>
                  <p className="text-lg font-bold text-foreground">{avgScore}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                    required
                  />

                  <Input
                    label="Email Address (Locked)"
                    value={currentUser?.email || ''}
                    leftIcon={<Mail className="h-4 w-4" />}
                    disabled
                    helperText="Institutional email cannot be edited directly."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    leftIcon={<Phone className="h-4 w-4" />}
                  />

                  <Input
                    label="Registration Number"
                    value={currentUser?.registrationNumber || 'STU-001'}
                    disabled
                    helperText="Assigned by institution registrar."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Log Summary for this Student */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Security & Proctoring Records</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {securityEvents.length} recorded events
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No security incidents or proctoring warnings on record.
                </p>
              ) : (
                <div className="space-y-2">
                  {securityEvents.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded bg-muted/40 text-xs border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <div>
                          <span className="font-semibold capitalize text-foreground">
                            {ev.eventType.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground ml-2">{ev.details}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
