import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface DeleteCultivarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cultivarName: string;
  usageCount: number;
  isDeleting?: boolean;
}

/**
 * DeleteCultivarDialog - Confirmation dialog for deleting a cultivar
 * Shows warning if cultivar is in use by plants
 */
export function DeleteCultivarDialog({
  isOpen,
  onClose,
  onConfirm,
  cultivarName,
  usageCount,
  isDeleting = false,
}: DeleteCultivarDialogProps) {
  const hasUsage = usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Cultivar
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold">{cultivarName}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Warning:</span> This cultivar is currently used by{' '}
              {usageCount} {usageCount === 1 ? 'plant' : 'plants'}. Deleting this cultivar will
              unlink it from {usageCount === 1 ? 'that plant' : 'those plants'}.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}