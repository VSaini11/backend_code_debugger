import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    critical: {
      className: 'bg-destructive text-destructive-foreground',
      icon: AlertTriangle,
      label: 'Critical',
    },
    high: {
      className: 'bg-orange-500 text-white',
      icon: AlertCircle,
      label: 'High',
    },
    medium: {
      className: 'bg-yellow-500 text-white',
      icon: AlertCircle,
      label: 'Medium',
    },
    low: {
      className: 'bg-blue-500 text-white',
      icon: Info,
      label: 'Low',
    },
  };

  const { className, icon: Icon, label } = config[severity];

  return (
    <Badge className={`${className} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
