export type UserRole = 'admin' | 'instructor' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  registrationNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type QuestionType = 'mcq' | 'multiple_select' | 'true_false' | 'short_answer' | 'essay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'active' | 'draft' | 'archived';

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect?: boolean; // Stripped for active student exams!
  orderIndex: number;
}

export interface Question {
  id: string;
  subjectId?: string;
  topicId?: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  defaultMarks: number;
  defaultNegativeMarks: number;
  explanation?: string;
  rubric?: string;
  shortAnswerKey?: string;
  tags: string[];
  status: QuestionStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  options?: QuestionOption[];
}

export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'archived';

export interface ExamRules {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  maxAttempts: number;
  negativeMarking: boolean;
  showResultImmediately: boolean;
  allowReviewBeforeSubmission: boolean;
}

export interface ExamSecuritySettings {
  requireFullscreen: boolean;
  detectTabSwitch: boolean;
  detectWindowBlur: boolean;
  logSecurityEvents: boolean;
  warningThreshold: number;
  autoSubmitThreshold: number;
  preventMultipleActiveAttempts: boolean;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  orderIndex: number;
  marks: number;
  negativeMarks: number;
  question?: Question;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passPercentage: number;
  status: ExamStatus;
  startTime?: string;
  endTime?: string;
  timezone: string;
  rules: ExamRules;
  securitySettings: ExamSecuritySettings;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  examQuestions?: ExamQuestion[];
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated' | 'abandoned';

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string; // ISO server expiration timestamp
  submittedAt?: string;
  isAutoSubmitted: boolean;
  autoSubmitReason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textResponse?: string;
  isMarkedForReview: boolean;
  isCorrect?: boolean;
  marksObtained: number;
  answeredAt: string;
}

export interface EssayGrade {
  id: string;
  attemptAnswerId: string;
  graderId: string;
  marksAwarded: number;
  feedback?: string;
  isFinal: boolean;
  gradedAt: string;
}

export interface ExamResult {
  id: string;
  attemptId: string;
  examId: string;
  studentId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  isPassed: boolean;
  hasPendingEssay: boolean;
  generatedAt: string;
}

export type SecurityEventType =
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'reconnect'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'context_menu'
  | 'auto_submit'
  | 'suspicious_activity';

export interface SecurityEvent {
  id: string;
  attemptId: string;
  studentId: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
