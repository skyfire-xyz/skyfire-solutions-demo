"use client";

import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CompletionIndicator } from "@/components/completion-indicator";
import { formatRateLimitMessage, isRateLimited } from "@/lib/rate-limit-message";

/**
 * The output panel's only reachable error UI.
 *
 * The header pill in agent-output-panel.tsx is `hidden md:flex`, and
 * ResponseTab's error branch never renders because renderCustomOutput() always
 * wins for this app's single agent type -- so without this card a blocked
 * request would show an empty panel reading "agent has finished running".
 */
export function AgentErrorCard({ parsedOutput }: { parsedOutput: unknown }) {
  const payload = (parsedOutput ?? {}) as { message?: string };
  const rateLimited = isRateLimited(parsedOutput);
  const body = rateLimited
    ? formatRateLimitMessage(parsedOutput)
    : payload.message || "The agent could not complete this request.";

  return (
    <div className="space-y-4 max-w-full p-1">
      <Card className="p-4">
        <CompletionIndicator
          status={rateLimited ? "warning" : "error"}
          message={rateLimited ? "Rate limit reached" : "Request failed"}
          className="mb-3"
        />
        <div className="flex gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{body}</p>
        </div>
      </Card>
    </div>
  );
}
