import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
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
      className="mx-auto max-w-3xl pb-14 pt-5 sm:pb-20 sm:pt-10"
      data-discovery-chat
    >
      <div className="mb-8 text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Clausewell assistant
        </span>
        <h1
          id="discovery-title"
          className="mx-auto mt-3 max-w-2xl text-4xl leading-tight text-primary sm:text-5xl"
        >
          Describe what you need,
          <br className="hidden sm:block" /> and I’ll find the right document.
        </h1>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Conversation className="h-[320px] sm:h-[360px]">
          <ConversationContent className="gap-6 p-5 sm:p-7">
            {messages.map((message) => (
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
                      part.state === "output-available" ? sanitizeRecommendations(part.output) : [];
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
        <div className="border-t border-border p-4 sm:p-5">
          <PromptInput
            onSubmit={({ text }) => {
              if (busy || !text.trim()) return;
              void sendMessage({ text: text.trim() });
              setInput("");
              textarea.current?.focus();
            }}
            maxFiles={0}
          >
            <PromptInputTextarea
              ref={textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Describe your situation"
              placeholder="I’m hiring a freelancer and want to protect my source code…"
              className="min-h-20 px-4 text-sm"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                onStop={() => {
                  void stop();
                }}
                disabled={!busy && !input.trim()}
                title={busy ? "Stop response" : "Send message"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </section>
  );
}
