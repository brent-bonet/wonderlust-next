"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message = { kind: "bot" | "user"; text: string; error?: boolean };

const CHIPS = [
  "What are your hours?",
  "How much is balayage?",
  "Book an appointment",
  "Where are you located?",
];

const GREETING =
  "Hey! I'm the Wonderlust assistant — ask me about services, prices, or hours, or I can point you straight to booking. What are you looking for?";

const FALLBACK_TEXT =
  "Good question — that one's best answered by a human! Call or text us at (303) 297-8463, or book online at /book.";

/** Renders /book mentions and the phone number in bot text as live links. */
function BotText({ text }: { text: string }) {
  const parts = text.split(/(\/book|\(303\) 297-8463)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "/book") {
          return (
            <Link key={i} href="/book" className="font-bold text-toner-deep">
              /book
            </Link>
          );
        }
        if (part === "(303) 297-8463") {
          return (
            <a
              key={i}
              href="tel:+13032978463"
              className="font-bold text-toner-deep"
            >
              (303) 297-8463
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, typing]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (greeted) return;
    setGreeted(true);
    const timer = setTimeout(() => {
      setMessages([{ kind: "bot", text: GREETING }]);
      setShowChips(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [open, greeted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMessage: Message = { kind: "user", text: trimmed };
    const transcript = [...messages, userMessage];
    setMessages(transcript);
    setInput("");
    setTyping(true);

    try {
      // API history must start with a user turn — drop the greeting and any
      // error notices, then slice from the first user message.
      const clean = transcript.filter((m) => !m.error);
      const firstUser = clean.findIndex((m) => m.kind === "user");
      const history = clean.slice(firstUser).map((m) => ({
        role: m.kind === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(`chat unavailable (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";
      let started = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });
        if (!started) {
          started = true;
          setTyping(false);
          setMessages((prev) => [...prev, { kind: "bot", text: botText }]);
        } else {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { kind: "bot", text: botText },
          ]);
        }
      }
      if (!started) throw new Error("empty response");
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.text.length > 0),
        { kind: "bot", text: FALLBACK_TEXT, error: true },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Chat with us"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[22px] right-[22px] z-[90] flex h-[58px] w-[58px] cursor-pointer items-center justify-center rounded-full border-none bg-toner text-ink shadow-[0_6px_24px_rgba(27,36,34,.28)] transition-[transform,background-color] duration-150 ease-[ease] hover:-translate-y-0.5 hover:bg-toner-deep hover:text-paper"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-[26px] w-[26px]"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Wonderlust chat assistant"
          className="fixed bottom-[92px] right-[22px] z-[91] flex h-[min(560px,calc(100vh-130px))] w-[min(380px,calc(100vw-32px))] animate-[rise_.25s_ease_both] flex-col overflow-hidden rounded-2xl border border-fog bg-paper shadow-[0_18px_60px_rgba(27,36,34,.30)]"
        >
          <div className="flex items-center gap-2.5 bg-ink px-[18px] py-3.5 text-paper">
            <div>
              <div className="font-typed text-[1.02rem] text-toner">
                wonder·bot
              </div>
              <div className="text-[.7rem] uppercase tracking-[.12em] opacity-60">
                AI assistant
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="ml-auto cursor-pointer border-none bg-transparent p-1 text-[1.3rem] leading-none text-paper opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>

          <div
            ref={logRef}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[.92rem] leading-[1.5] ${
                  msg.kind === "bot"
                    ? "self-start rounded-bl-[4px] bg-[#e6efec] text-ink"
                    : "self-end rounded-br-[4px] bg-toner-deep text-white"
                }`}
              >
                {msg.kind === "bot" ? <BotText text={msg.text} /> : msg.text}
              </div>
            ))}
            {typing && (
              <div className="inline-flex gap-1 self-start rounded-[14px] rounded-bl-[4px] bg-[#e6efec] px-3.5 py-3">
                {[0, 0.18, 0.36].map((delay) => (
                  <i
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-[#8aa39b] [animation:blink_1.1s_infinite_ease-in-out]"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {showChips && (
            <div className="flex flex-wrap gap-2 px-4 pb-2.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => send(chip)}
                  className="cursor-pointer rounded-full border border-fog bg-white px-3 py-[7px] text-[.8rem] font-bold text-toner-deep hover:border-toner-deep"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t border-fog px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Ask about services, prices, hours…"
              aria-label="Type a message"
              className="min-w-0 flex-1 rounded-full border border-fog bg-white px-4 py-2.5 font-body text-[.92rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner"
            />
            <button
              type="button"
              onClick={() => send(input)}
              className="cursor-pointer rounded-full border-none bg-ink px-[18px] py-2.5 text-[.85rem] font-bold text-paper hover:bg-toner-deep"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
