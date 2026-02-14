import { ArrowLeft, Bell, Menu } from "lucide-react";

interface AppBarProps {
  title?: string;
  onBack?: () => void;
  showNotifications?: boolean;
  showMenu?: boolean;
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
}

export function AppBar({
  title,
  onBack,
  showNotifications,
  showMenu,
  onNotificationClick,
  onMenuClick,
}: AppBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Safe area para notch */}
      <div className="h-safe-area-inset-top bg-background" />
      
      <div className="flex items-center justify-between h-14 px-4">
        {/* Botón izquierdo */}
        <div className="w-11 h-11 flex items-center justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
          )}
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Menú"
            >
              <Menu className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>

        {/* Título */}
        {title && (
          <h1 className="flex-1 text-center px-4 truncate">{title}</h1>
        )}

        {/* Botón derecho */}
        <div className="w-11 h-11 flex items-center justify-center">
          {showNotifications && (
            <button
              onClick={onNotificationClick}
              className="relative w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="w-6 h-6 text-gray-900" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
