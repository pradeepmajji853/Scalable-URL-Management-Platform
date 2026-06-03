import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { authApi } from '../api/auth';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Reset email sent successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a link to recover your password">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            If an account exists for <span className="font-semibold text-surface-900 dark:text-surface-100">{email}</span>, 
            you'll receive an email shortly with instructions on how to reset your password.
          </p>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 py-3 rounded-xl border border-surface-200 dark:border-surface-700 transition-all active:scale-[0.98]"
          >
            <span>Back to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to recover your account">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          autoFocus
          required
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Send Reset Link
        </Button>

        <p className="text-sm text-center text-surface-500 dark:text-surface-400 mt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
