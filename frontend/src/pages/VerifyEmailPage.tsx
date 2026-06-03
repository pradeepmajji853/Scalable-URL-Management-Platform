import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '../api/auth';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        toast.success('Email verified successfully!');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      });
  }, [token]);

  return (
    <AuthLayout title="Account Verification" subtitle="Checking your email validation status">
      <div className="text-center py-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
            <p className="text-sm text-surface-500 dark:text-surface-400">Verifying your account, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300 font-medium">
              Congratulations! Your email has been verified successfully. You can now access all Linkly features.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-sm text-red-500 font-medium">{message}</p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 py-3 rounded-xl border border-surface-200 dark:border-surface-700 transition-all active:scale-[0.98]"
            >
              Back to Log In
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
