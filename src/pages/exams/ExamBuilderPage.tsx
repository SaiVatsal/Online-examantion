import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { Subject, Question, ExamRules, ExamSecuritySettings } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/ToastContext';
import {
  FileText,
  HelpCircle,
  Sliders,
  Calendar,
  Shield,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const ExamBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [instructions, setInstructions] = useState(
    '1. Ensure you have a stable network connection.\n2. Do not switch tabs or minimize the browser window.\n3. All answers are autosaved automatically.\n4. Click Submit once you have answered all questions.'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [passPercentage, setPassPercentage] = useState<number>(50);

  // Step 2: Selected Questions
  const [selectedQuestions, setSelectedQuestions] = useState<
    Array<{ questionId: string; marks: number; negativeMarks: number; question?: Question }>
  >([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionFilterSubject, setQuestionFilterSubject] = useState('');
  const [questionFilterType, setQuestionFilterType] = useState('');

  // Step 3: Rules
  const [rules, setRules] = useState<ExamRules>({
    shuffleQuestions: true,
    shuffleOptions: true,
    allowBackNavigation: true,
    maxAttempts: 1,
    negativeMarking: false,
    showResultImmediately: true,
    allowReviewBeforeSubmission: true,
  });

  // Step 4: Scheduling
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // Step 5: Security
  const [securitySettings, setSecuritySettings] = useState<ExamSecuritySettings>({
    requireFullscreen: true,
    detectTabSwitch: true,
    detectWindowBlur: true,
    logSecurityEvents: true,
    warningThreshold: 3,
    autoSubmitThreshold: 5,
    preventMultipleActiveAttempts: true,
  });

  useEffect(() => {
    loadPrerequisites();
  }, [id]);

  const loadPrerequisites = async () => {
    setIsLoading(true);
    try {
      const [subs, allQuestions] = await Promise.all([
        dbService.getSubjects(),
        dbService.getQuestions(),
      ]);
      setSubjects(subs);
      setAvailableQuestions(allQuestions);

      if (id) {
        const existingExam = await dbService.getExamById(id, true);
        if (existingExam) {
          setTitle(existingExam.title);
          setDescription(existingExam.description || '');
          setSubjectId(existingExam.subjectId || '');
          setInstructions(existingExam.instructions || '');
          setDurationMinutes(existingExam.durationMinutes);
          setPassPercentage(existingExam.passPercentage);
          setRules(existingExam.rules);
          setSecuritySettings(existingExam.securitySettings);
          setStartTime(existingExam.startTime ? existingExam.startTime.substring(0, 16) : '');
          setEndTime(existingExam.endTime ? existingExam.endTime.substring(0, 16) : '');
          setTimezone(existingExam.timezone || 'UTC');

          if (existingExam.examQuestions) {
            setSelectedQuestions(
              existingExam.examQuestions.map((eq) => ({
                questionId: eq.questionId,
                marks: eq.marks,
                negativeMarks: eq.negativeMarks,
                question: eq.question,
              }))
            );
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load examination details.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalculatedMarks = selectedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Question selection toggles
  const handleAddQuestionToExam = (question: Question) => {
    if (selectedQuestions.some((q) => q.questionId === question.id)) return;
    setSelectedQuestions([
      ...selectedQuestions,
      {
        questionId: question.id,
        marks: question.defaultMarks,
        negativeMarks: question.defaultNegativeMarks,
        question,
      },
    ]);
  };

  const handleRemoveQuestionFromExam = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.questionId !== questionId));
  };

  const handleUpdateQuestionMarks = (questionId: string, marks: number) => {
    setSelectedQuestions(
      selectedQuestions.map((q) => (q.questionId === questionId ? { ...q, marks } : q))
    );
  };

  const handleUpdateQuestionNegativeMarks = (questionId: string, negativeMarks: number) => {
    setSelectedQuestions(
      selectedQuestions.map((q) => (q.questionId === questionId ? { ...q, negativeMarks } : q))
    );
  };

  // Add all filtered questions (Quick pool add)
  const handleAddAllFiltered = () => {
    const toAdd = filteredAvailableQuestions.filter(
      (aq) => !selectedQuestions.some((sq) => sq.questionId === aq.id)
    );
    const newItems = toAdd.map((q) => ({
      questionId: q.id,
      marks: q.defaultMarks,
      negativeMarks: q.defaultNegativeMarks,
      question: q,
    }));
    setSelectedQuestions([...selectedQuestions, ...newItems]);
    toast.info(`Added ${newItems.length} questions to exam.`);
  };

  const filteredAvailableQuestions = availableQuestions.filter((q) => {
    if (questionFilterSubject && q.subjectId !== questionFilterSubject) return false;
    if (questionFilterType && q.questionType !== questionFilterType) return false;
    if (questionSearch) {
      const query = questionSearch.toLowerCase();
      if (!q.questionText.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!title.trim()) {
        setErrorMsg('Please enter an examination title.');
        return false;
      }
      if (durationMinutes <= 0) {
        setErrorMsg('Duration must be at least 1 minute.');
        return false;
      }
      if (passPercentage <= 0 || passPercentage > 100) {
        setErrorMsg('Pass percentage must be between 1 and 100.');
        return false;
      }
    } else if (currentStep === 2) {
      if (selectedQuestions.length === 0) {
        setErrorMsg('Please select at least 1 question for the examination.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSaveExam = async (status: 'draft' | 'scheduled' | 'live') => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSaving(true);
    setErrorMsg('');

    try {
      const examData = {
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: subjectId || undefined,
        instructions: instructions.trim() || undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: totalCalculatedMarks,
        passPercentage: Number(passPercentage),
        status,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        timezone,
        rules,
        securitySettings,
      };

      const questionConfigs = selectedQuestions.map((q) => ({
        questionId: q.questionId,
        marks: Number(q.marks) || 1,
        negativeMarks: Number(q.negativeMarks) || 0,
      }));

      if (isEditing && id) {
        await dbService.updateExam(id, examData, questionConfigs);
        toast.success(`Exam "${title}" updated successfully (${status.toUpperCase()}).`);
      } else {
        await dbService.createExam(examData, questionConfigs);
        toast.success(`Exam "${title}" created successfully (${status.toUpperCase()}).`);
      }

      const backPath = currentUser?.role === 'admin' ? '/admin/exams' : '/instructor/exams';
      navigate(backPath);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save examination.');
    } finally {
      setIsSaving(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Basic Info', icon: <FileText className="h-4 w-4" /> },
    { num: 2, title: 'Questions', icon: <HelpCircle className="h-4 w-4" /> },
    { num: 3, title: 'Exam Rules', icon: <Sliders className="h-4 w-4" /> },
    { num: 4, title: 'Scheduling', icon: <Calendar className="h-4 w-4" /> },
    { num: 5, title: 'Security', icon: <Shield className="h-4 w-4" /> },
    { num: 6, title: 'Review & Publish', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const backUrl = currentUser?.role === 'admin' ? '/admin/exams' : '/instructor/exams';

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading examination builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={backUrl}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? 'Edit Examination' : 'Create Examination'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-step configuration wizard for structured academic & hiring exams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveExam('draft')}
            isLoading={isSaving}
          >
            Save as Draft
          </Button>
        </div>
      </div>

      {/* Step Wizard Bar */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {stepsList.map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.num < step || validateStep(step)) {
                      setStep(s.num);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : isCompleted
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? '✓' : s.num}
                  </span>
                  <span>{s.title}</span>
                </button>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      step > s.num ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP CONTENT */}
      {/* ================= STEP 1: BASIC INFORMATION ================= */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Step 1: Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Examination Title"
              placeholder="e.g. Kids Easy Test – LKG / UKG / Kindergarten"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Associated Subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Select Subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duration (Minutes)"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                />
                <Input
                  label="Pass Percentage (%)"
                  type="number"
                  min="1"
                  max="100"
                  value={passPercentage}
                  onChange={(e) => setPassPercentage(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <Textarea
              label="Description / Abstract"
              placeholder="Brief description of examination scope and learning objectives..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Textarea
              label="Candidate Instructions"
              placeholder="Guidelines displayed to the examinee before clicking Start Exam..."
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              helperText="Candidates must read and acknowledge these instructions prior to launch."
            />
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-xs text-muted-foreground">Step 1 of 6</div>
            <Button variant="primary" size="sm" onClick={handleNextStep}>
              Next: Select Questions <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 2: QUESTIONS ================= */}
      {step === 2 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Step 2: Select Questions
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Selected: <span className="font-bold text-foreground">{selectedQuestions.length}</span> questions • Total Marks: <span className="font-bold text-foreground">{totalCalculatedMarks}</span>
              </p>
            </div>
            {filteredAvailableQuestions.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAddAllFiltered}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add All Filtered ({filteredAvailableQuestions.length})
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Split layout: Selected questions on top / right, Question Bank on bottom / left */}
            {/* 1. CURRENTLY SELECTED QUESTIONS IN THIS EXAM */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span>Questions in Examination ({selectedQuestions.length})</span>
                <span className="text-[11px] font-normal text-muted-foreground">Adjust marks per question if needed</span>
              </h4>

              {selectedQuestions.length === 0 ? (
                <div className="p-6 rounded-md border border-dashed border-border text-center text-xs text-muted-foreground bg-muted/20">
                  No questions added yet. Select questions from the repository below.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedQuestions.map((sq, idx) => {
                    const qObj = sq.question || availableQuestions.find((q) => q.id === sq.questionId);
                    return (
                      <div
                        key={sq.questionId}
                        className="flex items-center justify-between p-3 rounded-md border border-border bg-card text-xs gap-3"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="font-bold text-muted-foreground w-6 text-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {qObj?.questionText || sq.questionId}
                            </p>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {qObj?.questionType} • {qObj?.difficulty}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">Marks:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={sq.marks}
                              onChange={(e) => handleUpdateQuestionMarks(sq.questionId, Number(e.target.value))}
                              className="w-14 h-7 text-xs border border-input rounded px-1.5 bg-background font-semibold text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">Penalty:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              value={sq.negativeMarks}
                              onChange={(e) => handleUpdateQuestionNegativeMarks(sq.questionId, Number(e.target.value))}
                              className="w-14 h-7 text-xs border border-input rounded px-1.5 bg-background text-destructive text-center"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveQuestionFromExam(sq.questionId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. QUESTION BANK BROWSER */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Browse Institutional Question Bank
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <Input
                  placeholder="Search available questions..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs"
                />

                <Select
                  value={questionFilterSubject}
                  onChange={(e) => setQuestionFilterSubject(e.target.value)}
                  className="h-8 text-xs"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>

                <Select
                  value={questionFilterType}
                  onChange={(e) => setQuestionFilterType(e.target.value)}
                  className="h-8 text-xs"
                >
                  <option value="">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="multiple_select">Multiple Select</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </Select>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {filteredAvailableQuestions.map((q) => {
                  const isSelected = selectedQuestions.some((sq) => sq.questionId === q.id);
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between p-2.5 rounded border text-xs transition-colors ${
                        isSelected
                          ? 'bg-muted/40 border-primary/30 text-muted-foreground'
                          : 'bg-card border-border hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-medium text-foreground truncate">{q.questionText}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase">{q.questionType}</span>
                          <span className="text-[10px] text-muted-foreground">• {q.difficulty}</span>
                          <span className="text-[10px] text-muted-foreground">• {q.defaultMarks} marks</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isSelected ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() =>
                          isSelected
                            ? handleRemoveQuestionFromExam(q.id)
                            : handleAddQuestionToExam(q)
                        }
                      >
                        {isSelected ? 'Remove' : '+ Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous: Basic Info
            </Button>
            <Button variant="primary" size="sm" onClick={handleNextStep}>
              Next: Exam Rules <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 3: EXAM RULES ================= */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" /> Step 3: Exam Rules & Assessment Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.shuffleQuestions}
                  onChange={(e) => setRules({ ...rules, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Shuffle Questions
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Randomizes question sequence independently for every examinee to combat collusion.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.shuffleOptions}
                  onChange={(e) => setRules({ ...rules, shuffleOptions: e.target.checked })}
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Shuffle Answer Options
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Randomizes order of MCQ and Multiple Select choices per question.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.allowBackNavigation}
                  onChange={(e) => setRules({ ...rules, allowBackNavigation: e.target.checked })}
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Allow Back Navigation
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Allows candidate to jump back to previously visited questions.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.allowReviewBeforeSubmission}
                  onChange={(e) =>
                    setRules({ ...rules, allowReviewBeforeSubmission: e.target.checked })
                  }
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Submission Confirmation Review
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Displays dialog with answered/unanswered counts before final submit.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.negativeMarking}
                  onChange={(e) => setRules({ ...rules, negativeMarking: e.target.checked })}
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Enable Negative Marking
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Deducts penalty marks configured on questions for incorrect answers.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={rules.showResultImmediately}
                  onChange={(e) => setRules({ ...rules, showResultImmediately: e.target.checked })}
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Show Result Immediately
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Allows student to immediately view scorecard upon submission (unless essay is pending).
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <Input
                label="Maximum Allowed Attempts per Student"
                type="number"
                min="1"
                max="10"
                value={rules.maxAttempts}
                onChange={(e) => setRules({ ...rules, maxAttempts: Number(e.target.value) })}
                helperText="Set to 1 for high-stakes formal examinations."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous: Questions
            </Button>
            <Button variant="primary" size="sm" onClick={handleNextStep}>
              Next: Scheduling <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 4: SCHEDULING ================= */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Step 4: Scheduling & Availability Window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Define the open window during which candidates can initiate their exam attempt. Once started, the exam duration timer takes precedence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date & Time (Optional)"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                helperText="Examinees cannot launch before this timestamp."
              />

              <Input
                label="End Date & Time (Optional)"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                helperText="Exams close for new attempts after this timestamp."
              />
            </div>

            <Select
              label="Standard Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                { value: 'America/New_York', label: 'Eastern Time (ET / US)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT / US)' },
                { value: 'Europe/London', label: 'GMT / BST (London)' },
                { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
                { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
              ]}
            />
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous: Exam Rules
            </Button>
            <Button variant="primary" size="sm" onClick={handleNextStep}>
              Next: Security & Proctoring <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 5: SECURITY ================= */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Step 5: Proctoring & Anti-Cheating Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={securitySettings.requireFullscreen}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      requireFullscreen: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Require Fullscreen Mode
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Enforces browser fullscreen on start; logs warning event if candidate exits.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={securitySettings.detectTabSwitch}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      detectTabSwitch: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Detect Tab Switching
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Monitors visibility change; alerts examinee upon returning from other tabs.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={securitySettings.detectWindowBlur}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      detectWindowBlur: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Detect Window Blur
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Logs focus-loss if student interacts with secondary applications or monitors.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={securitySettings.preventMultipleActiveAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      preventMultipleActiveAttempts: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Single Active Session Lock
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Prevents concurrent exam taking from multiple browser tabs or devices.
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Warning Threshold"
                type="number"
                min="1"
                max="10"
                value={securitySettings.warningThreshold}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    warningThreshold: Number(e.target.value),
                  })
                }
                helperText="Number of security incidents before a severe warning dialog triggers."
              />

              <Input
                label="Auto-Submit Violation Limit"
                type="number"
                min="2"
                max="15"
                value={securitySettings.autoSubmitThreshold}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    autoSubmitThreshold: Number(e.target.value),
                  })
                }
                helperText="Reaching this violation threshold forcibly submits the attempt."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous: Scheduling
            </Button>
            <Button variant="primary" size="sm" onClick={handleNextStep}>
              Next: Review & Finalize <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 6: REVIEW & PUBLISH ================= */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Step 6: Review & Finalize Examination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{title || 'Untitled Exam'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description || 'No description provided.'}
                  </p>
                </div>
                <Badge variant="default" size="md">
                  {durationMinutes} Minutes • {totalCalculatedMarks} Marks
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Questions</span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedQuestions.length} Items
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Pass Rate</span>
                  <span className="font-semibold text-foreground text-sm">{passPercentage}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Randomization</span>
                  <span className="font-semibold text-foreground text-sm">
                    {rules.shuffleQuestions ? 'Questions & Options' : 'Static Order'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Proctoring</span>
                  <span className="font-semibold text-foreground text-sm">
                    {securitySettings.requireFullscreen ? 'Strict Proctored' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions Summary */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Included Question Breakdown ({selectedQuestions.length})
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {selectedQuestions.map((sq, i) => (
                  <div
                    key={sq.questionId}
                    className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs"
                  >
                    <span className="font-medium text-foreground truncate pr-2">
                      #{i + 1}. {sq.question?.questionText || sq.questionId}
                    </span>
                    <span className="font-semibold text-muted-foreground shrink-0">
                      {sq.marks} marks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Publishing Action Box */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Ready to Launch?</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Publishing makes this exam immediately live and accessible to eligible students.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveExam('scheduled')}
                  isLoading={isSaving}
                >
                  Schedule
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveExam('live')}
                  isLoading={isSaving}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Publish Live
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevStep}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous: Security
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
