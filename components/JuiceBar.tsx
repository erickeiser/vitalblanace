import React, { useState } from 'react';
import { generateJuiceRecipe } from '../services/geminiService';
import { JuiceRecipe } from '../types';
import { Sparkles, Droplet, Clock, Loader2, Save, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface JuiceBarProps {
    savedRecipes: JuiceRecipe[];
    onSaveRecipe: (recipe: JuiceRecipe) => void;
    onDeleteRecipe: (id: string) => void;
}

export const JuiceBar: React.FC<JuiceBarProps> = ({ savedRecipes, onSaveRecipe, onDeleteRecipe }) => {
    const [preferences, setPreferences] = useState('');
    const [healthConditions, setHealthConditions] = useState('High Blood Pressure, High Blood Sugar');
    const [loading, setLoading] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<JuiceRecipe | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!healthConditions.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const recipe = await generateJuiceRecipe(preferences, healthConditions);
            setGeneratedRecipe(recipe);
        } catch (err) {
            setError("Could not generate recipe. Please check your connection or API settings.");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">The Juice Bar</h2>
                <p className="text-slate-500">AI-powered recipes to manage hypertension and diabetes naturally.</p>
            </div>

            {/* Generator Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">My Health Focus</label>
                        <input 
                            type="text" 
                            value={healthConditions}
                            onChange={(e) => setHealthConditions(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. High BP, Diabetes"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Flavor Preferences / Ingredients</label>
                        <input 
                            type="text" 
                            value={preferences}
                            onChange={(e) => setPreferences(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. No ginger, love beets"
                        />
                    </div>
                </div>
                
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20} />}
                    {loading ? "Brewing Recipe..." : "Generate Healing Recipe"}
                </button>
            </div>

            {/* Generated Recipe Result */}
            {generatedRecipe && (
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold mb-2 inline-block">FRESHLY GENERATED</span>
                            <h3 className="text-2xl font-bold text-emerald-900">{generatedRecipe.name}</h3>
                            <p className="text-emerald-700 mt-1">{generatedRecipe.description}</p>
                        </div>
                        <button 
                            onClick={() => { onSaveRecipe(generatedRecipe); setGeneratedRecipe(null); }}
                            className="bg-white text-emerald-600 p-3 rounded-full shadow-sm hover:bg-emerald-100 transition-colors"
                        >
                            <Save size={24} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-6">
                        <div>
                            <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                <Droplet size={18}/> Ingredients
                            </h4>
                            <ul className="space-y-2">
                                {generatedRecipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-center gap-2 text-emerald-800 bg-white/50 p-2 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                <Clock size={18}/> Instructions
                            </h4>
                            <ol className="space-y-3">
                                {generatedRecipe.instructions.map((step, i) => (
                                    <li key={i} className="text-emerald-800 text-sm">
                                        <span className="font-bold mr-2">{i+1}.</span>{step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-emerald-200">
                        <h4 className="font-bold text-emerald-900 mb-2">Benefits</h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedRecipe.benefits.map((b, i) => (
                                <span key={i} className="bg-white text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-100">{b}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Recipes List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Your Recipe Book</h3>
                {savedRecipes.length === 0 && <p className="text-slate-400 italic">No saved recipes yet. Generate one above!</p>}
                
                <div className="grid md:grid-cols-2 gap-4">
                    {savedRecipes.map(recipe => (
                        <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div 
                                className="p-5 cursor-pointer"
                                onClick={() => toggleExpand(recipe.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 text-lg">{recipe.name}</h4>
                                    {expandedId === recipe.id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                                </div>
                                <p className="text-slate-500 text-sm mt-2 line-clamp-2">{recipe.description}</p>
                            </div>
                            
                            {expandedId === recipe.id && (
                                <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100 pt-4">
                                     <div className="mb-4">
                                        <h5 className="font-semibold text-sm text-slate-700 mb-2">Ingredients</h5>
                                        <ul className="text-sm text-slate-600 space-y-1">
                                            {recipe.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
                                        </ul>
                                     </div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteRecipe(recipe.id); }}
                                        className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1 mt-2"
                                     >
                                        <Trash2 size={16}/> Remove Recipe
                                     </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};