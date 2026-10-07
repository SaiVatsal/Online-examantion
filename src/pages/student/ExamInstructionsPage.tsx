import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { Exam, Subject } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/ToastContext';
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Award,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Play,
  Maximize2,
  EyeOff,
  Lock,
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

export const ExamInstructionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (id) loadExam();
  }, [id]);

  const loadExam = async () => {
    setIsLoading(true);
    try {
      const examData = await dbService.getExamById(id!, true);
      if (!examData) {
        toast.error('Exam not found');
        navigate('/student/exams');
        return;
      }
      setExam(examData);
      setQuestionCount(examData.examQuestions?.length || 0);

      if (examData.subjectId) {
        const subs = await dbService.getSubjects();
        const sub = subs.find((s) => s.id === examData.subjectId);
        setSubject(sub || null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load examination instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!hasAgreed) {
      toast.warning('You must agree to the examination terms before starting.');
      return;
    }
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen entry will be locked on exam load', e);
    }
    navigate(`/student/exam/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading examination instructions...</p>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation header */}
      <div className="flex items-center gap-3">
        <Link to="/student/exams">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Pre-Examination Briefing
            </span>
            {subject && <Badge variant="secondary" size="sm">{subject.name}</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{exam.title}</h1>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Duration</p>
              <p className="text-sm font-bold text-foreground">
                {formatDuration(exam.durationMinutes)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Questions</p>
              <p className="text-sm font-bold text-foreground">{questionCount} Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total Score</p>
              <p className="text-sm font-bold text-foreground">{exam.totalMarks} Marks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Passing Rate</p>
              <p className="text-sm font-bold text-foreground">{exam.passPercentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Proctoring Checklist */}
      <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Shield className="h-4 w-4 text-amber-600" /> Proctoring & Integrity Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5">
              <Maximize2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Fullscreen Enforcement</span>
                <p className="text-[11px] text-muted-foreground">
                  The examination will run in fullscreen mode. Exiting fullscreen triggers a logged violation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <EyeOff className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Tab & Focus Detection</span>
                <p className="text-[11px] text-muted-foreground">
                  Switching tabs or losing window focus is detected in real time and recorded.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Clipboard Restrictions</span>
                <p className="text-[11px] text-muted-foreground">
                  Right-click context menus, text copy, and external pasting are disabled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Violation Threshold</span>
                <p className="text-[11px] text-muted-foreground">
                  Exceeding {exam.securitySettings?.autoSubmitThreshold || 5} logged violations triggers automatic submission.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specific Instructions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Candidate Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-md bg-muted/40 text-xs font-mono whitespace-pre-line leading-relaxed text-foreground">
            {exam.instructions || 'Standard institutional examination procedures apply.'}
          </div>

          <div className="space-y-2 text-xs text-muted-foreground pt-2">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Autosave:</strong> Every choice is securely synchronized to the server immediately.
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Disconnect Recovery:</strong> If your network drops or page reloads, your timer and saved answers will resume.
              </span>
            </p>
            {exam.rules.negativeMarking && (
              <p className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>Negative Marking:</strong> Penalty marks will be deducted for incorrect answers.
                </span>
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="h-4 w-4 rounded text-primary"
            />
            <span>I have read, understood, and agree to abide by the examination rules.</span>
          </label>

          <Button
            variant="primary"
            size="md"
            disabled={!hasAgreed}
            onClick={handleStartExam}
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Launch Examination Hall
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
