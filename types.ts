export enum AppView {
  DASHBOARD = 'DASHBOARD',
  FOOD_LOG = 'FOOD_LOG',
  JUICE_BAR = 'JUICE_BAR',
  VITALS = 'VITALS',
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export interface FoodItem extends MacroNutrients {
  id: string;
  name: string;
  timestamp: number;
  type: 'meal' | 'snack' | 'juice';
  image?: string; // Base64 thumbnail if scanned
}

export interface VitalLog {
  id: string;
  timestamp: number;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number; // mg/dL
  notes?: string;
}

export interface JuiceRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  benefits: string[]; // e.g., "Lowers BP", "Anti-inflammatory"
  macrosEstimate: MacroNutrients;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalMacros: MacroNutrients;
  averageBP: { systolic: number; diastolic: number };
  averageSugar: number;
}