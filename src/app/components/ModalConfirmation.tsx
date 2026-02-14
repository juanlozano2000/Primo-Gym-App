import { X } from "lucide-react";
import { CTAButton } from "./CTAButton";

interface ModalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "danger";
}

export function ModalConfirmation({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "default",
}: ModalConfirmationProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2>{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-[15px] text-gray-700 mb-6">{description}</p>
          
          {/* Actions */}
          <div className="flex gap-3">
            <CTAButton
              onClick={onClose}
              variant="outline"
              fullWidth
            >
              {cancelLabel}
            </CTAButton>
            <CTAButton
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant={variant === "danger" ? "accent" : "primary"}
              fullWidth
            >
              {confirmLabel}
            </CTAButton>
          </div>
        </div>
      </div>
    </div>
  );
}
