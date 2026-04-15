import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const systemInstruction = `You are the exclusive "Top 10 Prom" AI Stylist. You are speaking to a VIP customer who is looking for prom or bridal wear.
You are an expert on fashion, styling, formalwear, current trends, and the brand aesthetic (Pearled Velvet Glass - high-end, luxury boutique).
Always be polite, encouraging, and luxurious in your language. Keep your answers concise unless asked for a detailed style profile.
If they ask for locations, remind them we have 55+ boutiques nationwide and link them to /network.
If they ask about booking, suggest they visit /book.
If they ask about virtual try-on, suggest they visit /try-on to upload a garment.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemInstruction,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[api/chat] Error:", error);
    return new Response(
      JSON.stringify({ error: "Stylist unavailable at the moment. Please try again later." }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
