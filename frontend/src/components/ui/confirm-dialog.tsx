"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useFocusTrap(open, { onEscape: onCancel, initialFocusRef: cancelRef });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 card-linear p-6 space-y-4 animate-fade-in-up"
      >
        <h2 id="confirm-title" className="text-lg font-medium text-text-primary text-balance font-feature-settings-cv01-ss03">
          {title}
        </h2>
        <p id="confirm-description" className="text-sm text-text-secondary">
          {description}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button ref={cancelRef} variant="outline" onClick={onCancel} className="btn-linear-ghost">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "btn-linear-primary"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
