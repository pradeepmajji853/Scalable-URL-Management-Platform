import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Invalid email or password');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your branded URLs">
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

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-500 hover:text-primary-600 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center animate-slide-down">
            {error}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>

        <p className="text-sm text-center text-surface-500 dark:text-surface-400 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-semibold">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
