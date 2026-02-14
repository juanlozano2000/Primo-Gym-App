import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ items, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-colors"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area para gesture bar en iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
