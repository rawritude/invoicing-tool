import { GoogleGenAI } from "@google/genai";

const EXTRACTION_PROMPT = `You are a receipt/invoice data extraction assistant. Analyze the provided receipt image or PDF and extract information into a JSON object.

Return ONLY valid JSON with this exact structure:
{
  "vendorName": "string - the business/store name",
  "date": "string - receipt date in YYYY-MM-DD format",
  "lineItems": [
    {
      "description": "string - item description",
      "quantity": number or null,
      "unitPrice": number or null,
      "amount": number
    }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "total": number,
  "currency": "string - 3-letter ISO currency code (e.g., USD, EUR, GBP). Detect from currency symbols, language, or country context.",
  "suggestedCategory": "string - one of: Travel, Meals, Accommodation, Office Supplies, Software/Subscriptions, Transportation, Communication, Professional Services, Equipment, Miscellaneous"
}

Rules:
- All monetary amounts should be numbers without currency symbols
- If a field cannot be determined, use null
- For currency, look for symbols ($, EUR, etc.), language cues, and formatting
- For category, infer from the vendor name and line items
- Parse dates according to the format on the receipt`;

export async function extractReceiptData(
  fileBase64: string,
  mimeType: string,
  apiKey: string
) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  return JSON.parse(text);
}

export async function interpretVoiceInput(
  audioBase64: string,
  audioMimeType: string,
  currentFields: Record<string, unknown>,
  apiKey: string
) {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are helping a user edit a receipt form using voice commands.
The current form fields are:
${JSON.stringify(currentFields, null, 2)}

The user has spoken an audio message. Listen to what they say and return ONLY the fields that should be updated, as a JSON object. Use the same field names as shown above.

For example, if the user says "change the vendor to Amazon and the total to 49.99", return:
{"vendorName": "Amazon", "total": 49.99}

Only include fields that the user explicitly mentions or implies should be changed. Do not include unchanged fields.
Valid field names: vendorName, date (YYYY-MM-DD format), subtotal, tax, total, currency (3-letter code), suggestedCategory, notes`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  return JSON.parse(text);
}
