import { LucideIcon } from "lucide-react";

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "accent";
  size?: "default" | "large" | "small";
  icon?: LucideIcon;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function CTAButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  icon: Icon,
  disabled,
  fullWidth,
  className = "",
}: CTAButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    outline: "border-2 border-gray-300 text-gray-900 hover:bg-gray-50 active:bg-gray-100",
  };
  
  const sizes = {
    small: "h-10 px-4 text-[14px]",
    default: "h-12 px-6 text-base",
    large: "h-14 px-8 text-[18px]",
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}
