import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { FoodItem, VitalLog, MacroNutrients } from '../types';
import { Activity, Heart, Droplets, Zap } from 'lucide-react';

interface DashboardProps {
  foodLogs: FoodItem[];
  vitalLogs: VitalLog[];
  onNavigate: (view: any) => void;
}

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-4">{title}</h3>
    {children}
  </div>
);

const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: string; subtext?: string; color: string }> = ({ icon, label, value, subtext, color }) => (
  <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
    <div className={`p-3 rounded-lg ${color} text-white shadow-md`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-xs font-medium">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800 my-0.5">{value}</h4>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ foodLogs, vitalLogs }) => {
  // Calculate Daily Totals
  const today = new Date().toDateString();
  const todaysFood = foodLogs.filter(f => new Date(f.timestamp).toDateString() === today);
  
  const totalMacros = todaysFood.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat,
    sugar: acc.sugar + item.sugar,
    sodium: acc.sodium + item.sodium,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0 } as MacroNutrients);

  // Get Latest Vitals
  const latestBP = vitalLogs.filter(v => v.systolic).sort((a, b) => b.timestamp - a.timestamp)[0];
  const latestSugar = vitalLogs.filter(v => v.bloodSugar).sort((a, b) => b.timestamp - a.timestamp)[0];

  // Prepare Chart Data (Last 7 days)
  const chartData = vitalLogs
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-14)
    .map(log => ({
      date: new Date(log.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      systolic: log.systolic,
      diastolic: log.diastolic,
      sugar: log.bloodSugar,
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox 
          icon={<Activity size={20} />} 
          label="Blood Pressure" 
          value={latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "--/--"} 
          subtext="mmHg"
          color="bg-rose-500" 
        />
        <StatBox 
          icon={<Droplets size={20} />} 
          label="Blood Sugar" 
          value={latestSugar ? `${latestSugar.bloodSugar}` : "--"} 
          subtext="mg/dL"
          color="bg-blue-500" 
        />
        <StatBox 
          icon={<Zap size={20} />} 
          label="Calories Today" 
          value={Math.round(totalMacros.calories).toString()} 
          subtext="kcal"
          color="bg-amber-500" 
        />
        <StatBox 
          icon={<Heart size={20} />} 
          label="Sodium Today" 
          value={`${Math.round(totalMacros.sodium)}`} 
          subtext="mg (Limit: 1500)"
          color="bg-teal-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Blood Pressure Trends" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorSys)" name="Systolic" />
                <Area type="monotone" dataKey="diastolic" stroke="#fb7185" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Diastolic" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Macro Breakdown">
          <div className="h-64 w-full flex flex-col justify-center space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Sugar</span>
                    <span className="font-bold">{totalMacros.sugar.toFixed(1)}g</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                        className="bg-orange-400 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((totalMacros.sugar / 50) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Sodium</span>
                    <span className="font-bold">{totalMacros.sodium.toFixed(0)}mg</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                        className="bg-red-400 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((totalMacros.sodium / 2300) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Carbs</span>
                    <span className="font-bold">{totalMacros.carbs.toFixed(1)}g</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((totalMacros.carbs / 300) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Protein</span>
                    <span className="font-bold">{totalMacros.protein.toFixed(1)}g</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((totalMacros.protein / 100) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
