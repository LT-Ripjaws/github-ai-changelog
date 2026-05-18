"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { getErrorMessage } from "@/lib/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fullName: string) => Promise<void>;
}

export function ConnectRepoModal({
  isOpen,
  onClose,
  onSubmit,
}: ConnectRepoModalProps) {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useFocusTrap(isOpen, {
    onEscape: () => { if (!loading) onClose(); },
    initialFocusRef: inputRef,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(fullName);
      setFullName("");
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to connect repository"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-repo-title"
      aria-describedby="connect-repo-description"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <Card ref={dialogRef} className="relative z-10 w-full max-w-md card-linear">
        <CardHeader>
          <CardTitle id="connect-repo-title" className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">Connect Repository</CardTitle>
          <CardDescription id="connect-repo-description" className="text-text-secondary">
            Enter the GitHub repository in owner/repo format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="repo-full-name" className="text-sm font-medium text-text-secondary">
                Repository full name
              </label>
              <Input
                id="repo-full-name"
                ref={inputRef}
                name="repoFullName"
                placeholder="e.g. facebook/react…"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                pattern="^[\w.-]+\/[\w.-]+$"
                title="Format: owner/repo"
                aria-describedby={error ? "connect-repo-error" : "connect-repo-description"}
                className="input-linear"
              />
              {error && (
                <p id="connect-repo-error" className="text-sm text-destructive" role="alert">{error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="btn-linear-ghost"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !fullName.trim()} className="btn-linear-primary">
                {loading ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
