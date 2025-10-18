import { Cultivar } from '@/services/cultivarsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';

interface CultivarCardProps {
  cultivar: Cultivar;
  onClick?: () => void;
  usageCount?: number;
}

/**
 * CultivarCard displays a cultivar in a card format
 * Shows name, breeder, type badge, and usage count
 */
export function CultivarCard({ cultivar, onClick, usageCount = 0 }: CultivarCardProps) {
  const getTypeColor = (type: Cultivar['type']): 'success' | 'info' | 'warning' | 'secondary' => {
    switch (type) {
      case 'indica':
        return 'info';
      case 'sativa':
        return 'success';
      case 'hybrid':
        return 'warning';
      case 'auto':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Leaf className="h-5 w-5 text-green-600 flex-shrink-0" />
            <CardTitle className="text-lg truncate">{cultivar.name}</CardTitle>
          </div>
          <Badge variant={getTypeColor(cultivar.type)} className="flex-shrink-0">
            {cultivar.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {cultivar.breeder && (
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-medium">Breeder:</span> {cultivar.breeder}
            </p>
          )}
          {cultivar.genetics && (
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-medium">Genetics:</span> {cultivar.genetics}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Used by {usageCount} {usageCount === 1 ? 'plant' : 'plants'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}