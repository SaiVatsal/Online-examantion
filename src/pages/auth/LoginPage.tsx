import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Sparkles,
  Zap,
  Dice5,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { Captcha } from '../../components/auth/Captcha';
import { detectSqlInjection } from '../../lib/security';

const FUN_QUOTES = [
  "🚀 Exam Tip #1: If you don't know the answer, choose option 'C' with 100% unearned confidence!",
  "☕ Coffee converted into code. Brain running on 120 FPS. Wi-Fi: Strong. Let's conquer this test!",
  "🧠 Exam Rule #42: Time flies at lightspeed during tests, but moves at 1G dial-up while waiting for results!",
  "🐛 Fun Fact: Bugs are just undocumented features, but negative markings are definitely real. Choose wisely!",
  "🎓 V Surendra (2500040073) & K Dileep Kumar (2500040145) wish you the highest percentile today! You got this!",
  "👾 Keep calm! Refreshing the page won't change your questions, but it will definitely stress the proctor! 😂",
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sqlWarning, setSqlWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Captcha state
  const [captchaInput, setCaptchaInput] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Fun quote state
  const [funQuoteIndex, setFunQuoteIndex] = useState(0);

  const { login, openJwtModal, jwtToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Handle email changes with real-time SQL Injection detection
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const sqli = detectSqlInjection(val);
    if (sqli.hasSqlInjection) {
      setSqlWarning(`SQL Injection Pattern Intercepted: "${sqli.matchedPattern}" (${sqli.threatType}). Input neutralized by parameter shield!`);
    } else {
      setSqlWarning(null);
    }
  };

  const nextFunQuote = () => {
    setFunQuoteIndex((prev) => (prev + 1) % FUN_QUOTES.length);
  };

  // Demo credential autofillers
  const fillCredentials = (type: 'admin' | 'surendra' | 'dileep') => {
    setErrorMsg('');
    setSqlWarning(null);
    if (type === 'admin') {
      setEmail('admin@examflow.edu');
      setPassword('admin123');
    } else if (type === 'surendra') {
      setEmail('surendra@examflow.edu');
      setPassword('student123');
    } else if (type === 'dileep') {
      setEmail('dileep@examflow.edu');
      setPassword('student123');
    }
  };

  const testSqlInjectionAttempt = () => {
    const maliciousPayload = "' OR '1'='1' --";
    setEmail(maliciousPayload);
    const sqli = detectSqlInjection(maliciousPayload);
    if (sqli.hasSqlInjection) {
      setSqlWarning(`Simulated Attack: "${sqli.matchedPattern}" (${sqli.threatType}) blocked! Queries use safe parameterized execution.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your institutional email or registration number');
      return;
    }

    // Anti-SQL Injection validation check
    const sqli = detectSqlInjection(email);
    if (sqli.hasSqlInjection) {
      setErrorMsg(`Authentication Blocked: Malicious SQL pattern "${sqli.matchedPattern}" detected.`);
      return;
    }

    // Captcha validation check
    if (!isCaptchaValid) {
      setErrorMsg('Please complete the security CAPTCHA verification correctly before signing in.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        if (from !== '/') {
          navigate(from, { replace: true });
        } else if (email.includes('admin')) {
          navigate('/admin', { replace: true });
        } else if (email.includes('instructor')) {
          navigate('/instructor', { replace: true });
        } else {
          navigate('/student/exams', { replace: true });
        }
      } else {
        setErrorMsg('Invalid credentials. Check your email/registration number and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your institutional credentials to access the examination portal
        </p>
      </div>

      {/* FUN TEXT / HUMOR SECTION */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Exam Day Mood Booster & Fun Zone 😂
          </span>
          <button
            type="button"
            onClick={nextFunQuote}
            className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 hover:text-amber-900 font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 transition-colors"
            title="Next funny quote"
          >
            <Dice5 className="h-3 w-3" />
            Next Joke
          </button>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300 italic">
          "{FUN_QUOTES[funQuoteIndex]}"
        </p>
      </div>

      {/* STUDENT & ADMIN CREDENTIALS WITH CANDIDATE NAMES */}
      <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            Student & Admin Portal Credentials:
          </p>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            Official Project
          </span>
        </div>

        {/* Admin Credentials */}
        <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
          <div className="text-xs text-blue-950 dark:text-blue-100 space-y-0.5">
            <div className="font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block"></span>
              Admin Account:
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              admin@examflow.edu • Password: <span className="font-semibold text-foreground">admin123</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fillCredentials('admin')}
            className="text-[11px] px-2 py-1 font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Zap className="h-3 w-3" /> Fill Admin
          </button>
        </div>

        {/* Student 1: V Surendra */}
        <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
          <div className="text-xs text-blue-950 dark:text-blue-100 space-y-0.5">
            <div className="font-bold flex items-center gap-1 text-primary">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Student: V Surendra
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              ID: <strong className="text-foreground">2500040073</strong> • surendra@examflow.edu
            </div>
          </div>
          <button
            type="button"
            onClick={() => fillCredentials('surendra')}
            className="text-[11px] px-2 py-1 font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Zap className="h-3 w-3" /> Fill V Surendra
          </button>
        </div>

        {/* Student 2: K Dileep Kumar */}
        <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
          <div className="text-xs text-blue-950 dark:text-blue-100 space-y-0.5">
            <div className="font-bold flex items-center gap-1 text-primary">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Student: K Dileep Kumar
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              ID: <strong className="text-foreground">2500040145</strong> • dileep@examflow.edu
            </div>
          </div>
          <button
            type="button"
            onClick={() => fillCredentials('dileep')}
            className="text-[11px] px-2 py-1 font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Zap className="h-3 w-3" /> Fill K Dileep
          </button>
        </div>
      </div>

      {/* SECURITY FEATURES BAR (JWT & Anti-SQL Injection) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-border text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>No SQL Injection (Parameterized Protection)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={testSqlInjectionAttempt}
            className="text-[10px] text-muted-foreground hover:text-red-600 underline font-mono cursor-pointer"
            title="Click to test anti-SQL injection interceptor"
          >
            Test SQLi Block
          </button>
          <button
            type="button"
            onClick={openJwtModal}
            className="px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <KeyRound className="h-3 w-3" />
            JWT Active ({jwtToken ? 'Signed' : 'HS256'})
          </button>
        </div>
      </div>

      {/* SQL INJECTION WARNING ALERT */}
      {sqlWarning && (
        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Security Guard Triggered:</strong> {sqlWarning}
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address or Registration Number"
          type="text"
          placeholder="e.g. surendra@examflow.edu or 2500040073"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* SECURITY CAPTCHA COMPONENT */}
        <Captcha
          onVerify={setIsCaptchaValid}
          userInput={captchaInput}
          onUserInputChange={setCaptchaInput}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full cursor-pointer h-10 font-semibold"
          isLoading={isLoading}
        >
          Sign In to Examination Portal
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      <div className="text-center pt-1 border-t border-border mt-4">
        <p className="text-xs text-muted-foreground">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
