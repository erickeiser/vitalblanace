import React, { useState, useRef, useCallback } from 'react';
import { Camera, Search, Plus, X, Loader2, ScanBarcode, Image as ImageIcon } from 'lucide-react';
import { analyzeFoodImage, analyzeFoodText } from '../services/geminiService';
import { FoodItem } from '../types';

interface FoodLensProps {
  onAddFood: (food: FoodItem) => void;
  logs: FoodItem[];
}

export const FoodLens: React.FC<FoodLensProps> = ({ onAddFood, logs }) => {
  const [mode, setMode] = useState<'view' | 'scan' | 'text'>('view');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('scan');
      setError(null);
    } catch (err) {
      console.error("Camera error", err);
      setError("Unable to access camera. Please use text entry.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMode('view');
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      
      const result = await analyzeFoodImage(base64);
      if (result) {
        const newFood: FoodItem = {
          id: Date.now().toString(),
          ...result.macros,
          name: result.name,
          timestamp: Date.now(),
          type: 'meal', // default
          image: canvas.toDataURL('image/jpeg', 0.1) // Low res thumbnail
        };
        onAddFood(newFood);
        stopCamera();
      } else {
        setError("Could not identify food. Try closer or better lighting.");
      }
    }
    setLoading(false);
  };

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    
    const result = await analyzeFoodText(query);
    if (result) {
      const newFood: FoodItem = {
        id: Date.now().toString(),
        ...result.macros,
        name: result.name,
        timestamp: Date.now(),
        type: 'meal',
      };
      onAddFood(newFood);
      setQuery('');
      setMode('view');
    } else {
      setError("Could not analyze text. Please try again.");
    }
    setLoading(false);
  };

  // Render List of today's logs
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Actions */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Food Lens</h2>
          <p className="text-emerald-100 mb-6 max-w-lg">
            Track your intake accurately. Use our AI scanner to analyze meals, barcodes, or nutrition labels instantly.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={startCamera}
              className="flex items-center gap-2 bg-white text-teal-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Camera size={20} />
              AI Scanner / Barcode
            </button>
            <button 
              onClick={() => setMode('text')}
              className="flex items-center gap-2 bg-teal-800/50 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800/70 transition-colors"
            >
              <Search size={20} />
              Text Search
            </button>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      {/* Mode: Camera Scanner */}
      {mode === 'scan' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl border border-slate-700">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-2xl pointer-events-none flex items-center justify-center flex-col gap-4">
                <ScanBarcode className="text-white/40 w-48 h-48 stroke-1" />
                <p className="text-white/60 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                   Align Food or Barcode
                </p>
            </div>

            <button onClick={stopCamera} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
              <X size={24} />
            </button>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button 
                onClick={captureAndAnalyze}
                disabled={loading}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {loading ? <Loader2 className="animate-spin text-teal-600" size={32}/> : <div className="w-16 h-16 rounded-full border-4 border-teal-600 bg-teal-50" />}
              </button>
            </div>
            {error && (
                <div className="absolute top-4 left-4 right-12 bg-red-500/90 text-white text-xs p-3 rounded-lg backdrop-blur">
                    {error}
                </div>
            )}
          </div>
          <p className="text-slate-400 mt-4 text-sm font-medium text-center">
             Snap a photo of your meal<br/>or scan a barcode for instant macros.
          </p>
        </div>
      )}

      {/* Mode: Text Entry */}
      {mode === 'text' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Log by Text</h3>
              <button onClick={() => setMode('view')} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
           </div>
           <form onSubmit={handleTextSearch} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., '2 eggs and avocado toast' or 'Large apple'"
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
              <button 
                type="submit" 
                disabled={loading || !query}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors flex justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Analyze & Log"}
              </button>
           </form>
           {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Daily Logs List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 px-2">Today's Intake</h3>
        {todayLogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-400">No food logged today.</p>
          </div>
        ) : (
          todayLogs.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.01]">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl">🥗</span>
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-800">{item.name}</h4>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span className="bg-slate-100 px-2 py-1 rounded">CAL: {item.calories}</span>
                  <span className={`px-2 py-1 rounded ${item.sugar > 10 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>SUG: {item.sugar}g</span>
                  <span className={`px-2 py-1 rounded ${item.sodium > 400 ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>SOD: {item.sodium}mg</span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};