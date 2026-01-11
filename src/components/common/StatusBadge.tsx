import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    label: string;
    colorClass: string;
    className?: string;
}

export function StatusBadge({ label, colorClass, className }: StatusBadgeProps) {
    const getColorStyles = (color: string) => {
        switch (color) {
            case 'green':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
            case 'orange':
                return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100';
            case 'red':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
            case 'blue':
                return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
            case 'gray':
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        }
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium px-2 py-0.5 whitespace-nowrap',
                getColorStyles(colorClass),
                className
            )}
        >
            {label}
        </Badge>
    );
}
