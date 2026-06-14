import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sym } from "@/components/ui/sym";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";

interface AdvisorChatProps {
  listingId: string;
}

/** Chat transcript + composer that fills its parent (used inside the Assistant panel). */
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
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-ink-2">Loading conversation…</p>
        ) : !history || history.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-ink-2">
            <Sym name="forum" lg className="text-ink-3" />
            <p>
              Ask about pricing strategy, timing, or how to read your scenarios. Your advisor
              remembers this conversation.
            </p>
          </div>
        ) : (
          history.map((turn, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 duration-200 ease-fb animate-in fade-in slide-in-from-bottom-1 ${
                turn.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {turn.role === "assistant" && (
                <Sym name="forum" className="mt-1 text-[18px] text-ink-2" />
              )}
              <div
                className={`max-w-[80%] rounded px-3 py-2 text-sm leading-relaxed ${
                  turn.role === "user" ? "bg-paper-3 text-ink" : "bg-paper text-ink"
                }`}
              >
                {turn.content}
              </div>
              {turn.role === "user" && (
                <Sym name="person" className="mt-1 text-[18px] text-ink-3" />
              )}
            </div>
          ))
        )}
        {sendMutation.isPending && (
          <div className="flex items-start gap-2">
            <Sym name="forum" className="mt-1 text-[18px] text-ink-2" />
            <div className="fb-data rounded bg-paper px-3 py-2 text-sm text-ink-2">
              measuring
              <span className="fb-measure-dot">·</span>
              <span className="fb-measure-dot">·</span>
              <span className="fb-measure-dot">·</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-rule p-3">
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
            placeholder="Ask anything…"
            className="min-h-[44px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            aria-label="Send message"
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
          >
            <Sym name="send" sm />
          </Button>
        </div>
        {sendMutation.isError && (
          <p className="mt-2 text-xs text-crit">Couldn't send that message — try again.</p>
        )}
      </div>
    </div>
  );
}
