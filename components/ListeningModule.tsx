
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';

interface ListeningModuleProps {
  theme: string;
  onFinish: (transcript: string, mediaBlob?: Blob, mediaType?: 'audio' | 'upload') => void;
  lang: Language;
  initialMode?: 'voice' | 'text';
}

const ListeningModule: React.FC<ListeningModuleProps> = ({ theme, onFinish, lang, initialMode = 'voice' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>(initialMode);
  const [isUploading, setIsUploading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const t = {
    en: {
      header: "I am listening",
      voiceMode: "Real-time Audio",
      textMode: "Text Mode",
      placeholder: "I am ready to read your story... Type here at your own pace.",
      finished: "Finished Writing",
      encouragement: "“Take your time. I am recording your words exactly as you speak them.”",
      upload: "Upload Audio",
      uploading: "Extracting information...",
      liveSync: "Live Sync"
    },
    zh: {
      header: "我在倾听",
      voiceMode: "实时音频",
      textMode: "文字模式",
      placeholder: "我正准备好阅读你的故事... 请按照你的节奏输入。",
      finished: "完成书写",
      encouragement: "“慢慢来。我正在一字不差地记录你的述说。”",
      upload: "上传音频",
      uploading: "正在提取信息...",
      liveSync: "实时同步"
    },
    es: {
      header: "Estoy escuchando",
      voiceMode: "Audio en tiempo real",
      textMode: "Modo texto",
      placeholder: "Estoy listo para leer tu historia... Escribe aquí a tu propio ritmo.",
      finished: "Terminar de escribir",
      encouragement: "“Tómate tu tiempo. Estoy grabando tus palabras exactamente como las dices.”",
      upload: "Subir Audio",
      uploading: "Extrayendo información...",
      liveSync: "Sincronización en vivo"
    }
  }[lang];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && inputMode === 'voice') {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang === 'zh' ? 'zh-CN' : lang === 'es' ? 'es-ES' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (final) setTranscript(prev => prev + ' ' + final);
        setInterimTranscript(interim);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [inputMode, lang]);

  const startListening = async () => {
    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    chunksRef.current = [];
    
    if (recognitionRef.current) recognitionRef.current.start();
    
    try {
      const constraints = { 
        audio: true, 
        video: false 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Media Recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();

      // Audio Visualizer
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
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        setTimeout(() => onFinish(transcript, blob, 'audio'), 800);
      };
    } else {
      setTimeout(() => onFinish(transcript), 800);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    onFinish("", file, 'upload');
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-6 animate-fade-in w-full max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="serif text-3xl font-light italic text-stone-800 tracking-tight">{t.header}: {theme}</h2>
        <div className="flex justify-center space-x-4">
          <button onClick={() => setInputMode('voice')} className={`text-[10px] uppercase tracking-[0.2em] font-bold ${inputMode === 'voice' ? 'text-stone-900 border-b border-stone-900' : 'text-stone-300'}`}>{t.voiceMode}</button>
          <button onClick={() => setInputMode('text')} className={`text-[10px] uppercase tracking-[0.2em] font-bold ${inputMode === 'text' ? 'text-stone-900 border-b border-stone-900' : 'text-stone-300'}`}>{t.textMode}</button>
        </div>
      </div>

      {inputMode === 'text' ? (
        <div className="w-full space-y-4">
          <textarea 
            value={transcript} 
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t.placeholder}
            className="w-full h-64 p-8 serif text-2xl font-light italic bg-white border border-stone-100 rounded-[2rem] shadow-sm outline-none focus:border-stone-300 transition-colors resize-none"
          />
          <div className="flex justify-between items-center">
            <label className="cursor-pointer px-6 py-2 border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
              {isUploading ? t.uploading : t.upload}
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            <button onClick={() => onFinish(transcript)} disabled={!transcript.trim()} className="px-12 py-3 bg-stone-900 text-white rounded-full font-medium shadow-lg disabled:opacity-20 transition-all">{t.finished}</button>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col items-center space-y-6 w-full">
          <div className="relative flex items-center justify-center h-64 w-64">
            <div className="absolute inset-0 bg-stone-200 rounded-full transition-all duration-300 ease-out" style={{ transform: `scale(${isListening ? 1 + (volume / 100) * 1.5 : 0.8})`, opacity: isListening ? 0.15 : 0.05 }} />
            
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-xl ${isListening ? 'bg-stone-900/80 backdrop-blur-sm' : 'bg-white border border-stone-100'}`}
            >
              {isListening ? <div className="w-8 h-8 bg-white rounded-sm" /> : <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-stone-400 border-b-[10px] border-b-transparent ml-1" />}
            </button>
          </div>

          {/* Live Sync Display */}
          {(transcript || interimTranscript) && isListening && (
            <div className="w-full p-6 bg-stone-50/50 border border-stone-100 rounded-2xl animate-fade-in">
              <div className="text-[10px] uppercase font-bold tracking-widest text-stone-300 mb-2">{t.liveSync}</div>
              <p className="serif text-lg text-stone-700 italic leading-relaxed">
                {transcript}
                <span className="text-stone-400">{interimTranscript}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="text-center italic text-stone-400 text-sm serif px-4 h-12">
        {isListening ? t.encouragement : ""}
      </div>
    </div>
  );
};

export default ListeningModule;
