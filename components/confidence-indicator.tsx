import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ConfidenceIndicatorProps {
    score: number; // 0.0 to 1.0
    showLabel?: boolean;
}

export function ConfidenceIndicator({ score, showLabel = true }: ConfidenceIndicatorProps) {
    const percentage = Math.round(score * 100);

    // Determine color based on confidence level
    const getColor = () => {
        if (score >= 0.8) return 'text-green-600 dark:text-green-400';
        if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-orange-600 dark:text-orange-400';
    };

    const getBackgroundColor = () => {
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getLabel = () => {
        if (score >= 0.8) return 'High Confidence';
        if (score >= 0.6) return 'Medium Confidence';
        return 'Low Confidence';
    };

    return (
        <div className="space-y-2">
            {showLabel && (
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Analysis Confidence</span>
                    <Badge variant="outline" className={getColor()}>
                        {percentage}%
                    </Badge>
                </div>
            )}
            <div className="relative">
                <Progress value={percentage} className="h-2" />
                <div
                    className={`absolute left-0 top-0 h-2 rounded-full transition-all ${getBackgroundColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-muted-foreground">
                    {getLabel()} - {score >= 0.8
                        ? 'Analysis is highly reliable with complete information'
                        : score >= 0.6
                            ? 'Analysis is reasonably reliable with some assumptions'
                            : 'Analysis is based on limited information'}
                </p>
            )}
        </div>
    );
}
