import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Reset your password</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your registered institutional email to receive recovery instructions
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Password Reset Email Sent
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            If an account exists for <span className="font-semibold">{email}</span>, a secure password reset link has been dispatched.
          </p>
          <div className="pt-2">
            <Link to="/login" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline">
              Return to login
            </Link>
          </div>
        </div>
      ) : (
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

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Send Recovery Link
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
