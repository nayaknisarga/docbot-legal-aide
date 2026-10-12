import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Diamond, FileText } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolHeader, ToolContent, ToolInput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { getDocType } from "@/lib/legal/defs";
import { sanitizeRecommendations } from "@/lib/legal/discovery";
import { DemoBadge, RiskBadge } from "./SiteShell";

const greeting: UIMessage[] = [
  {
    id: "discovery-welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hi, I’m your Clausewell assistant. What are you working on, and what would you like to protect?",
      },
    ],
  },
];

const SUGGESTIONS = [
  "NDA for a new vendor",
  "Freelancer contract",
  "Employment offer letter",
  "Website terms of service",
] as const;

export function DiscoveryChat({
  onStart,
  opening,
}: {
  onStart: (id: string) => void;
  opening: string | null;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/discovery" }), []);
  const { messages, sendMessage, status, error, stop } = useChat({ transport, messages: greeting });
  const [input, setInput] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 1;
  const submitText = (text: string) => {
    const value = text.trim();
    if (busy || !value) return;
    void sendMessage({ text: value });
    setInput("");
    textarea.current?.focus();
  };
  useEffect(() => {
    if (
      !busy &&
      (!document.activeElement ||
        document.activeElement === document.body ||
        document.activeElement.closest("[data-discovery-chat]"))
    )
      textarea.current?.focus();
  }, [busy]);

  return (
    <section
      aria-labelledby="discovery-title"
      className="mx-auto flex min-h-[470px] max-w-5xl flex-col justify-center pb-14 pt-8 sm:min-h-[510px] sm:pb-16 sm:pt-10"
      data-discovery-chat
    >
      <div className="mb-10 text-center sm:mb-12">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Clausewell assistant
        </span>
        <h1
          id="discovery-title"
          className="mx-auto mt-5 max-w-4xl text-4xl leading-[1.08] text-primary sm:text-6xl"
        >
          Describe what you need,
          <br className="hidden sm:block" /> and I’ll find the right document.
        </h1>
      </div>
      {hasConversation && (
        <div className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
          <Conversation className="h-[300px] sm:h-[340px]">
            <ConversationContent className="gap-6 p-5 sm:p-7">
              {messages.slice(1).map((message) => (
                <Message key={message.id} from={message.role} className="max-w-full">
                  <MessageContent className="w-full group-[.is-user]:w-fit group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                    {message.parts.map((part, i) => {
                      if (part.type === "text")
                        return <MessageResponse key={i}>{part.text}</MessageResponse>;
                      if (part.type === "reasoning")
                        return (
                          <details key={i} className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer">Thinking</summary>
                            <MessageResponse>{part.text}</MessageResponse>
                          </details>
                        );
                      if (!isToolUIPart(part) || part.type === "dynamic-tool") return null;
                      const recommendations =
                        part.state === "output-available"
                          ? sanitizeRecommendations(part.output)
                          : [];
                      return (
                        <div key={i} className="w-full">
                          <Tool defaultOpen={false} className="mb-3">
                            <ToolHeader
                              type={part.type}
                              state={part.state}
                              title="Finding documents"
                            />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              {part.state === "output-error" && (
                                <p className="text-sm text-destructive">{part.errorText}</p>
                              )}
                            </ToolContent>
                          </Tool>
                          <div className="space-y-3">
                            {recommendations.map(({ templateId, reason }) => {
                              const doc = getDocType(templateId);
                              if (!doc) return null;
                              return (
                                <article
                                  key={templateId}
                                  className="rounded-md border border-border p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    <FileText className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                    <div className="min-w-0 flex-1">
                                      <h3 className="text-lg">{doc.name}</h3>
                                      <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <span className="flex flex-wrap gap-2">
                                      <RiskBadge level={doc.riskLevel} />
                                      <DemoBadge />
                                      <span className="text-xs text-muted-foreground">
                                        {doc.jurisdiction.join(" · ")}
                                      </span>
                                    </span>
                                    <Button
                                      size="sm"
                                      disabled={Boolean(opening)}
                                      onClick={() => onStart(templateId)}
                                    >
                                      Start this <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && (
                <Shimmer className="text-sm">Finding the right document…</Shimmer>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error.message}
                </p>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      )}
      <div className="mx-auto w-full max-w-5xl">
        <div className="relative">
          <Diamond
            className="pointer-events-none absolute left-6 top-1/2 z-10 h-5 w-5 -translate-y-1/2 fill-primary text-primary"
            aria-hidden="true"
          />
          <PromptInput
            onSubmit={({ text }) => submitText(text)}
            maxFiles={0}
            className="[&_[data-slot=input-group]]:min-h-16 [&_[data-slot=input-group]]:rounded-xl [&_[data-slot=input-group]]:border-border [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]]:shadow-sm sm:[&_[data-slot=input-group]]:min-h-[72px]"
          >
            <PromptInputTextarea
              ref={textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Describe your situation"
              placeholder="e.g. I’m hiring a freelancer and want to protect my source code"
              className="min-h-16 resize-none border-0 bg-transparent py-5 pl-16 pr-20 text-base shadow-none focus-visible:ring-0 sm:min-h-[72px] sm:text-lg"
            />
            <PromptInputFooter className="absolute inset-y-0 right-3 w-auto justify-center p-0">
              <PromptInputSubmit
                status={status}
                onStop={() => {
                  void stop();
                }}
                disabled={!busy && !input.trim()}
                title={busy ? "Stop response" : "Send message"}
                className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              >
                <ArrowUp className="h-5 w-5" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
        {!hasConversation && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => submitText(suggestion)}
                className="h-11 rounded-full border border-border px-6 text-sm font-normal text-muted-foreground"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
