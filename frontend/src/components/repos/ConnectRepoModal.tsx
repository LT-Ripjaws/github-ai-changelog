"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(fullName);
      setFullName("");
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to connect repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-linear">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">Connect Repository</CardTitle>
          <CardDescription className="text-text-secondary">
            Enter the GitHub repository in owner/repo format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="facebook/react"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                pattern="^[\w.-]+\/[\w.-]+$"
                title="Format: owner/repo"
                className="input-linear"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
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
                {loading ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
