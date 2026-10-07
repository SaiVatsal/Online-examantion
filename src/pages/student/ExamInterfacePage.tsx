import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { Exam, Question, ExamAttempt, AttemptAnswer, SecurityEventType } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/ToastContext';
import {
  Clock,
  Shield,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  AlertTriangle,
  Send,
  Wifi,
  WifiOff,
  Maximize2,
  Check,
} from 'lucide-react';
import { formatTimeRemaining } from '../../lib/utils';

export const ExamInterfacePage: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Core Exam State
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());

  // Timer State (Server-authoritative seconds remaining)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Autosave Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Security, Fullscreen Lock & Disconnection State
  const [isFullscreenLocked, setIsFullscreenLocked] = useState<boolean>(Boolean(document.fullscreenElement));
  const [isDisconnectedForCheating, setIsDisconnectedForCheating] = useState<boolean>(false);
  const [cheatingIncidentDetails, setCheatingIncidentDetails] = useState<string>('');
  const hasArmedProctoring = useRef<boolean>(false);

  // Submit Modal
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // 1. INITIALIZE & RESUME EXAM ATTEMPT
  useEffect(() => {
    if (!examId || !currentUser) return;
    initExam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, currentUser]);

  const initExam = async () => {
    setIsLoading(true);
    try {
      // Start or Resume Attempt from Database Service
      const res = await dbService.startExamAttempt(examId!, currentUser!.id);
      setExam(res.exam);
      setAttempt(res.attempt);
      setQuestions(res.questions);

      // Check if attempt already was disqualified for cheating
      if (
        res.attempt.autoSubmitReason?.includes('Cheating') ||
        res.attempt.autoSubmitReason?.includes('CHEATING') ||
        res.attempt.autoSubmitReason?.includes('Plagiarism') ||
        res.attempt.autoSubmitReason?.includes('DISCONNECTED') ||
        res.attempt.autoSubmitReason?.includes('Tab Switch')
      ) {
        setIsDisconnectedForCheating(true);
        setCheatingIncidentDetails(
          res.attempt.autoSubmitReason || 'Tab switching / Fullscreen exit / Plagiarism detected'
        );
        setIsLoading(false);
        return;
      }

      // Restore existing answers
      const ansMap = new Map<string, AttemptAnswer>();
      res.answers.forEach((ans) => ansMap.set(ans.questionId, ans));
      setAnswers(ansMap);

      // Compute remaining time from SERVER expiresAt
      const serverExpiresAt = new Date(res.attempt.expiresAt).getTime();
      const initialRemaining = Math.max(0, Math.floor((serverExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(initialRemaining);

      if (initialRemaining <= 0) {
        handleFinalSubmit(true, 'Examination time expired');
        return;
      }

      // Check if already in fullscreen or prompt lock
      if (document.fullscreenElement) {
        setIsFullscreenLocked(true);
        setTimeout(() => {
          hasArmedProctoring.current = true;
        }, 1200);
      } else {
        setIsFullscreenLocked(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Unable to launch examination.');
      navigate('/student/exams');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. SERVER-AUTHORITATIVE TIMER COUNTDOWN
  useEffect(() => {
    if (!attempt || isTimeUp) return;

    timerRef.current = setInterval(() => {
      const serverExpiresAt = new Date(attempt.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((serverExpiresAt - Date.now()) / 1000));

      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        setIsTimeUp(true);
        if (timerRef.current) clearInterval(timerRef.current);
        handleFinalSubmit(true, 'Time limit expired');
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, isTimeUp]);

  // 3. IMMEDIATE CHEATING & DISCONNECTION ENGINE
  const triggerImmediateCheatingDisconnect = useCallback(
    async (violationType: SecurityEventType, reason: string) => {
      if (!hasArmedProctoring.current || isDisconnectedForCheating || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsDisconnectedForCheating(true);
      setCheatingIncidentDetails(reason);

      if (timerRef.current) clearInterval(timerRef.current);

      if (attempt && currentUser) {
        try {
          await dbService.submitExamAttempt(
            attempt.id,
            currentUser.id,
            true,
            `EXAM DISCONNECTED: Cheating & Plagiarism Detected (${reason})`
          );
          await dbService.logSecurityEvent(
            attempt.id,
            currentUser.id,
            violationType,
            'critical',
            `Candidate disconnected for cheating: ${reason}`
          );
        } catch (e) {
          console.error('Failed to log cheating termination', e);
        }
      }
    },
    [attempt, currentUser, isDisconnectedForCheating]
  );

  useEffect(() => {
    if (!exam || !attempt) return;

    // 1. Fullscreen exit detection -> IMMEDIATE DISCONNECT
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(document.fullscreenElement);
      if (!isCurrentlyFullscreen && hasArmedProctoring.current) {
        triggerImmediateCheatingDisconnect(
          'fullscreen_exit',
          'Exiting fullscreen detected. Plagiarism / unauthorized activity prevented.'
        );
      }
    };

    // 2. Tab switch & visibility change -> IMMEDIATE DISCONNECT
    const handleVisibilityChange = () => {
      if ((document.visibilityState === 'hidden' || document.hidden) && hasArmedProctoring.current) {
        triggerImmediateCheatingDisconnect(
          'tab_switch',
          'Switching browser tabs detected. Plagiarism attempt intercepted.'
        );
      }
    };

    // 3. Window blur -> IMMEDIATE DISCONNECT
    const handleWindowBlur = () => {
      if (hasArmedProctoring.current) {
        triggerImmediateCheatingDisconnect(
          'window_blur',
          'Switching windows or focus loss detected. Plagiarism attempt intercepted.'
        );
      }
    };

    // 4. Intercept right-click and clipboard copy/paste
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerImmediateCheatingDisconnect(
        'context_menu',
        'Right-click context menu attempt detected. Examination disconnected.'
      );
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerImmediateCheatingDisconnect(
        'copy_attempt',
        'Clipboard copy action intercepted. Plagiarism attempt detected.'
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerImmediateCheatingDisconnect(
        'paste_attempt',
        'Clipboard paste action intercepted. Plagiarism attempt detected.'
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
    };
  }, [exam, attempt, triggerImmediateCheatingDisconnect]);

  // 4. AUTOSAVE ANSWER ENGINE
  const triggerAutosave = async (
    qId: string,
    selectedOptionIds: string[],
    textResponse?: string,
    isMarkedForReview: boolean = false
  ) => {
    if (!attempt || !currentUser) return;
    setSaveStatus('saving');

    try {
      const saved = await dbService.saveAnswer(
        attempt.id,
        currentUser.id,
        qId,
        selectedOptionIds,
        textResponse,
        isMarkedForReview
      );

      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(qId, saved);
        return next;
      });
      setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  };

  const handleSelectOption = (optId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers.get(currentQ.id);

    if (currentQ.questionType === 'mcq' || currentQ.questionType === 'true_false') {
      triggerAutosave(currentQ.id, [optId], undefined, existingAns?.isMarkedForReview || false);
    } else if (currentQ.questionType === 'multiple_select') {
      const currentOpts = existingAns?.selectedOptionIds || [];
      const newOpts = currentOpts.includes(optId)
        ? currentOpts.filter((id) => id !== optId)
        : [...currentOpts, optId];

      triggerAutosave(currentQ.id, newOpts, undefined, existingAns?.isMarkedForReview || false);
    }
  };

  const handleTextChange = (text: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const existingAns = answers.get(currentQ.id);
    triggerAutosave(currentQ.id, [], text, existingAns?.isMarkedForReview || false);
  };

  const handleToggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const existingAns = answers.get(currentQ.id);
    const newMarked = !existingAns?.isMarkedForReview;

    triggerAutosave(
      currentQ.id,
      existingAns?.selectedOptionIds || [],
      existingAns?.textResponse,
      newMarked
    );
  };

  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const existingAns = answers.get(currentQ.id);

    triggerAutosave(currentQ.id, [], '', existingAns?.isMarkedForReview || false);
  };

  // 5. FINAL SUBMISSION
  const handleFinalSubmit = async (isAuto = false, reason = '') => {
    if (!attempt || !currentUser || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await dbService.submitExamAttempt(attempt.id, currentUser.id, isAuto, reason);
      toast.success('Examination submitted successfully!', 'Submitted');

      // Exit fullscreen safely
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      navigate(`/student/results/${result.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Submission failed');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // PALETTE & COUNTERS
  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers.get(currentQ.id) : undefined;

  const getQuestionStatus = (q: Question): 'unanswered' | 'answered' | 'review' | 'answered_review' => {
    const ans = answers.get(q.id);
    const hasAnswer =
      (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      Boolean(ans?.textResponse && ans.textResponse.trim());

    if (ans?.isMarkedForReview && hasAnswer) return 'answered_review';
    if (ans?.isMarkedForReview) return 'review';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const answeredCount = questions.filter((q) => {
    const s = getQuestionStatus(q);
    return s === 'answered' || s === 'answered_review';
  }).length;

  const reviewCount = questions.filter((q) => {
    const s = getQuestionStatus(q);
    return s === 'review' || s === 'answered_review';
  }).length;

  const unansweredCount = questions.length - answeredCount;

  const timerInfo = formatTimeRemaining(secondsRemaining);

  if (isLoading || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium">Entering secure examination environment...</p>
        </div>
      </div>
    );
  }

  // 1. CHEATING & PLAGIARISM TERMINATION DISPLAY ("hide it")
  if (isDisconnectedForCheating) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-xl w-full bg-slate-900 border-2 border-red-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6 my-auto">
          {/* Animated red alert icon */}
          <div className="h-20 w-20 mx-auto rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-500 animate-pulse shadow-lg shadow-red-950/50">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
              Proctoring Disconnection Alert
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              EXAMINATION TERMINATED
            </h1>
            <p className="text-red-400 font-bold text-base sm:text-lg">
              Exam has been detected cheating: Switching tabs / Exiting fullscreen / Plagiarism detected.
            </p>
          </div>

          {/* Incident Details Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-red-900/60 text-left space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Violation Detected:</span>
              <span className="font-semibold text-red-400">{cheatingIncidentDetails || 'Switching Tabs / Fullscreen Exit / Plagiarism'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Candidate Name:</span>
              <span className="font-semibold text-white">{currentUser?.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Registration Number:</span>
              <span className="font-mono text-white">{currentUser?.registrationNumber || 'STU-9021'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Examination:</span>
              <span className="text-white truncate max-w-[240px]">{exam?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Timestamp:</span>
              <span className="font-mono text-slate-300">{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Customer Care Notice */}
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-xs text-red-200 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>Sorry, please contact Customer Care (Batman).</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Your examination session has been automatically disconnected and your responses have been permanently locked due to prohibited tab switching or fullscreen exit. All question assets have been removed from your display.
            </p>
            <div className="pt-2 border-t border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
              <span>Customer Care Lead: <strong className="text-slate-200">Batman</strong></span>
              <span>Direct Dispatch: <strong className="text-slate-200">batman@examflow.edu</strong></span>
              <span>Helpline: <strong className="text-slate-200">+1 (800) BAT-CARE (228-2273)</strong></span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            onClick={() => navigate('/student/exams')}
          >
            Return to Student Portal
          </Button>
        </div>
      </div>
    );
  }

  // 2. MANDATORY FULLSCREEN LOCK GATE
  if (!isFullscreenLocked) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 select-none">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Maximize2 className="h-8 w-8" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-2">
              Proctoring Requirement
            </span>
            <h2 className="text-xl font-bold text-white">Fullscreen Lock Required</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This examination must run in dedicated locked fullscreen mode. Leaving fullscreen or switching tabs will <strong className="text-red-400">immediately disconnect the exam and flag cheating & plagiarism</strong>.
            </p>
          </div>
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-300 text-left">
            ⚠️ <strong>Anti-Cheating Policy:</strong> Navigating away from this window or exiting fullscreen mode triggers instant automatic submission and disqualification.
          </div>
          <Button
            variant="primary"
            className="w-full font-semibold shadow-lg py-3 text-sm cursor-pointer"
            onClick={async () => {
              try {
                if (document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
                setIsFullscreenLocked(true);
                setTimeout(() => {
                  hasArmedProctoring.current = true;
                }, 1000);
              } catch (err) {
                toast.error('Fullscreen request was blocked by the browser. Please allow fullscreen in your browser.');
              }
            }}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Enter Fullscreen & Lock Exam
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-foreground">
      {/* 1. TOP PROCTORED HEADER */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-xs">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-8 w-8 rounded bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
              E
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">{exam.title}</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Candidate: {currentUser?.fullName} • {currentUser?.registrationNumber || 'STU'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
            {/* Autosave Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-primary animate-pulse">
                  <Wifi className="h-3.5 w-3.5" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Answers Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-500">
                  <WifiOff className="h-3.5 w-3.5" /> Retry Sync
                </span>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border text-xs bg-muted/40">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Fullscreen Proctored</span>
            </div>

            {/* Server Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
                timerInfo.isUrgent
                  ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800 animate-pulse'
                  : 'bg-muted border-border text-foreground'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{timerInfo.formatted}</span>
            </div>

            {/* Finish & Submit Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSubmitConfirmOpen(true)}
              className="font-semibold shadow-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800 w-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round((answeredCount / (questions.length || 1)) * 100)}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN SPLIT INTERFACE */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 max-w-7xl w-full mx-auto">
        {/* LEFT / CENTER: CURRENT QUESTION AREA */}
        <div className="flex-1 flex flex-col justify-between space-y-6 min-w-0">
          <Card className="flex-1 flex flex-col justify-between">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Question Header & Index */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <Badge variant="outline" size="sm" className="uppercase text-[10px]">
                    {currentQ.questionType.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" size="sm">
                    {currentQ.defaultMarks} Mark{currentQ.defaultMarks > 1 ? 's' : ''}
                  </Badge>
                  {currentAnswer?.isMarkedForReview && (
                    <Badge variant="warning" size="sm">
                      Marked for Review
                    </Badge>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap select-none">
                  {currentQ.questionText}
                </p>
              </div>

              {/* ANSWER INPUT CONTROLS BASED ON QUESTION TYPE */}
              {/* A. MCQ Single Choice */}
              {currentQ.questionType === 'mcq' && (
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs font-medium'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1">{opt.optionText}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* B. Multiple Select Choice */}
              {currentQ.questionType === 'multiple_select' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground italic">
                    Select all options that apply (multiple answers allowed):
                  </p>
                  {currentQ.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs font-medium'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container onClick
                          className="h-4 w-4 rounded text-primary"
                        />
                        <span className="font-bold text-xs text-muted-foreground">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="flex-1">{opt.optionText}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* C. True / False */}
              {currentQ.questionType === 'true_false' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {currentQ.options?.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-center justify-center gap-2 p-4 rounded-lg border text-base font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        {opt.optionText}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* D. Short Answer */}
              {currentQ.questionType === 'short_answer' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Your Response:
                  </label>
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={currentAnswer?.textResponse || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              )}

              {/* E. Essay / Descriptive Response */}
              {currentQ.questionType === 'essay' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Detailed Essay Response:
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Provide your in-depth analytical explanation here..."
                    value={currentAnswer?.textResponse || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full p-3.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs font-sans leading-relaxed"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Evaluated manually by instructor per official rubric.</span>
                    <span>Words: {(currentAnswer?.textResponse || '').trim().split(/\s+/).filter(Boolean).length}</span>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Bottom Question Action Bar */}
            <div className="p-4 sm:p-6 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleMarkForReview}
                  className={currentAnswer?.isMarkedForReview ? 'text-amber-600 border-amber-300' : ''}
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  {currentAnswer?.isMarkedForReview ? 'Remove Review Mark' : 'Mark for Review'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAnswer}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Clear Answer
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0 || !exam.rules.allowBackNavigation}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: QUESTION NAVIGATOR PALETTE */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Question Navigator</h3>
                <span className="text-xs font-semibold text-primary">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              {/* Grid of Question Numbers */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q);
                  const isCurrent = currentIndex === idx;

                  const statusColors = {
                    unanswered: 'bg-muted text-muted-foreground border-border hover:bg-slate-200',
                    answered: 'bg-emerald-600 text-white border-emerald-700 shadow-xs',
                    review: 'bg-amber-500 text-white border-amber-600 shadow-xs',
                    answered_review: 'bg-indigo-600 text-white border-indigo-700 shadow-xs',
                  };

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-md font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                        statusColors[status]
                      } ${isCurrent ? 'ring-2 ring-foreground ring-offset-2 scale-105' : ''}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-600" />
                    <span>Answered</span>
                  </span>
                  <span className="font-semibold text-foreground">{answeredCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-muted border border-border" />
                    <span>Unanswered</span>
                  </span>
                  <span className="font-semibold text-foreground">{unansweredCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Marked for Review</span>
                  </span>
                  <span className="font-semibold text-foreground">{reviewCount}</span>
                </div>
              </div>

              {/* Security info banner */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Proctoring monitor active. All interactions are logged.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. SUBMISSION CONFIRMATION MODAL */}
      <Dialog
        isOpen={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        title="Submit Examination"
        maxWidth="md"
      >
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Please review your completion status before confirming your final submission. Once submitted, your answers will be permanently locked and evaluated.
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-muted/40 border border-border text-center">
            <div>
              <p className="text-xs text-muted-foreground">Answered</p>
              <p className="text-xl font-bold text-emerald-600">{answeredCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unanswered</p>
              <p className="text-xl font-bold text-muted-foreground">{unansweredCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Review</p>
              <p className="text-xl font-bold text-amber-500">{reviewCount}</p>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You have {unansweredCount} unanswered questions remaining.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Return to Exam
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleFinalSubmit(false)}
              isLoading={isSubmitting}
            >
              Confirm Submission
            </Button>
          </div>
        </div>
      </Dialog>


    </div>
  );
};
