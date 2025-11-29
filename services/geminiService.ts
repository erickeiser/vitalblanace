import { GoogleGenAI, Type } from "@google/genai";
import { JuiceRecipe, MacroNutrients } from "../types";

// Base nutrition schema (just the numbers)
const NUTRITION_PROPERTIES = {
  calories: { type: Type.NUMBER, description: "Estimated calories (kcal)." },
  protein: { type: Type.NUMBER, description: "Protein content in grams." },
  carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams." },
  fat: { type: Type.NUMBER, description: "Total fat in grams." },
  sugar: { type: Type.NUMBER, description: "Sugar content in grams." },
  sodium: { type: Type.NUMBER, description: "Sodium content in milligrams." },
};

const NUTRITION_SCHEMA = {
  type: Type.OBJECT,
  properties: NUTRITION_PROPERTIES,
  required: ["calories", "protein", "carbs", "fat", "sugar", "sodium"],
};

// Extended schema for food identification (includes name)
const FOOD_IDENTIFICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A short, descriptive name of the food identified. If a barcode is detected, return the exact product name from the barcode." },
    ...NUTRITION_PROPERTIES
  },
  required: ["name", "calories", "protein", "carbs", "fat", "sugar", "sodium"],
};

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

// Helper to clean JSON string from Markdown wrapping and locate valid JSON object
const cleanJson = (text: string): string => {
  if (!text) return "";
  try {
    // Remove markdown code blocks
    let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    
    // Attempt to extract just the JSON object part if there is extra text
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      clean = clean.substring(firstOpen, lastClose + 1);
    }
    
    return clean.trim();
  } catch (e) {
    return text;
  }
};

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this image. 1) Check for a BARCODE. If a barcode is clearly visible, READ the numbers, identify the EXACT product, and provide its nutrition per serving. 2) If no barcode, identify the food items and estimate nutrition for the portion shown. Return results in JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_IDENTIFICATION_SCHEMA,
      },
    });

    const text = cleanJson(response.text || "");
    if (!text) throw new Error("Empty response from AI");
    
    const data = JSON.parse(text);
    return {
      name: data.name,
      macros: {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        sugar: data.sugar,
        sodium: data.sodium,
      },
    };
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const analyzeFoodText = async (description: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the nutritional content of the following food description: "${description}". Provide estimates for a standard serving size if not specified. Be accurate with macros.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_IDENTIFICATION_SCHEMA,
      },
    });

    const text = cleanJson(response.text || "");
    if (!text) throw new Error("Empty response from AI");

    const data = JSON.parse(text);
    return {
      name: data.name,
      macros: {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        sugar: data.sugar,
        sodium: data.sodium,
      },
    };
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const generateJuiceRecipe = async (preferences: string, healthConditions: string): Promise<JuiceRecipe | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a healthy juice recipe tailored for someone with: ${healthConditions}. Preferences/Context: ${preferences}. Include nutritional estimates. Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                macrosEstimate: NUTRITION_SCHEMA 
            },
            required: ["name", "description", "ingredients", "instructions", "benefits", "macrosEstimate"]
        },
      },
    });

    const text = cleanJson(response.text || "");
    if (!text) throw new Error("Empty response from AI");

    const data = JSON.parse(text);
    return {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        benefits: data.benefits,
        macrosEstimate: data.macrosEstimate
    };
  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    throw new Error("Failed to parse recipe from AI. Please try again.");
  }
};