import { LucideIcon } from "lucide-react";
import { CTAButton } from "./CTAButton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="mb-2 text-gray-900">{title}</h3>
      <p className="text-[15px] text-gray-600 mb-6 max-w-[280px]">{description}</p>
      
      {actionLabel && onAction && (
        <CTAButton onClick={onAction} variant="primary">
          {actionLabel}
        </CTAButton>
      )}
    </div>
  );
}
