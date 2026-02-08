
import React, { useState, useEffect, useRef } from 'react';

interface ListeningModuleProps {
  theme: string;
  onFinish: (transcript: string) => void;
}

const ListeningModule: React.FC<ListeningModuleProps> = ({ theme, onFinish }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) recognitionRef.current.stop();
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Leaving lang empty or setting to browser default to allow the engine to use its best-effort detection
      recognitionRef.current.lang = navigator.language || 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) setTranscript(prev => prev + ' ' + final);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, []);

  const startListening = async () => {
    setIsListening(true);
    setTranscript('');
    if (recognitionRef.current) recognitionRef.current.start();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        setVolume(dataArray.reduce((a, b) => a + b) / dataArray.length);
        if (isListening) requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) { console.error(err); }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close();
    // Allow a small buffer for the final processing to settle
    setTimeout(() => onFinish(transcript), 800);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="serif text-4xl font-light italic text-stone-800 tracking-tight">Listening to: {theme}</h2>
        <p className="text-stone-300 text-[10px] uppercase tracking-[0.4em] font-bold">Automatic Language Understanding</p>
      </div>

      <div className="relative flex items-center justify-center h-80 w-80">
        <div 
          className="absolute inset-0 bg-stone-200 rounded-full transition-all duration-300 ease-out"
          style={{ 
            transform: `scale(${isListening ? 1 + (volume / 100) * 1.5 : 0.8})`, 
            opacity: isListening ? 0.15 : 0.05 
          }}
        />
        <div 
          className="absolute inset-4 border border-stone-100 rounded-full animate-[spin_20s_linear_infinite]"
          style={{ display: isListening ? 'block' : 'none' }}
        />
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${
            isListening ? 'bg-stone-900 ring-[20px] ring-stone-50' : 'bg-white hover:bg-stone-50 ring-[20px] ring-transparent'
          }`}
        >
          {isListening ? (
            <div className="w-10 h-10 bg-white rounded-sm" />
          ) : (
            <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-stone-400 border-b-[15px] border-b-transparent ml-2" />
          )}
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white p-12 rounded-[3rem] shadow-sm border border-stone-100 min-h-[240px] transition-all duration-1000 flex items-center justify-center">
        <p className="text-stone-400 serif text-3xl font-light italic leading-relaxed text-center px-4">
          {transcript || (isListening ? "Gathering words..." : "Click to speak in any language. Your rhythm and words are preserved as they are.")}
        </p>
      </div>

      {isListening && (
        <div className="flex items-center space-x-6">
          <div className="h-1.5 w-1.5 bg-stone-900 rounded-full animate-ping" />
          <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-stone-900">Archiving Experience</p>
          <div className="h-1.5 w-1.5 bg-stone-900 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

export default ListeningModule;
