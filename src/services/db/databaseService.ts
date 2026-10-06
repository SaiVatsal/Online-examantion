import {
  UserProfile,
  Subject,
  Topic,
  Question,
  Exam,
  ExamAttempt,
  AttemptAnswer,
  ExamResult,
  SecurityEvent,
  AuditLog,
  EssayGrade,
  UserRole,
  ExamStatus,
  SecurityEventType,
  ExamQuestion,
} from '../../types';
import {
  SEED_PROFILES,
  SEED_SUBJECTS,
  SEED_TOPICS,
  SEED_QUESTIONS,
  SEED_EXAMS,
  SEED_EXAM_QUESTIONS,
  SEED_ATTEMPTS,
  SEED_ATTEMPT_ANSWERS,
  SEED_RESULTS,
  SEED_SECURITY_EVENTS,
  SEED_AUDIT_LOGS,
} from '../../data/seedData';
import { generateId, shuffleArray } from '../../lib/utils';

const STORAGE_KEY_PREFIX = 'examflow_db_v4_';

interface DBState {
  profiles: UserProfile[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  exams: Exam[];
  examQuestions: ExamQuestion[];
  attempts: ExamAttempt[];
  answers: AttemptAnswer[];
  essayGrades: EssayGrade[];
  results: ExamResult[];
  securityEvents: SecurityEvent[];
  auditLogs: AuditLog[];
  currentUser: UserProfile | null;
}

class DatabaseService {
  private state: DBState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DBState {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}state`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage, using initial seed data', e);
    }

    // Default initialized state with seed data
    const initial: DBState = {
      profiles: [...SEED_PROFILES],
      subjects: [...SEED_SUBJECTS],
      topics: [...SEED_TOPICS],
      questions: JSON.parse(JSON.stringify(SEED_QUESTIONS)),
      exams: JSON.parse(JSON.stringify(SEED_EXAMS)),
      examQuestions: JSON.parse(JSON.stringify(SEED_EXAM_QUESTIONS)),
      attempts: JSON.parse(JSON.stringify(SEED_ATTEMPTS)),
      answers: JSON.parse(JSON.stringify(SEED_ATTEMPT_ANSWERS)),
      essayGrades: [],
      results: JSON.parse(JSON.stringify(SEED_RESULTS)),
      securityEvents: JSON.parse(JSON.stringify(SEED_SECURITY_EVENTS)),
      auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
      currentUser: SEED_PROFILES[0], // Default logged-in as Admin for instant testability
    };

    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(stateToSave?: DBState) {
    try {
      const state = stateToSave || this.state;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}state`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public resetDatabase(): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}state`);
    this.state = this.loadFromStorage();
  }

  // ==========================================
  // AUTHENTICATION & SESSIONS
  // ==========================================
  public async getCurrentUser(): Promise<UserProfile | null> {
    return this.state.currentUser;
  }

  public async login(email: string, _password?: string): Promise<{ user: UserProfile; error?: string }> {
    const user = this.state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { user: null as any, error: 'Invalid email or password' };
    }
    if (!user.isActive) {
      return { user: null as any, error: 'Your account has been deactivated. Please contact an administrator.' };
    }

    this.state.currentUser = user;
    this.saveToStorage();

    await this.logAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'auth',
      resourceId: user.id,
    });

    return { user };
  }

  public async logout(): Promise<void> {
    if (this.state.currentUser) {
      await this.logAudit({
        actorId: this.state.currentUser.id,
        actorName: this.state.currentUser.fullName,
        actorRole: this.state.currentUser.role,
        action: 'USER_LOGOUT',
        resourceType: 'auth',
        resourceId: this.state.currentUser.id,
      });
    }
    this.state.currentUser = null;
    this.saveToStorage();
  }

  public async switchUser(userId: string): Promise<UserProfile> {
    const user = this.state.profiles.find((p) => p.id === userId);
    if (!user) throw new Error('User not found');
    this.state.currentUser = user;
    this.saveToStorage();
    return user;
  }

  public async register(email: string, fullName: string, role: UserRole = 'student'): Promise<UserProfile> {
    const existing = this.state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const newUser: UserProfile = {
      id: generateId('u'),
      email,
      fullName,
      role,
      registrationNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.profiles.push(newUser);
    this.state.currentUser = newUser;
    this.saveToStorage();

    await this.logAudit({
      actorId: newUser.id,
      actorName: newUser.fullName,
      actorRole: newUser.role,
      action: 'USER_REGISTER',
      resourceType: 'auth',
      resourceId: newUser.id,
    });

    return newUser;
  }

  // ==========================================
  // USERS & PROFILES MANAGEMENT
  // ==========================================
  public async getProfiles(role?: UserRole, search?: string): Promise<UserProfile[]> {
    return this.state.profiles.filter((p) => {
      if (role && p.role !== role) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.registrationNumber && p.registrationNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }

  public async getProfileById(id: string): Promise<UserProfile | null> {
    return this.state.profiles.find((p) => p.id === id) || null;
  }

  public async createProfile(data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...data,
      id: generateId('u'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.profiles.unshift(newProfile);
    this.saveToStorage();

    await this.logAudit({
      action: 'PROFILE_CREATED',
      resourceType: 'profile',
      resourceId: newProfile.id,
      metadata: { role: newProfile.role, email: newProfile.email },
    });

    return newProfile;
  }

  public async updateProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const index = this.state.profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');

    this.state.profiles[index] = {
      ...this.state.profiles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (this.state.currentUser?.id === id) {
      this.state.currentUser = this.state.profiles[index];
    }

    this.saveToStorage();
    return this.state.profiles[index];
  }

  public async toggleUserActive(id: string): Promise<UserProfile> {
    const profile = await this.getProfileById(id);
    if (!profile) throw new Error('Profile not found');
    return this.updateProfile(id, { isActive: !profile.isActive });
  }

  // ==========================================
  // SUBJECTS & TOPICS
  // ==========================================
  public async getSubjects(): Promise<Subject[]> {
    return this.state.subjects;
  }

  public async getTopics(subjectId?: string): Promise<Topic[]> {
    if (subjectId) {
      return this.state.topics.filter((t) => t.subjectId === subjectId);
    }
    return this.state.topics;
  }

  public async createSubject(name: string, code: string, description?: string): Promise<Subject> {
    const newSubject: Subject = {
      id: generateId('sub'),
      name,
      code,
      description,
      createdAt: new Date().toISOString(),
    };
    this.state.subjects.push(newSubject);
    this.saveToStorage();
    return newSubject;
  }

  public async createTopic(subjectId: string, name: string, description?: string): Promise<Topic> {
    const newTopic: Topic = {
      id: generateId('top'),
      subjectId,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.state.topics.push(newTopic);
    this.saveToStorage();
    return newTopic;
  }

  // ==========================================
  // QUESTION BANK
  // ==========================================
  public async getQuestions(filters?: {
    subjectId?: string;
    topicId?: string;
    type?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    tag?: string;
  }): Promise<Question[]> {
    return this.state.questions.filter((q) => {
      if (filters?.subjectId && q.subjectId !== filters.subjectId) return false;
      if (filters?.topicId && q.topicId !== filters.topicId) return false;
      if (filters?.type && q.questionType !== filters.type) return false;
      if (filters?.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters?.status && q.status !== filters.status) return false;
      if (filters?.tag && !q.tags.includes(filters.tag)) return false;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inExpl = q.explanation?.toLowerCase().includes(query);
        const inTags = q.tags.some((t) => t.toLowerCase().includes(query));
        if (!inText && !inExpl && !inTags) return false;
      }
      return true;
    });
  }

  public async getQuestionById(id: string, includeAnswers: boolean = true): Promise<Question | null> {
    const q = this.state.questions.find((item) => item.id === id);
    if (!q) return null;

    if (!includeAnswers) {
      // Strip correct answers to prevent client leakage
      const sanitized = JSON.parse(JSON.stringify(q)) as Question;
      sanitized.options?.forEach((opt) => delete opt.isCorrect);
      delete sanitized.explanation;
      delete sanitized.rubric;
      delete sanitized.shortAnswerKey;
      return sanitized;
    }

    return q;
  }

  public async createQuestion(
    data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Question> {
    const newQ: Question = {
      ...data,
      id: generateId('q'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.state.currentUser?.id,
    };

    if (newQ.options) {
      newQ.options = newQ.options.map((opt, i) => ({
        ...opt,
        id: opt.id || generateId('opt'),
        questionId: newQ.id,
        orderIndex: i,
      }));
    }

    this.state.questions.unshift(newQ);
    this.saveToStorage();

    await this.logAudit({
      action: 'QUESTION_CREATED',
      resourceType: 'question',
      resourceId: newQ.id,
      metadata: { type: newQ.questionType, difficulty: newQ.difficulty },
    });

    return newQ;
  }

  public async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    const index = this.state.questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    const updated: Question = {
      ...this.state.questions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.options) {
      updated.options = data.options.map((opt, i) => ({
        ...opt,
        id: opt.id || generateId('opt'),
        questionId: id,
        orderIndex: i,
      }));
    }

    this.state.questions[index] = updated;
    this.saveToStorage();

    await this.logAudit({
      action: 'QUESTION_UPDATED',
      resourceType: 'question',
      resourceId: id,
    });

    return updated;
  }

  public async deleteQuestion(id: string): Promise<void> {
    this.state.questions = this.state.questions.filter((q) => q.id !== id);
    this.state.examQuestions = this.state.examQuestions.filter((eq) => eq.questionId !== id);
    this.saveToStorage();

    await this.logAudit({
      action: 'QUESTION_DELETED',
      resourceType: 'question',
      resourceId: id,
    });
  }

  public async bulkDeleteQuestions(ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    this.state.questions = this.state.questions.filter((q) => !idSet.has(q.id));
    this.state.examQuestions = this.state.examQuestions.filter((eq) => !idSet.has(eq.questionId));
    this.saveToStorage();

    await this.logAudit({
      action: 'QUESTIONS_BULK_DELETED',
      resourceType: 'question',
      metadata: { count: ids.length, ids },
    });
  }

  public async duplicateQuestion(id: string): Promise<Question> {
    const original = await this.getQuestionById(id, true);
    if (!original) throw new Error('Question not found');

    const duplicate: Question = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId('q'),
      questionText: `${original.questionText} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.state.currentUser?.id,
    };

    if (duplicate.options) {
      duplicate.options = duplicate.options.map((opt, i) => ({
        ...opt,
        id: generateId('opt'),
        questionId: duplicate.id,
        orderIndex: i,
      }));
    }

    this.state.questions.unshift(duplicate);
    this.saveToStorage();
    return duplicate;
  }

  // ==========================================
  // EXAMS & EXAM QUESTIONS
  // ==========================================
  public async getExams(filters?: {
    role?: UserRole;
    studentId?: string;
    status?: ExamStatus;
    search?: string;
  }): Promise<Exam[]> {
    return this.state.exams.filter((exam) => {
      if (filters?.status && exam.status !== filters.status) return false;

      // Role check: Students should only see scheduled, live, or completed exams
      if (filters?.role === 'student' && exam.status === 'draft') return false;

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return (
          exam.title.toLowerCase().includes(q) ||
          exam.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  public async getExamById(id: string, includeQuestions: boolean = true): Promise<Exam | null> {
    const exam = this.state.exams.find((e) => e.id === id);
    if (!exam) return null;

    const result = { ...exam };
    if (includeQuestions) {
      const eqLinks = this.state.examQuestions
        .filter((eq) => eq.examId === id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      result.examQuestions = eqLinks.map((eq) => ({
        ...eq,
        question: this.state.questions.find((q) => q.id === eq.questionId),
      }));
    }

    return result;
  }

  public async createExam(
    examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt' | 'examQuestions'>,
    questionConfigs: { questionId: string; marks: number; negativeMarks: number }[]
  ): Promise<Exam> {
    const totalMarks = questionConfigs.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    const newExam: Exam = {
      ...examData,
      id: generateId('exam'),
      totalMarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.state.currentUser?.id,
    };

    const newExamQuestions: ExamQuestion[] = questionConfigs.map((cfg, index) => ({
      id: generateId('eq'),
      examId: newExam.id,
      questionId: cfg.questionId,
      orderIndex: index,
      marks: cfg.marks,
      negativeMarks: cfg.negativeMarks,
    }));

    this.state.exams.unshift(newExam);
    this.state.examQuestions.push(...newExamQuestions);
    this.saveToStorage();

    await this.logAudit({
      action: 'EXAM_CREATED',
      resourceType: 'exam',
      resourceId: newExam.id,
      metadata: { title: newExam.title, totalQuestions: questionConfigs.length, totalMarks },
    });

    return this.getExamById(newExam.id, true) as Promise<Exam>;
  }

  public async updateExam(
    id: string,
    examData: Partial<Exam>,
    questionConfigs?: { questionId: string; marks: number; negativeMarks: number }[]
  ): Promise<Exam> {
    const index = this.state.exams.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Exam not found');

    let totalMarks = examData.totalMarks ?? this.state.exams[index].totalMarks;

    if (questionConfigs) {
      totalMarks = questionConfigs.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
      // Replace existing exam questions
      this.state.examQuestions = this.state.examQuestions.filter((eq) => eq.examId !== id);
      const newLinks = questionConfigs.map((cfg, idx) => ({
        id: generateId('eq'),
        examId: id,
        questionId: cfg.questionId,
        orderIndex: idx,
        marks: cfg.marks,
        negativeMarks: cfg.negativeMarks,
      }));
      this.state.examQuestions.push(...newLinks);
    }

    this.state.exams[index] = {
      ...this.state.exams[index],
      ...examData,
      totalMarks,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();

    await this.logAudit({
      action: 'EXAM_UPDATED',
      resourceType: 'exam',
      resourceId: id,
    });

    return this.getExamById(id, true) as Promise<Exam>;
  }

  public async updateExamStatus(id: string, status: ExamStatus): Promise<Exam> {
    return this.updateExam(id, { status });
  }

  public async deleteExam(id: string): Promise<void> {
    this.state.exams = this.state.exams.filter((e) => e.id !== id);
    this.state.examQuestions = this.state.examQuestions.filter((eq) => eq.examId !== id);
    this.saveToStorage();

    await this.logAudit({
      action: 'EXAM_DELETED',
      resourceType: 'exam',
      resourceId: id,
    });
  }

  // ==========================================
  // LIVE EXAM ENGINE & ANTI-CHEATING
  // ==========================================

  /**
   * Starts or resumes an exam attempt securely.
   * CRITICAL SECURITY GUARANTEE: Never exposes `isCorrect` or answer keys in the returned questions!
   */
  public async startExamAttempt(
    examId: string,
    studentId: string,
    userAgent?: string
  ): Promise<{ attempt: ExamAttempt; exam: Exam; questions: Question[]; answers: AttemptAnswer[] }> {
    const exam = await this.getExamById(examId, true);
    if (!exam) throw new Error('Exam not found');

    if (exam.status !== 'live' && exam.status !== 'scheduled') {
      throw new Error(`This examination is currently in ${exam.status} status and cannot be started.`);
    }

    // Check for existing active attempt (Resume recovery)
    const activeAttempt = this.state.attempts.find(
      (a) => a.examId === examId && a.studentId === studentId && a.status === 'in_progress'
    );

    if (activeAttempt) {
      // Check if attempt already expired
      const expiresAtMs = new Date(activeAttempt.expiresAt).getTime();
      if (Date.now() >= expiresAtMs) {
        // Automatically submit expired attempt
        await this.submitExamAttempt(activeAttempt.id, studentId, true, 'Time limit exceeded during offline period');
        throw new Error('Your previous attempt expired and has been submitted.');
      }

      // Restore active attempt
      const existingAnswers = this.state.answers.filter((a) => a.attemptId === activeAttempt.id);
      const sanitizedQuestions = this.getSanitizedQuestionsForExam(exam);

      return {
        attempt: activeAttempt,
        exam,
        questions: sanitizedQuestions,
        answers: existingAnswers,
      };
    }

    // Check max attempts count
    const studentAttempts = this.state.attempts.filter(
      (a) => a.examId === examId && a.studentId === studentId && a.status === 'submitted'
    );

    if (studentAttempts.length >= exam.rules.maxAttempts) {
      throw new Error(`You have already completed the maximum allowed attempts (${exam.rules.maxAttempts}) for this examination.`);
    }

    // Compute server-authoritative timestamps
    const now = new Date();
    const durationMs = exam.durationMinutes * 60 * 1000;
    const expiresAt = new Date(now.getTime() + durationMs);

    const newAttempt: ExamAttempt = {
      id: generateId('att'),
      examId,
      studentId,
      attemptNumber: studentAttempts.length + 1,
      status: 'in_progress',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isAutoSubmitted: false,
      userAgent: userAgent || navigator.userAgent,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.state.attempts.push(newAttempt);
    this.saveToStorage();

    await this.logAudit({
      actorId: studentId,
      actorName: this.state.currentUser?.fullName || 'Student',
      actorRole: 'student',
      action: 'EXAM_ATTEMPT_STARTED',
      resourceType: 'exam_attempt',
      resourceId: newAttempt.id,
      metadata: { examId, attemptNumber: newAttempt.attemptNumber, durationMinutes: exam.durationMinutes },
    });

    const sanitizedQuestions = this.getSanitizedQuestionsForExam(exam);

    return {
      attempt: newAttempt,
      exam,
      questions: sanitizedQuestions,
      answers: [],
    };
  }

  /**
   * Sanitizes questions to remove answer keys and optionally shuffles
   */
  private getSanitizedQuestionsForExam(exam: Exam): Question[] {
    const rawQuestions: Question[] = (exam.examQuestions || [])
      .map((eq) => {
        const q = this.state.questions.find((quest) => quest.id === eq.questionId);
        if (!q) return null;
        return {
          ...q,
          defaultMarks: eq.marks,
          defaultNegativeMarks: eq.negativeMarks,
        };
      })
      .filter(Boolean) as Question[];

    // 1. Strip sensitive answer keys
    let sanitized: Question[] = rawQuestions.map((q) => {
      const copy: Question = JSON.parse(JSON.stringify(q));
      delete copy.explanation;
      delete copy.rubric;
      delete copy.shortAnswerKey;

      if (copy.options) {
        let opts = copy.options.map((opt) => ({
          id: opt.id,
          questionId: opt.questionId,
          optionText: opt.optionText,
          orderIndex: opt.orderIndex,
        }));
        if (exam.rules.shuffleOptions) {
          opts = shuffleArray(opts);
        }
        copy.options = opts;
      }
      return copy;
    });

    // 2. Shuffle questions if configured
    if (exam.rules.shuffleQuestions) {
      sanitized = shuffleArray(sanitized);
    }

    return sanitized;
  }

  /**
   * Autosaves an answer for an active attempt
   */
  public async saveAnswer(
    attemptId: string,
    studentId: string,
    questionId: string,
    selectedOptionIds: string[],
    textResponse?: string,
    isMarkedForReview: boolean = false
  ): Promise<AttemptAnswer> {
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.studentId !== studentId) throw new Error('Unauthorized');
    if (attempt.status !== 'in_progress') throw new Error('Attempt is no longer in progress');

    // Check expiry
    if (Date.now() >= new Date(attempt.expiresAt).getTime()) {
      await this.submitExamAttempt(attemptId, studentId, true, 'Time expired during autosave');
      throw new Error('Examination time has expired. Your attempt has been submitted.');
    }

    const answerIndex = this.state.answers.findIndex(
      (a) => a.attemptId === attemptId && a.questionId === questionId
    );

    const updatedAnswer: AttemptAnswer = {
      id: answerIndex !== -1 ? this.state.answers[answerIndex].id : generateId('ans'),
      attemptId,
      questionId,
      selectedOptionIds,
      textResponse,
      isMarkedForReview,
      marksObtained: 0,
      answeredAt: new Date().toISOString(),
    };

    if (answerIndex !== -1) {
      this.state.answers[answerIndex] = updatedAnswer;
    } else {
      this.state.answers.push(updatedAnswer);
    }

    this.saveToStorage();
    return updatedAnswer;
  }

  /**
   * Final submission and secure server-side scoring engine
   */
  public async submitExamAttempt(
    attemptId: string,
    studentId: string,
    isAutoSubmitted: boolean = false,
    autoSubmitReason?: string
  ): Promise<ExamResult> {
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    // Idempotency: Return existing result if already submitted
    if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
      const existingResult = this.state.results.find((r) => r.attemptId === attemptId);
      if (existingResult) return existingResult;
    }

    const exam = await this.getExamById(attempt.examId, true);
    if (!exam) throw new Error('Associated examination not found');

    const submittedAnswers = this.state.answers.filter((a) => a.attemptId === attemptId);
    const answersMap = new Map(submittedAnswers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let incorrectCount = 0;
    let answeredCount = 0;
    let totalMarksObtained = 0;
    let hasPendingEssay = false;

    const examQuestions = exam.examQuestions || [];
    const totalQuestionsCount = examQuestions.length;

    // SCORING ENGINE: Evaluates each question securely
    for (const eq of examQuestions) {
      const fullQuestion = this.state.questions.find((q) => q.id === eq.questionId);
      if (!fullQuestion) continue;

      const studentAns = answersMap.get(fullQuestion.id);
      const qMarks = Number(eq.marks) || 1;
      const qNegMarks = exam.rules.negativeMarking ? Number(eq.negativeMarks) || 0 : 0;

      if (!studentAns || (!studentAns.selectedOptionIds?.length && !studentAns.textResponse?.trim())) {
        // Unanswered
        continue;
      }

      answeredCount++;

      if (fullQuestion.questionType === 'mcq' || fullQuestion.questionType === 'true_false') {
        const correctOpt = fullQuestion.options?.find((o) => o.isCorrect);
        const isMatch = correctOpt && studentAns.selectedOptionIds[0] === correctOpt.id;

        if (isMatch) {
          correctCount++;
          studentAns.isCorrect = true;
          studentAns.marksObtained = qMarks;
          totalMarksObtained += qMarks;
        } else {
          incorrectCount++;
          studentAns.isCorrect = false;
          studentAns.marksObtained = -qNegMarks;
          totalMarksObtained -= qNegMarks;
        }
      } else if (fullQuestion.questionType === 'multiple_select') {
        const correctOptIds = (fullQuestion.options || []).filter((o) => o.isCorrect).map((o) => o.id);
        const selectedSet = new Set(studentAns.selectedOptionIds);
        const correctSet = new Set(correctOptIds);

        const isExactMatch =
          correctSet.size === selectedSet.size &&
          [...correctSet].every((id) => selectedSet.has(id));

        if (isExactMatch) {
          correctCount++;
          studentAns.isCorrect = true;
          studentAns.marksObtained = qMarks;
          totalMarksObtained += qMarks;
        } else {
          incorrectCount++;
          studentAns.isCorrect = false;
          studentAns.marksObtained = -qNegMarks;
          totalMarksObtained -= qNegMarks;
        }
      } else if (fullQuestion.questionType === 'short_answer') {
        const key = fullQuestion.shortAnswerKey?.trim().toLowerCase() || '';
        const given = studentAns.textResponse?.trim().toLowerCase() || '';

        if (key && given === key) {
          correctCount++;
          studentAns.isCorrect = true;
          studentAns.marksObtained = qMarks;
          totalMarksObtained += qMarks;
        } else {
          incorrectCount++;
          studentAns.isCorrect = false;
          studentAns.marksObtained = -qNegMarks;
          totalMarksObtained -= qNegMarks;
        }
      } else if (fullQuestion.questionType === 'essay') {
        // Essay questions require instructor manual grading
        hasPendingEssay = true;
        studentAns.isCorrect = undefined;
        studentAns.marksObtained = 0;
      }
    }

    // Clamp marks obtained to 0 minimum
    totalMarksObtained = Math.max(0, Math.round(totalMarksObtained * 100) / 100);
    const unansweredCount = Math.max(0, totalQuestionsCount - answeredCount);
    const percentage = exam.totalMarks > 0
      ? Math.round((totalMarksObtained / exam.totalMarks) * 10000) / 100
      : 0;
    const isPassed = percentage >= exam.passPercentage;

    // Lock attempt
    attempt.status = 'submitted';
    attempt.submittedAt = new Date().toISOString();
    attempt.isAutoSubmitted = isAutoSubmitted;
    attempt.autoSubmitReason = autoSubmitReason;
    attempt.updatedAt = new Date().toISOString();

    // Create Result
    const newResult: ExamResult = {
      id: generateId('res'),
      attemptId,
      examId: exam.id,
      studentId,
      totalQuestions: totalQuestionsCount,
      answeredQuestions: answeredCount,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unansweredQuestions: unansweredCount,
      totalMarks: exam.totalMarks,
      marksObtained: totalMarksObtained,
      percentage,
      isPassed,
      hasPendingEssay,
      generatedAt: new Date().toISOString(),
    };

    this.state.results.push(newResult);
    this.saveToStorage();

    await this.logAudit({
      actorId: studentId,
      actorName: this.state.currentUser?.fullName || 'Student',
      actorRole: 'student',
      action: isAutoSubmitted ? 'EXAM_AUTO_SUBMITTED' : 'EXAM_SUBMITTED',
      resourceType: 'exam_attempt',
      resourceId: attemptId,
      metadata: {
        score: totalMarksObtained,
        percentage,
        isPassed,
        isAutoSubmitted,
        reason: autoSubmitReason,
      },
    });

    return newResult;
  }

  /**
   * Instructor/Admin manual essay grading
   */
  public async gradeEssaySubmission(
    attemptAnswerId: string,
    graderId: string,
    marksAwarded: number,
    feedback?: string
  ): Promise<ExamResult> {
    const answer = this.state.answers.find((a) => a.id === attemptAnswerId);
    if (!answer) throw new Error('Attempt answer not found');

    const attempt = this.state.attempts.find((a) => a.id === answer.attemptId);
    if (!attempt) throw new Error('Associated attempt not found');

    const result = this.state.results.find((r) => r.attemptId === attempt.id);
    if (!result) throw new Error('Associated result not found');

    // Create or update Essay Grade
    const existingGradeIdx = this.state.essayGrades.findIndex(
      (g) => g.attemptAnswerId === attemptAnswerId
    );
    const newGrade: EssayGrade = {
      id: existingGradeIdx !== -1 ? this.state.essayGrades[existingGradeIdx].id : generateId('grade'),
      attemptAnswerId,
      graderId,
      marksAwarded: Number(marksAwarded),
      feedback,
      isFinal: true,
      gradedAt: new Date().toISOString(),
    };

    if (existingGradeIdx !== -1) {
      this.state.essayGrades[existingGradeIdx] = newGrade;
    } else {
      this.state.essayGrades.push(newGrade);
    }

    // Update answer marks
    answer.marksObtained = Number(marksAwarded);
    answer.isCorrect = marksAwarded > 0;

    // Recalculate result marks & check if any more essays are pending
    const allAttemptAnswers = this.state.answers.filter((a) => a.attemptId === attempt.id);
    const exam = await this.getExamById(attempt.examId, true);
    if (!exam) throw new Error('Exam not found');

    const totalMarksObtained = allAttemptAnswers.reduce((sum, a) => sum + (Number(a.marksObtained) || 0), 0);
    result.marksObtained = Math.max(0, Math.round(totalMarksObtained * 100) / 100);
    result.percentage = exam.totalMarks > 0
      ? Math.round((result.marksObtained / exam.totalMarks) * 10000) / 100
      : 0;
    result.isPassed = result.percentage >= exam.passPercentage;

    // Check if there are other ungraded essay questions
    const essayQuestionIds = (exam.examQuestions || [])
      .filter((eq) => {
        const q = this.state.questions.find((quest) => quest.id === eq.questionId);
        return q?.questionType === 'essay';
      })
      .map((eq) => eq.questionId);

    const gradedAnswerIds = new Set(this.state.essayGrades.map((g) => g.attemptAnswerId));
    const pendingEssays = allAttemptAnswers.filter(
      (a) => essayQuestionIds.includes(a.questionId) && !gradedAnswerIds.has(a.id)
    );

    result.hasPendingEssay = pendingEssays.length > 0;
    this.saveToStorage();

    await this.logAudit({
      actorId: graderId,
      actorName: this.state.currentUser?.fullName || 'Instructor',
      actorRole: 'instructor',
      action: 'ESSAY_GRADED',
      resourceType: 'essay_grade',
      resourceId: newGrade.id,
      metadata: { attemptAnswerId, marksAwarded, studentId: attempt.studentId },
    });

    return result;
  }

  // ==========================================
  // SECURITY & PROCTORING EVENTS
  // ==========================================
  public async logSecurityEvent(
    attemptId: string,
    studentId: string,
    eventType: SecurityEventType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: string
  ): Promise<{ event: SecurityEvent; autoSubmitted: boolean; warningCount: number }> {
    const newEvent: SecurityEvent = {
      id: generateId('sec'),
      attemptId,
      studentId,
      eventType,
      severity,
      details,
      timestamp: new Date().toISOString(),
    };

    this.state.securityEvents.unshift(newEvent);

    // Check thresholds configured on the exam
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    let autoSubmitted = false;
    let warningCount = 0;

    if (attempt && attempt.status === 'in_progress') {
      const exam = this.state.exams.find((e) => e.id === attempt.examId);
      const attemptEvents = this.state.securityEvents.filter((e) => e.attemptId === attemptId);
      warningCount = attemptEvents.length;

      const autoSubmitLimit = exam?.securitySettings?.autoSubmitThreshold || 5;

      if (warningCount >= autoSubmitLimit) {
        await this.submitExamAttempt(
          attemptId,
          studentId,
          true,
          `Security violation threshold exceeded (${warningCount} violations recorded: ${eventType})`
        );
        autoSubmitted = true;
      }
    }

    this.saveToStorage();
    return { event: newEvent, autoSubmitted, warningCount };
  }

  public async getSecurityEvents(attemptId?: string): Promise<SecurityEvent[]> {
    if (attemptId) {
      return this.state.securityEvents.filter((e) => e.attemptId === attemptId);
    }
    return this.state.securityEvents;
  }

  // ==========================================
  // RESULTS & ATTEMPTS RETRIEVAL
  // ==========================================
  public async getExamResults(filters?: {
    examId?: string;
    studentId?: string;
    isPassed?: boolean;
  }): Promise<ExamResult[]> {
    return this.state.results.filter((res) => {
      if (filters?.examId && res.examId !== filters.examId) return false;
      if (filters?.studentId && res.studentId !== filters.studentId) return false;
      if (filters?.isPassed !== undefined && res.isPassed !== filters.isPassed) return false;
      return true;
    });
  }

  public async getResultById(resultId: string): Promise<{
    result: ExamResult;
    exam: Exam;
    attempt: ExamAttempt;
    student: UserProfile;
    answers: AttemptAnswer[];
    questions: Question[];
  } | null> {
    const result = this.state.results.find((r) => r.id === resultId);
    if (!result) return null;

    const exam = await this.getExamById(result.examId, true);
    const attempt = this.state.attempts.find((a) => a.id === result.attemptId);
    const student = this.state.profiles.find((p) => p.id === result.studentId);
    const answers = this.state.answers.filter((a) => a.attemptId === result.attemptId);

    if (!exam || !attempt || !student) return null;

    // Only include explanations and correct answers if exam rules allow or user is instructor/admin
    const isPrivileged = this.state.currentUser?.role === 'admin' || this.state.currentUser?.role === 'instructor';
    const canViewAnswers = isPrivileged || exam.rules.showResultImmediately;

    const questions = (exam.examQuestions || []).map((eq) => {
      const q = this.state.questions.find((quest) => quest.id === eq.questionId);
      if (!q) return null;
      if (!canViewAnswers) {
        const stripped = JSON.parse(JSON.stringify(q)) as Question;
        stripped.options?.forEach((o) => delete o.isCorrect);
        delete stripped.explanation;
        delete stripped.rubric;
        delete stripped.shortAnswerKey;
        return stripped;
      }
      return q;
    }).filter(Boolean) as Question[];

    return { result, exam, attempt, student, answers, questions };
  }

  public async getPendingEssayGradingList(): Promise<{
    answer: AttemptAnswer;
    question: Question;
    exam: Exam;
    student: UserProfile;
    attempt: ExamAttempt;
    grade?: EssayGrade;
  }[]> {
    const essayQuestions = this.state.questions.filter((q) => q.questionType === 'essay');
    const essayQuestionIds = new Set(essayQuestions.map((q) => q.id));

    const essayAnswers = this.state.answers.filter((a) => essayQuestionIds.has(a.questionId));
    const gradesMap = new Map(this.state.essayGrades.map((g) => [g.attemptAnswerId, g]));

    const items = [];
    for (const ans of essayAnswers) {
      const attempt = this.state.attempts.find((a) => a.id === ans.attemptId);
      if (!attempt || attempt.status !== 'submitted') continue;

      const question = essayQuestions.find((q) => q.id === ans.questionId);
      const exam = this.state.exams.find((e) => e.id === attempt.examId);
      const student = this.state.profiles.find((p) => p.id === attempt.studentId);

      if (question && exam && student) {
        items.push({
          answer: ans,
          question,
          exam,
          student,
          attempt,
          grade: gradesMap.get(ans.id),
        });
      }
    }

    return items;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  public async logAudit(entry: {
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const log: AuditLog = {
      id: generateId('aud'),
      actorId: entry.actorId || this.state.currentUser?.id,
      actorName: entry.actorName || this.state.currentUser?.fullName || 'System',
      actorRole: entry.actorRole || this.state.currentUser?.role || 'system',
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata || {},
      timestamp: new Date().toISOString(),
    };

    this.state.auditLogs.unshift(log);
    this.saveToStorage();
    return log;
  }

  public async getAuditLogs(filters?: {
    action?: string;
    resourceType?: string;
    actorId?: string;
  }): Promise<AuditLog[]> {
    return this.state.auditLogs.filter((log) => {
      if (filters?.action && log.action !== filters.action) return false;
      if (filters?.resourceType && log.resourceType !== filters.resourceType) return false;
      if (filters?.actorId && log.actorId !== filters.actorId) return false;
      return true;
    });
  }

  // ==========================================
  // ANALYTICS & DASHBOARD METRICS
  // ==========================================
  public async getAdminDashboardMetrics() {
    const totalStudents = this.state.profiles.filter((p) => p.role === 'student').length;
    const totalInstructors = this.state.profiles.filter((p) => p.role === 'instructor').length;
    const totalQuestions = this.state.questions.length;
    const totalExams = this.state.exams.length;
    const draftExams = this.state.exams.filter((e) => e.status === 'draft').length;
    const scheduledExams = this.state.exams.filter((e) => e.status === 'scheduled').length;
    const liveExams = this.state.exams.filter((e) => e.status === 'live').length;
    const completedExams = this.state.exams.filter((e) => e.status === 'completed').length;
    const totalAttempts = this.state.attempts.length;

    const results = this.state.results;
    const averageScore = results.length > 0
      ? Math.round((results.reduce((acc, r) => acc + r.percentage, 0) / results.length) * 10) / 10
      : 0;
    const passedCount = results.filter((r) => r.isPassed).length;
    const passPercentage = results.length > 0
      ? Math.round((passedCount / results.length) * 100)
      : 0;

    return {
      totalStudents,
      totalInstructors,
      totalQuestions,
      totalExams,
      draftExams,
      scheduledExams,
      liveExams,
      completedExams,
      totalAttempts,
      averageScore,
      passPercentage,
      recentActivity: this.state.auditLogs.slice(0, 10),
      recentSecurityEvents: this.state.securityEvents.slice(0, 6),
      recentResults: results.slice(0, 5),
    };
  }
}

export const dbService = new DatabaseService();
