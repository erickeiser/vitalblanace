import React, { useState } from 'react';
import { VitalLog } from '../types';
import { PlusCircle, Activity, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VitalsTrackerProps {
    logs: VitalLog[];
    onAddLog: (log: VitalLog) => void;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({ logs, onAddLog }) => {
    const [sys, setSys] = useState('');
    const [dia, setDia] = useState('');
    const [sugar, setSugar] = useState('');
    const [type, setType] = useState<'bp' | 'sugar'>('bp');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: VitalLog = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            systolic: type === 'bp' ? Number(sys) : undefined,
            diastolic: type === 'bp' ? Number(dia) : undefined,
            bloodSugar: type === 'sugar' ? Number(sugar) : undefined
        };
        onAddLog(newLog);
        setSys('');
        setDia('');
        setSugar('');
    };

    const chartData = logs
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(l => ({
            date: new Date(l.timestamp).toLocaleDateString(),
            time: new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            systolic: l.systolic,
            diastolic: l.diastolic,
            bloodSugar: l.bloodSugar
        }));

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            <div className="grid md:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
                    <h3 className="font-bold text-xl text-slate-800 mb-6">Log Measurement</h3>
                    
                    <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
                        <button 
                            onClick={() => setType('bp')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'bp' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Blood Pressure
                        </button>
                        <button 
                            onClick={() => setType('sugar')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'sugar' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Blood Sugar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {type === 'bp' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Systolic</label>
                                    <input 
                                        type="number" 
                                        value={sys} onChange={e => setSys(e.target.value)}
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-center font-mono text-lg"
                                        placeholder="120"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Diastolic</label>
                                    <input 
                                        type="number" 
                                        value={dia} onChange={e => setDia(e.target.value)}
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-center font-mono text-lg"
                                        placeholder="80"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Glucose (mg/dL)</label>
                                <input 
                                    type="number" 
                                    value={sugar} onChange={e => setSugar(e.target.value)}
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-center font-mono text-lg"
                                    placeholder="100"
                                />
                            </div>
                        )}
                        <button 
                            type="submit"
                            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <PlusCircle size={20} />
                            Save Log
                        </button>
                    </form>
                </div>

                {/* Charts Area */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="text-rose-500"/>
                            <h3 className="font-bold text-slate-700">Blood Pressure History</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.filter(d => d.systolic)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#cbd5e1"/>
                                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#cbd5e1" tick={{fontSize: 10}}/>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                                    <Line type="monotone" dataKey="diastolic" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Droplets className="text-blue-500"/>
                            <h3 className="font-bold text-slate-700">Blood Sugar History</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.filter(d => d.bloodSugar)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#cbd5e1"/>
                                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#cbd5e1" tick={{fontSize: 10}}/>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}/>
                                    <Line type="monotone" dataKey="bloodSugar" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
