import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(name, email, password, confirmPassword);
      toast.success('Account created successfully! Please verify your email.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register account';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Get started with Linkly" subtitle="Create your free account today">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<UserIcon className="w-5 h-5" />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          required
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center animate-slide-down">
            {error}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Sign Up
        </Button>

        <p className="text-sm text-center text-surface-500 dark:text-surface-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
