import { ReactElement, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { exportToCSV } from '@/utils/chartUtils';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: ReactElement;
  isLoading?: boolean;
  error?: string | null;
  data?: Record<string, any>[];
  exportFilename?: string;
  height?: number | string;
  className?: string;
  actions?: ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
}

/**
 * ChartWrapper - Reusable wrapper component for charts
 * Provides consistent styling, loading states, error handling, and export functionality
 */
export function ChartWrapper({
  title,
  description,
  children,
  isLoading = false,
  error = null,
  data = [],
  exportFilename = 'chart-data.csv',
  height = 300,
  className = '',
  actions,
  emptyMessage = 'No data available',
  emptyIcon,
}: ChartWrapperProps) {
  const handleExport = () => {
    if (data && data.length > 0) {
      exportToCSV(data, exportFilename);
    }
  };

  const showExportButton = data && data.length > 0 && !isLoading && !error;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {showExportButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
          >
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="flex items-center justify-center"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
          >
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Error loading chart</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
          >
            <div className="text-center">
              {emptyIcon || <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />}
              <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height={typeof height === 'number' ? height : undefined}>
            {children}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}