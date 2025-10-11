import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface DeleteGrowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  growName: string;
  isDeleting?: boolean;
}

/**
 * DeleteGrowDialog - Confirmation dialog for deleting a grow
 * Requires user to type the exact grow name to confirm deletion
 * Implements Task Group 5.2.6 delete confirmation
 */
export function DeleteGrowDialog({
  isOpen,
  onClose,
  onConfirm,
  growName,
  isDeleting = false,
}: DeleteGrowDialogProps) {
  const [confirmationName, setConfirmationName] = useState('');

  // Reset confirmation name when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationName('');
      onClose();
    }
  };

  // Check if the entered name matches (case-insensitive)
  const isNameMatch = confirmationName.trim().toLowerCase() === growName.toLowerCase();

  const handleConfirm = () => {
    if (isNameMatch) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Permanently delete {growName}?
          </DialogTitle>
          <DialogDescription className="pt-2">
            This action cannot be undone. All plants, photos, and data associated with this grow
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmationName">
              Type the grow name to confirm deletion
            </Label>
            <Input
              id="confirmationName"
              type="text"
              placeholder={growName}
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          {confirmationName && !isNameMatch && (
            <p className="text-sm text-muted-foreground">
              The grow name does not match. Please try again.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isNameMatch || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}