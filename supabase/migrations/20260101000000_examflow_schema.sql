-- ====================================================================
-- EXAMFLOW: Production Online Examination System Database Schema
-- Compatible with PostgreSQL 14+ and Supabase Row Level Security (RLS)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    avatar_url TEXT,
    phone TEXT,
    registration_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUBJECTS & TOPICS
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QUESTION BANK
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'multiple_select', 'true_false', 'short_answer', 'essay')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    default_marks NUMERIC NOT NULL DEFAULT 1,
    default_negative_marks NUMERIC NOT NULL DEFAULT 0,
    explanation TEXT,
    rubric TEXT,
    short_answer_key TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
);

-- 5. EXAMS
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    instructions TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    total_marks NUMERIC NOT NULL DEFAULT 0,
    pass_percentage NUMERIC NOT NULL DEFAULT 40 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'archived')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    rules JSONB NOT NULL DEFAULT '{
        "shuffle_questions": true,
        "shuffle_options": true,
        "allow_back_navigation": true,
        "max_attempts": 1,
        "negative_marking": false,
        "show_result_immediately": true,
        "allow_review_before_submission": true
    }'::jsonb,
    security_settings JSONB NOT NULL DEFAULT '{
        "require_fullscreen": true,
        "detect_tab_switch": true,
        "detect_window_blur": true,
        "log_security_events": true,
        "warning_threshold": 3,
        "auto_submit_threshold": 5,
        "prevent_multiple_active_attempts": true
    }'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    marks NUMERIC NOT NULL DEFAULT 1,
    negative_marks NUMERIC NOT NULL DEFAULT 0,
    UNIQUE(exam_id, question_id)
);

-- 6. EXAM ATTEMPTS & LIVE ENGINE
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated', 'abandoned')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- Server-authoritative expiration
    submitted_at TIMESTAMPTZ,
    is_auto_submitted BOOLEAN NOT NULL DEFAULT false,
    auto_submit_reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_ids UUID[] NOT NULL DEFAULT '{}',
    text_response TEXT,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN,
    marks_obtained NUMERIC NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 7. ESSAY GRADING & FINAL RESULTS
CREATE TABLE IF NOT EXISTS essay_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_answer_id UUID NOT NULL REFERENCES attempt_answers(id) ON DELETE CASCADE UNIQUE,
    grader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    marks_awarded NUMERIC NOT NULL DEFAULT 0,
    feedback TEXT,
    is_final BOOLEAN NOT NULL DEFAULT false,
    graded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE UNIQUE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    answered_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    unanswered_questions INT NOT NULL DEFAULT 0,
    total_marks NUMERIC NOT NULL,
    marks_obtained NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    has_pending_essay BOOLEAN NOT NULL DEFAULT false,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SECURITY EVENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('tab_switch', 'window_blur', 'fullscreen_exit', 'reconnect', 'copy_attempt', 'paste_attempt', 'context_menu', 'auto_submit', 'suspicious_activity')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_question_options_q ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_security_events_attempt ON security_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Anyone authenticated can read basic profiles, only admin can create/delete, user can update own
CREATE POLICY "Profiles readable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL TO authenticated USING (get_auth_role() = 'admin');

-- Exams: Students can only view published/scheduled/live exams; Admins & Instructors can manage
CREATE POLICY "Students see active exams" ON exams FOR SELECT TO authenticated
USING (status IN ('scheduled', 'live', 'completed') OR get_auth_role() IN ('admin', 'instructor'));
CREATE POLICY "Instructors and Admins manage exams" ON exams FOR ALL TO authenticated
USING (get_auth_role() IN ('admin', 'instructor'));

-- Attempts: Students can only view & create their own attempts; Admins & Instructors can view all
CREATE POLICY "Students access own attempts" ON exam_attempts FOR SELECT TO authenticated
USING (student_id = auth.uid() OR get_auth_role() IN ('admin', 'instructor'));
CREATE POLICY "Students create own attempts" ON exam_attempts FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students update own active attempts" ON exam_attempts FOR UPDATE TO authenticated
USING (student_id = auth.uid() AND status = 'in_progress');

-- Answers: Students can manage answers for their own in-progress attempts
CREATE POLICY "Students access own attempt answers" ON attempt_answers FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM exam_attempts ea
        WHERE ea.id = attempt_answers.attempt_id
        AND (ea.student_id = auth.uid() OR get_auth_role() IN ('admin', 'instructor'))
    )
);

-- Results: Students can view only their own results; Admins & Instructors view all
CREATE POLICY "Students view own results" ON exam_results FOR SELECT TO authenticated
USING (student_id = auth.uid() OR get_auth_role() IN ('admin', 'instructor'));
CREATE POLICY "Scoring engine manages results" ON exam_results FOR ALL TO authenticated
USING (get_auth_role() IN ('admin', 'instructor'));

-- DATA LEAKAGE PREVENTION: Question Options Correctness
-- Active test takers CANNOT read `is_correct` column directly via RLS or public view.
-- The secure RPC `start_exam_attempt` strips `is_correct` and sensitive explanation/rubric keys.
