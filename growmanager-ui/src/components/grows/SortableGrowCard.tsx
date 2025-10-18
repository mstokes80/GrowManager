import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Grow } from '@/services/growsApi';
import { GrowCard } from './GrowCard';
import { GripVertical } from 'lucide-react';

interface SortableGrowCardProps {
  grow: Grow;
  onClick?: () => void;
}

/**
 * SortableGrowCard - Wrapper around GrowCard that adds drag and drop functionality
 * Uses @dnd-kit/sortable for drag and drop support
 */
export function SortableGrowCard({ grow, onClick }: SortableGrowCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grow.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()} // Prevent card click when grabbing handle
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {/* Card with left padding for drag handle */}
      <div className="pl-10">
        <GrowCard grow={grow} onClick={onClick} />
      </div>
    </div>
  );
}