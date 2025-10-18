import { cn } from '@/lib/utils';

export interface PasswordStrength {
  score: number; // 0-4
  label: string; // 'Weak', 'Fair', 'Good', 'Strong'
  color: string; // Tailwind color class
}

export interface PasswordStrengthProps {
  password: string;
  className?: string;
}

/**
 * Calculate password strength based on various criteria
 * Returns a score from 0 (weakest) to 4 (strongest)
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: '', color: 'bg-muted' };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
  if (/\d/.test(password)) score++; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters

  // Cap score at 4
  score = Math.min(score, 4);

  // Determine label and color based on score
  if (score === 0) {
    return { score: 0, label: '', color: 'bg-muted' };
  } else if (score === 1) {
    return { score: 1, label: 'Weak', color: 'bg-destructive' };
  } else if (score === 2) {
    return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  } else if (score === 3) {
    return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  } else {
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  }
};

/**
 * PasswordStrength component displays a visual indicator of password strength
 * Shows a progress bar and label based on password complexity
 */
export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              level <= strength.score ? strength.color : 'bg-muted'
            )}
            role="presentation"
          />
        ))}
      </div>

      {/* Strength label */}
      {strength.label && (
        <p
          className={cn('text-xs font-medium', {
            'text-destructive': strength.score <= 1,
            'text-orange-500': strength.score === 2,
            'text-yellow-600': strength.score === 3,
            'text-green-600': strength.score === 4,
          })}
          role="status"
          aria-live="polite"
        >
          Password strength: {strength.label}
        </p>
      )}

      {/* Requirements hint for weak passwords */}
      {strength.score < 3 && (
        <p className="text-xs text-muted-foreground">
          Use 8+ characters with uppercase, lowercase, and numbers
        </p>
      )}
    </div>
  );
}