import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plant } from '@/types/plant';
import { PlantCard } from './PlantCard';
import { GripVertical } from 'lucide-react';

interface SortablePlantCardProps {
  plant: Plant;
  onClick?: () => void;
  onCopy?: (plant: Plant) => void;
}

/**
 * SortablePlantCard - Wrapper around PlantCard that adds drag and drop functionality
 * Uses @dnd-kit/sortable for drag and drop support
 */
export function SortablePlantCard({ plant, onClick, onCopy }: SortablePlantCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plant.id });

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
        <PlantCard plant={plant} onClick={onClick} onCopy={onCopy} />
      </div>
    </div>
  );
}