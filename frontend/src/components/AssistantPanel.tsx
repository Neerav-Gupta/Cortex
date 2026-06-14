import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sym } from "@/components/ui/sym";
import { clearChatHistory, listListings, sendChatMessage } from "@/lib/api";
import { addressUpToState } from "@/lib/format";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Comet-style assistant rail. Bound to the property you're viewing in the
 *  strategy profile. Elsewhere, a prompt triggers a property-picker tool that
 *  routes you into that property's strategy profile and continues the chat. */
export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["listings"],
    queryFn: listListings,
    refetchInterval: 60000,
  });

  // Which property is being viewed in the strategy profile?
  const path = location.pathname;
  const inStrategyProfile = path === "/listings" || path.startsWith("/listing/");
  const routeId = path.startsWith("/listing/") ? path.split("/")[2] : undefined;
  const activeId = inStrategyProfile ? routeId ?? listings?.[0]?.listing_id ?? "" : "";

  // Unbound conversation state (only used when not viewing a property).
  const [input, setInput] = useState("");
  const [unboundPrompt, setUnboundPrompt] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  // Keep the panel contents mounted through the close transition, then unmount.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  // Drop any stale unbound state once we're bound to a property.
  useEffect(() => {
    if (activeId) {
      setUnboundPrompt(null);
      setInput("");
    }
  }, [activeId]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hasListings = !!listings && listings.length > 0;

  const handleNewChat = async () => {
    if (activeId) {
      try {
        await clearChatHistory(activeId);
        queryClient.setQueryData(["chat", activeId], []);
      } catch {
        /* ignore — leave the conversation as-is on failure */
      }
    }
    setUnboundPrompt(null);
    setInput("");
    setPicking(false);
  };

  const handleUnboundSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setUnboundPrompt(trimmed);
    setInput("");
  };

  const handlePick = async (id: string) => {
    if (picking || !unboundPrompt) return;
    setPicking(true);
    try {
      const res = await sendChatMessage(id, unboundPrompt);
      queryClient.setQueryData(["chat", id], res.history);
      setUnboundPrompt(null);
      setInput("");
      navigate(`/listing/${id}`);
    } finally {
      setPicking(false);
    }
  };

  return (
    <aside
      aria-hidden={!open}
      className={`sticky top-14 h-[calc(100vh-3.5rem)] flex-none overflow-hidden transition-[width] duration-300 ease-fb ${
        open ? "w-[min(85vw,380px)]" : "w-0"
      }`}
    >
      <div className="flex h-full w-[min(85vw,380px)] flex-col border-l border-rule bg-paper-2">
        {mounted && (
          <>
            <header className="flex h-14 flex-none items-center justify-between border-b border-rule px-4">
              <button
                type="button"
                onClick={handleNewChat}
                title="Start a new chat"
                aria-label="Start a new chat"
                className="group flex items-center gap-2 rounded transition-transform duration-150 ease-fb active:scale-95"
              >
                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                  <Sym
                    name="forum"
                    sm
                    className="absolute text-ink-2 transition-all duration-200 ease-fb group-hover:scale-50 group-hover:opacity-0"
                  />
                  <Sym
                    name="add"
                    sm
                    className="absolute -rotate-90 scale-50 text-ink opacity-0 transition-all duration-200 ease-fb group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100"
                  />
                </span>
                <span className="font-semibold text-ink">Assistant</span>
              </button>
              <button
                type="button"
                aria-label="Close assistant"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded text-ink-2 transition-colors duration-150 ease-fb hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Sym name="close" sm />
              </button>
            </header>

            {!hasListings ? (
              // No properties at all.
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <Sym name="forum" lg className="text-ink-3" />
                <p className="text-sm text-ink-2">
                  Add a property to chat with your pricing advisor.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate("/search");
                  }}
                >
                  <Sym name="search" sm />
                  Search a property
                </Button>
              </div>
            ) : activeId ? (
              // Bound to the property being viewed.
              <div className="flex-1 overflow-hidden">
                <AdvisorChat key={activeId} listingId={activeId} />
              </div>
            ) : (
              // Not viewing a property — chat, then offer a property picker after a prompt.
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {unboundPrompt === null ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-ink-2">
                      <Sym name="forum" lg className="text-ink-3" />
                      <p>
                        Ask anything about your properties — I'll help you pick the right one to
                        dig into.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-end gap-2 duration-200 ease-fb animate-in fade-in slide-in-from-bottom-1">
                        <div className="max-w-[80%] rounded bg-paper-3 px-3 py-2 text-sm text-ink">
                          {unboundPrompt}
                        </div>
                        <Sym name="person" className="mt-1 text-[18px] text-ink-3" />
                      </div>

                      <div className="flex items-start gap-2 delay-100 duration-200 ease-fb animate-in fade-in slide-in-from-bottom-1 fill-mode-both">
                        <Sym name="forum" className="mt-1 text-[18px] text-ink-2" />
                        <div className="max-w-[85%] rounded bg-paper px-3 py-2 text-sm text-ink">
                          Which property is this about?
                        </div>
                      </div>

                      <div className="space-y-2 pl-6">
                        {listings!.map((l) => (
                          <button
                            key={l.listing_id}
                            type="button"
                            disabled={picking}
                            onClick={() => handlePick(l.listing_id)}
                            className="flex w-full items-center gap-2 rounded border border-rule bg-paper-3 px-3 py-2 text-left text-sm text-ink transition-[color,background-color,border-color,transform] duration-150 ease-fb hover:border-rule-strong hover:bg-paper active:scale-[0.99] disabled:opacity-50"
                          >
                            <Sym name="home_work" className="flex-none text-[18px] text-ink-2" />
                            <span className="truncate">{addressUpToState(l.address)}</span>
                          </button>
                        ))}
                      </div>

                      {picking && (
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
                    </>
                  )}
                </div>

                {unboundPrompt === null && (
                  <div className="border-t border-rule p-3">
                    <div className="flex items-end gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleUnboundSend();
                          }
                        }}
                        placeholder="Ask anything…"
                        className="min-h-[44px] resize-none"
                        rows={1}
                      />
                      <Button
                        size="icon"
                        aria-label="Send message"
                        onClick={handleUnboundSend}
                        disabled={!input.trim()}
                      >
                        <Sym name="send" sm />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
