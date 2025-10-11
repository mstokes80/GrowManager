import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyEmail, resendVerification } from '@/services/authApi';
import { CheckCircle, XCircle, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type VerificationState = 'verifying' | 'success' | 'error' | 'manual';

/**
 * VerifyEmailPage - Email verification flow
 * Implements Task Group 4.3.4
 *
 * Handles two scenarios:
 * 1. Automatic verification when user clicks link in email (token in URL)
 * 2. Manual resend verification email form
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('manual');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState('');

  // Auto-verify if token is present in URL
  const verifyMutation = useMutation({
    mutationFn: (token: string) => verifyEmail(token),
    onSuccess: () => {
      setState('success');
      toast({
        title: 'Email Verified!',
        description: 'Your account has been successfully verified.',
      });
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: any) => {
      setState('error');
      setErrorMessage(
        error.response?.data?.message ||
        'Verification failed. The link may be expired or invalid.'
      );
    },
  });

  // Resend verification email
  const resendMutation = useMutation({
    mutationFn: (email: string) => resendVerification(email),
    onSuccess: () => {
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox for the verification link.',
      });
      setEmail('');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Failed to Send',
        description: 'Unable to send verification email. Please try again.',
      });
    },
  });

  // Auto-verify on component mount if token is present
  useEffect(() => {
    if (token) {
      setState('verifying');
      verifyMutation.mutate(token);
    }
  }, [token]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      resendMutation.mutate(email);
    }
  };

  // Verification in progress
  if (state === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Verification successful
  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your account has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You can now log in to access your grow journal.
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting you to the login page...
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Verification failed
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Verification Failed</CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              The verification link may have expired or is invalid.
              You can request a new verification email below.
            </p>

            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resendMutation.isPending || !email}
              >
                {resendMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Manual resend form (no token in URL)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter your email to receive a verification link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                You need to verify your email address before you can access your account.
                Check your inbox for the verification link, or request a new one below.
              </span>
            </p>
          </div>

          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resendMutation.isPending || !email}
            >
              {resendMutation.isPending ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            Make sure to check your spam folder if you don't see the email.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}