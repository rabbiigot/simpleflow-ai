import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { chatWithAi } from "@/lib/backend-api";
import { Loader2, Send, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";

export function AnalyticsPrompt() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await chatWithAi(trimmed);
      setResponse(result.message);
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your analytics..."
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" size="sm" disabled={isLoading || !message.trim()} className="gap-2 h-9">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Ask
        </Button>
      </form>

      {isLoading && (
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing your data...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-300">
          <CardContent className="pt-4 pb-4 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {response && !isLoading && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground whitespace-pre-wrap">{response}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
