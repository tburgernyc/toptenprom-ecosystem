"use server";

import { z } from "zod";
import { getGeminiModel } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Garment analysis schema
// ---------------------------------------------------------------------------

export const garmentAnalysisSchema = z.object({
  /**
   * Primary detected garment type, e.g. "dress", "blazer", "skirt".
   */
  garmentType: z.string(),
  /**
   * Primary colour(s) detected.
   */
  colors: z.array(z.string()),
  /**
   * Detected style category, e.g. "formal", "bohemian", "minimalist".
   */
  styleCategory: z.string(),
  /**
   * Season suitability — one or more of "spring", "summer", "autumn", "winter".
   */
  seasonSuitability: z.array(z.string()),
  /**
   * 2-4 specific styling recommendations for the garment.
   */
  stylingTips: z.array(z.string()),
  /**
   * 2-3 complementary item suggestions by category (not brand-specific).
   */
  complementaryItems: z.array(z.string()),
  /**
   * Likely occasions this garment suits, e.g. "prom", "brunch", "office".
   */
  occasions: z.array(z.string()),
  /**
   * Confidence 0-1 that a clear garment was detected in the image.
   */
  confidence: z.number().min(0).max(1),
});

export type GarmentAnalysis = z.infer<typeof garmentAnalysisSchema>;

// ---------------------------------------------------------------------------
// analyzeGarment — Gemini Vision server action
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export type AnalyzeGarmentResult =
  | { status: "success"; analysis: GarmentAnalysis }
  | { status: "no_garment"; message: string }
  | { status: "error"; message: string };

/**
 * Analyses an uploaded garment image using Gemini Vision and returns
 * structured styling recommendations.
 *
 * @param imageBase64  Base64-encoded image data (without the data: prefix)
 * @param mimeType     MIME type of the image
 */
export async function analyzeGarment(
  imageBase64: string,
  mimeType: string
): Promise<AnalyzeGarmentResult> {
  if (!imageBase64.trim()) {
    return { status: "error", message: "No image provided." };
  }

  if (!isAllowedMimeType(mimeType)) {
    return {
      status: "error",
      message:
        "Unsupported image format. Please upload a JPEG, PNG, WebP, or HEIC image.",
    };
  }

  // Sanity-check base64 length (~max 10 MB raw)
  if (imageBase64.length > 14_000_000) {
    return {
      status: "error",
      message: "Image is too large. Please upload an image under 10 MB.",
    };
  }

  const model = getGeminiModel("gemini-2.0-flash");

  const prompt = `You are an expert fashion stylist and personal shopping assistant.
Analyse the garment in this image and provide detailed styling guidance.

Respond with a JSON object matching this shape exactly:
{
  "garmentType": string,           // primary garment type, e.g. "dress", "blazer"
  "colors": string[],              // primary colours detected, e.g. ["emerald green", "gold"]
  "styleCategory": string,         // e.g. "formal", "bohemian", "minimalist", "streetwear"
  "seasonSuitability": string[],   // subset of ["spring", "summer", "autumn", "winter"]
  "stylingTips": string[],         // 2-4 specific tips for wearing this piece
  "complementaryItems": string[],  // 2-3 item categories that pair well (not brand names)
  "occasions": string[],           // best occasions, e.g. ["prom", "date night", "brunch"]
  "confidence": number             // 0.0-1.0; set < 0.4 if no clear garment is visible
}

If no clear garment is visible, set confidence below 0.4 and use generic placeholder values.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text) as unknown;
    const validated = garmentAnalysisSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        status: "error",
        message: "Could not parse the analysis result. Please try again.",
      };
    }

    if (validated.data.confidence < 0.4) {
      return {
        status: "no_garment",
        message:
          "No clear garment was detected in this image. Please upload a photo showing the clothing item clearly.",
      };
    }

    return { status: "success", analysis: validated.data };
  } catch (err) {
    console.error("[analyzeGarment] Error:", err);
    return {
      status: "error",
      message: "Analysis failed. Please try again.",
    };
  }
}
