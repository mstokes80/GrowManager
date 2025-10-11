import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { login } from '@/services/authApi';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Validation schema using Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * LoginPage - User login with email and password
 * Implements Task Group 4.3.2
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      const errorData = error.response?.data;

      // Handle email not verified error (403)
      if (error.response?.status === 403 || errorData?.code === 'EMAIL_NOT_VERIFIED') {
        setShowVerificationMessage(true);
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please verify your email address before logging in.',
        });
      } else if (error.response?.status === 401) {
        // Invalid credentials
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      } else {
        // Other errors
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorData?.message || 'An unexpected error occurred. Please try again.',
        });
      }
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setShowVerificationMessage(false);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in onError callback
      console.error('Login error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your grow journal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showVerificationMessage && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 mb-2">
              Your email address is not verified. Please check your inbox for the verification link.
            </p>
            <Link
              to="/verify-email"
              className="text-sm text-primary hover:underline font-medium"
            >
              Resend verification email
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                autoComplete="email"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <Checkbox
              id="rememberMe"
              label="Remember me"
              {...register('rememberMe')}
            />
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Create Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}