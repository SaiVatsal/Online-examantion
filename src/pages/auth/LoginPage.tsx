import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
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
        setErrorMsg('Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your institutional credentials to access the examination portal
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@examflow.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        <Button type="submit" variant="primary" className="w-full cursor-pointer" isLoading={isLoading}>
          Sign In
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      <div className="text-center pt-1">
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
