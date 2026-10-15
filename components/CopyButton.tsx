"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/kit";

export default function CopyButton({
  text,
  label = "Copiar",
  doneLabel = "Copiado",
  variant = "secondary",
  size = "md",
  full,
}: {
  text: string;
  label?: string;
  doneLabel?: string;
  variant?: "primary" | "secondary" | "soft";
  size?: "sm" | "md";
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" variant={variant} size={size} full={full} onClick={copy} disabled={!text} aria-live="polite">
      {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? doneLabel : label}
    </Button>
  );
}
