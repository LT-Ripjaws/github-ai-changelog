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
        className="relative z-10 mx-4 w-full max-w-md space-y-4 card-linear p-4 animate-fade-in-up sm:p-6"
      >
        <h2 id="confirm-title" className="text-lg font-medium text-text-primary text-balance font-feature-settings-cv01-ss03">
          {title}
        </h2>
        <p id="confirm-description" className="text-sm text-text-secondary">
          {description}
        </p>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button ref={cancelRef} variant="outline" onClick={onCancel} className="btn-linear-ghost w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                : "btn-linear-primary w-full sm:w-auto"
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
