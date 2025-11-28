import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Utensils, GlassWater, Activity, Menu, X } from 'lucide-react';
import { AppView, FoodItem, JuiceRecipe, VitalLog } from './types';
import { Dashboard } from './components/Dashboard';
import { FoodLens } from './components/FoodLens';
import { JuiceBar } from './components/JuiceBar';
import { VitalsTracker } from './components/VitalsTracker';

const NAV_ITEMS = [
  { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: AppView.FOOD_LOG, label: 'Food Lens', icon: Utensils },
  { id: AppView.JUICE_BAR, label: 'Juice Bar', icon: GlassWater },
  { id: AppView.VITALS, label: 'Vitals', icon: Activity },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App State - In a real app, use Context or Redux
  const [foodLogs, setFoodLogs] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<JuiceRecipe[]>([]);
  const [vitals, setVitals] = useState<VitalLog[]>([]);

  // Load initial data simulation safely
  useEffect(() => {
    try {
      const savedFood = localStorage.getItem('foodLogs');
      if (savedFood) setFoodLogs(JSON.parse(savedFood));
    } catch (e) {
      console.error("Failed to load food logs", e);
    }
    
    try {
      const savedRecipes = localStorage.getItem('recipes');
      if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
    } catch (e) {
      console.error("Failed to load recipes", e);
    }

    try {
      const savedVitals = localStorage.getItem('vitals');
      if (savedVitals) setVitals(JSON.parse(savedVitals));
    } catch (e) {
      console.error("Failed to load vitals", e);
    }
  }, []);

  // Persist State
  useEffect(() => localStorage.setItem('foodLogs', JSON.stringify(foodLogs)), [foodLogs]);
  useEffect(() => localStorage.setItem('recipes', JSON.stringify(recipes)), [recipes]);
  useEffect(() => localStorage.setItem('vitals', JSON.stringify(vitals)), [vitals]);

  const addFoodLog = (item: FoodItem) => {
    setFoodLogs(prev => [...prev, item]);
    setView(AppView.DASHBOARD); // Return to dashboard after logging
  };

  const addRecipe = (recipe: JuiceRecipe) => {
    setRecipes(prev => [...prev, recipe]);
  };

  const removeRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addVitalLog = (log: VitalLog) => {
    setVitals(prev => [...prev, log]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-200">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-20">
        <div className="p-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                VitalBalance
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">AI Health Tracker</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                        view === item.id 
                        ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 2} />
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="p-8">
            <div className="bg-slate-900 rounded-xl p-4 text-white">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Active</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <span className="font-bold text-teal-700">VitalBalance</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-20 pt-20 px-4 md:hidden">
            <nav className="space-y-4">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-4 w-full px-6 py-4 rounded-xl text-lg ${
                        view === item.id 
                        ? 'bg-teal-50 text-teal-700 font-bold' 
                        : 'text-slate-500'
                    }`}
                >
                    <item.icon size={24} />
                    {item.label}
                </button>
            ))}
            </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            {view === AppView.DASHBOARD && <Dashboard foodLogs={foodLogs} vitalLogs={vitals} onNavigate={setView}/>}
            {view === AppView.FOOD_LOG && <FoodLens onAddFood={addFoodLog} logs={foodLogs} />}
            {view === AppView.JUICE_BAR && <JuiceBar savedRecipes={recipes} onSaveRecipe={addRecipe} onDeleteRecipe={removeRecipe} />}
            {view === AppView.VITALS && <VitalsTracker logs={vitals} onAddLog={addVitalLog} />}
        </div>
      </main>

    </div>
  );
};

export default App;