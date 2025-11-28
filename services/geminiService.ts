import { GoogleGenAI, Type } from "@google/genai";
import { JuiceRecipe, MacroNutrients } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MACRO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A short, descriptive name of the food identified." },
    calories: { type: Type.NUMBER, description: "Estimated calories (kcal)." },
    protein: { type: Type.NUMBER, description: "Protein content in grams." },
    carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams." },
    fat: { type: Type.NUMBER, description: "Total fat in grams." },
    sugar: { type: Type.NUMBER, description: "Sugar content in grams." },
    sodium: { type: Type.NUMBER, description: "Sodium content in milligrams." },
  },
  required: ["name", "calories", "protein", "carbs", "fat", "sugar", "sodium"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  try {
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
            text: "Analyze this image. If it contains a barcode, read the barcode digits and identify the specific product and its nutritional values. If it is a meal or food item, estimate the portion size and nutritional content with high accuracy. If it is a nutrition label, extract the values exactly. Return the results in JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MACRO_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return null;
    
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
    return null;
  }
};

export const analyzeFoodText = async (description: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the nutritional content of the following food description: "${description}". Provide estimates for a standard serving size if not specified. Be accurate with macros.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MACRO_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return null;

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
    return null;
  }
};

export const generateJuiceRecipe = async (preferences: string, healthConditions: string): Promise<JuiceRecipe | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a healthy juice recipe tailored for someone with: ${healthConditions}. Preferences/Context: ${preferences}. Include nutritional estimates.`,
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
                macrosEstimate: MACRO_SCHEMA
            }
        },
      },
    });

    const text = response.text;
    if (!text) return null;

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
    return null;
  }
};