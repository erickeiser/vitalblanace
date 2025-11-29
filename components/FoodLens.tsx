import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, Plus, X, Loader2, ScanBarcode, Image as ImageIcon, AlertTriangle, RotateCcw } from 'lucide-react';
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

  // Helper to safely stop all tracks
  const stopTracks = (mediaStream: MediaStream | null) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
  };

  const stopCamera = () => {
    stopTracks(stream);
    setStream(null);
  };

  // Cleanup on unmount or stream change
  useEffect(() => {
    return () => {
      if (stream) {
        stopTracks(stream);
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request camera access
      let mediaStream: MediaStream;
      try {
        // Try rear camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        console.warn("Environment camera failed, trying user camera fallback");
        // Fallback to any available video (e.g. laptop webcam)
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      // 1. Set the stream state
      setStream(mediaStream);
      // 2. Change mode to render the video element
      setMode('scan');
      setLoading(false);
    } catch (err) {
      console.error("Camera error", err);
      setError("Camera access was denied or is unavailable. Check your browser permissions.");
      setMode('view');
      setLoading(false);
    }
  };

  // KEY FIX: Attach stream to video element ONLY after render when videoRef is available
  useEffect(() => {
    if (mode === 'scan' && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [mode, stream]);

  const closeCameraMode = () => {
    stopCamera();
    setMode('view');
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure we capture the actual video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
         setError("Camera not ready. Please wait a moment.");
         setLoading(false);
         return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      
      try {
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
          closeCameraMode();
        } else {
          setError("Could not identify food. Try closer or better lighting.");
        }
      } catch (e) {
        setError("Analysis failed. Please check connection/API key or try text search.");
      }
    }
    setLoading(false);
  };

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
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
    } catch (e) {
        setError("Analysis failed. Please check connection or API key.");
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
          
          {error && (
            <div className="mt-4 flex items-center justify-between gap-2 text-white bg-red-500/30 p-2 rounded-lg backdrop-blur-sm border border-red-400/30">
               <div className="flex items-center gap-2">
                 <AlertTriangle size={16} className="shrink-0"/>
                 <span className="text-sm">{error}</span>
               </div>
               {error.includes("Camera") && (
                 <button onClick={startCamera} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                   <RotateCcw size={12}/> Retry
                 </button>
               )}
            </div>
          )}
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      {/* Mode: Camera Scanner */}
      {mode === 'scan' && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl border border-slate-700 group">
            {/* Added muted and playsInline for better mobile compatibility */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI for Barcode/Food */}
            <div className="absolute inset-0 m-8 pointer-events-none flex flex-col items-center justify-center">
                {/* Scanner Frame */}
                <div className="w-64 h-48 border-2 border-white/50 rounded-lg relative flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-500 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-500 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-500 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-500 -mb-1 -mr-1"></div>
                    
                    {/* Animated Scan Line */}
                    <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
                
                <div className="mt-8 flex items-center gap-2 text-white/80 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                   <ScanBarcode size={20} />
                   <span className="text-sm font-medium">Point at Food or Barcode</span>
                </div>
            </div>

            <button onClick={closeCameraMode} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors pointer-events-auto">
              <X size={24} />
            </button>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
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
        </div>
      )}

      {/* Mode: Text Entry */}
      {mode === 'text' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in zoom-in-95">
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
      
      {/* Add CSS for scan animation */}
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};