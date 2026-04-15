import "server-only";
import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type GenerationConfig,
} from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Gemini client — server-only singleton
//
// SECURITY: GOOGLE_AI_API_KEY must NEVER appear in NEXT_PUBLIC_* env vars.
// This module is marked server-only to enforce the boundary at build time.
// ---------------------------------------------------------------------------

let _client: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;

  const apiKey = process.env["GOOGLE_AI_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Add it to your .env.local file."
    );
  }

  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

/**
 * Returns a Gemini model instance configured for structured JSON output.
 *
 * @param modelName  Gemini model identifier, e.g. "gemini-2.0-flash"
 * @param config     Optional generation config overrides
 */
export function getGeminiModel(
  modelName: string = "gemini-2.0-flash",
  config?: Partial<GenerationConfig>
): GenerativeModel {
  return getClient().getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      ...config,
    },
  });
}
