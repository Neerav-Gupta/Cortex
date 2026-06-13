import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";

interface AdvisorChatProps {
  listingId: string;
}

export function AdvisorChat({ listingId }: AdvisorChatProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["chat", listingId],
    queryFn: () => fetchChatHistory(listingId),
    enabled: !!listingId,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(listingId, text),
    onSuccess: (response) => {
      queryClient.setQueryData(["chat", listingId], response.history);
      setMessage("");
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sendMutation.isPending]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <Card className="flex h-[32rem] flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" />
          Ask Your Pricing Advisor
        </CardTitle>
        <AiInsightBadge />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          ) : !history || history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Bot className="h-8 w-8 text-primary/60" />
              <p>
                Ask about pricing strategy, timing, or how to interpret your scenarios. Your
                advisor remembers this conversation.
              </p>
            </div>
          ) : (
            history.map((turn, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  turn.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {turn.role === "assistant" && (
                  <Bot className="mt-1 h-4 w-4 flex-none text-primary" />
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    turn.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {turn.content}
                </div>
                {turn.role === "user" && (
                  <User className="mt-1 h-4 w-4 flex-none text-muted-foreground" />
                )}
              </div>
            ))
          )}
          {sendMutation.isPending && (
            <div className="flex items-start gap-2">
              <Bot className="mt-1 h-4 w-4 flex-none text-primary" />
              <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your listing..."
            className="min-h-[44px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {sendMutation.isError && (
          <p className="text-xs text-destructive">
            Failed to send message. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
