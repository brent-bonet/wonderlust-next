import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import {
  getBookableServices,
  getBusinessHours,
  getStylists,
} from "@/lib/data";

export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 2000;

async function buildSystemPrompt(): Promise<string> {
  const [services, stylists, hours] = await Promise.all([
    getBookableServices(),
    getStylists(),
    getBusinessHours(),
  ]);

  const menu = services
    .map((s) => `- ${s.name} (${s.category}): ${s.priceDisplay}`)
    .join("\n");
  const team = stylists.map((s) => `- ${s.name} — ${s.role}`).join("\n");
  const hoursList = hours.map((h) => `- ${h.day}: ${h.display}`).join("\n");

  return `You are the Wonderlust Salon assistant ("wonder·bot"), the chat widget on wonderlustsalon.com. Wonderlust Salon is a hair salon at 1309 22nd Street, Denver, CO 80205, in the RiNo Arts District — look for the turquoise lettering in the window. Phone (call or text): (303) 297-8463. Email: wonderlust.salon@gmail.com. Street parking is usually easiest on 22nd or Larimer.

Services and starting prices (prices vary by stylist; hair length, density, and color history all factor in):
${menu}

The team ("three chairs, no assembly line"):
${team}

Hours:
${hoursList}

Booking: clients book online at /book — they pick a service, then a stylist, then an available date and time, then pay a deposit or the full amount depending on the service. Consultations are free and the best starting point for big color changes or extensions. You do NOT have access to live availability — never claim a specific time is open; instead point people to /book to see real openings.

The salon carries KEVIN.MURPHY products.

Style: warm, concise, plain text only — no markdown, no bullet lists unless listing prices. A sentence or three per reply. When booking would help, mention /book. If a question needs a human (complaints, refunds, medical concerns, anything you're unsure of), suggest calling or texting (303) 297-8463. Only answer questions related to the salon; politely steer anything else back to hair.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat isn't configured yet (missing ANTHROPIC_API_KEY)." },
      { status: 501 },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = body.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages[0].role !== "user" ||
    messages.some(
      (m) =>
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        m.content.length === 0 ||
        m.content.length > MAX_MESSAGE_LENGTH,
    )
  ) {
    return NextResponse.json(
      { error: "messages must be 1-30 non-empty user/assistant turns." },
      { status: 400 },
    );
  }

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: await buildSystemPrompt(),
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      stream.on("end", () => controller.close());
      stream.on("error", (error) => controller.error(error));
      stream.on("abort", (error) => controller.error(error));
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
