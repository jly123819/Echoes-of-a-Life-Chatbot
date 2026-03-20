
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import ListeningModule from './components/ListeningModule';
import TimelineView from './components/TimelineView';
import { 
  Step, 
  LifeMemoryStore, 
  MemorySession, 
  LifePhase, 
  TimelineEvent, 
  LifeWisdom,
  PersonProfile,
  Visibility,
  Language,
  ArchiveType
} from './types';
import { 
  distillStory, 
  extractLifeStructure, 
  analyzeNarrativeDepth,
  processMultimedia
} from './services/geminiService';

const STORAGE_KEY = 'life_echoes_store_v1';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('cover');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState('');
  const [newThemeInput, setNewThemeInput] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiDecision, setAiDecision] = useState<{decision: string, message?: string} | null>(null);
  const [distilledPreview, setDistilledPreview] = useState<string>('');
  const [saveOption, setSaveOption] = useState<'original' | 'polished'>('polished');
  const [searchQuery, setSearchQuery] = useState('');
  const [uiLang, setUiLang] = useState<Language>('en');
  
  const [nameInput, setNameInput] = useState('');
  const [archiveTitleInput, setArchiveTitleInput] = useState('');
  const [archiveTypeInput, setArchiveTypeInput] = useState<ArchiveType>(ArchiveType.INDIVIDUAL);
  const [membersInput, setMembersInput] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordCreateInput, setPasswordCreateInput] = useState('');
  const [targetPersonId, setTargetPersonId] = useState<string | null>(null);
  const [isExitingCover, setIsExitingCover] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedSession, setSelectedSession] = useState<MemorySession | null>(null);
  const [currentMediaBlob, setCurrentMediaBlob] = useState<Blob | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'audio' | 'upload' | null>(null);
  const [timeRangeInput, setTimeRangeInput] = useState('');
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [conflictResolutionMode, setConflictResolutionMode] = useState<'overwrite' | 'sync' | null>(null);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [pendingWisdoms, setPendingWisdoms] = useState<any[]>([]);
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingTime, setLoadingTime] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'needs_edit'>('pending');
  
  const getLoadingMessage = () => {
    if (loadingStep === 1) return `[ 正在深度解析您的回忆... 已沉淀 ${loadingTime} 秒 ⏳ ]`;
    if (loadingStep === 2) return `[ 正在检索历史档案并进行逻辑比对... 已运行 ${loadingTime} 秒 🔍 ]`;
    return currentT.weaving;
  };

  const [store, setStore] = useState<LifeMemoryStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { activePersonId: null, people: {} };
    } catch (e) {
      return { activePersonId: null, people: {} };
    }
  });

  const activePerson = store.activePersonId ? store.people[store.activePersonId] : null;

  useEffect(() => {
    if (store.activePersonId || Object.keys(store.people).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  }, [store]);

  const t = {
    en: {
      title: "VoicesPreserved",
      tagline: "Your stories matter. Take your time.",
      open: "Open the book",
      record: "Record a Memory",
      archive: "View Archive",
      switch: "Switch Archive",
      wisdom: "Life Wisdom",
      search: "Search Memories",
      export: "Export Archive",
      archivingFor: "Active Archive:",
      back: "Back",
      begin: "Begin",
      tellMore: "Tell me more",
      finished: "No, that is all",
      polished: "Polished",
      original: "Keep raw",
      viewArchive: "See my Life Path",
      harvested: "Memory Preserved",
      weaving: "I am carefully weaving your story into the archive...",
      loading1: "[Deeply analyzing your memories... ⏳]",
      loading2: "[Retrieving historical archives and performing logical comparison... 85%]",
      approvePrompt: "This is my suggestion for polishing your story. Do you approve of saving it to the official archive?",
      approveBtn: "Approve",
      editBtn: "Need Changes",
      localArchiveAsk: "Would you like to save this original audio file to your local device for archiving?",
      conflictFound: "I found a logical conflict:",
      whoIsSpeaking: "Select an Archive",
      whatName: "What is your name?",
      whatTitle: "Give your archive a title",
      chooseType: "Choose your archive type",
      indivTitle: "Individual Archive",
      indivDesc: "A private legacy book just for you.",
      famTitle: "Family Shared Archive",
      famDesc: "A shared space for multiple family members to contribute.",
      addMembers: "Who else will contribute?",
      addMemberBtn: "Add Person",
      setPassphrase: "Choose a private passphrase",
      passOptional: "(Optional - leave blank for an open archive)",
      newArchive: "+ Create New Archive",
      openArchive: "Open Archive",
      confirmAndCreate: "Create my Archive",
      passwordPrompt: "Enter the private passphrase",
      welcomeTitle: "I am here to listen.",
      welcomeSub: "I am your narrative companion. I remember everything you tell me.",
      themePrompt: "What shall we talk about?",
      customTheme: "+ Create a custom theme...",
      recordedAt: "Recorded at",
      earnedAt: "Earned at",
      fallbackTime: "Recent Record",
      emptyTimeline: "Your life path will emerge here as we speak together.",
      reflectHeader: "I hear what you're saying...",
      memoriesArchived: "memories archived",
      conflictHeader: "A Moment for Clarity",
      conflictPrompt: "I notice two different versions. I want to make sure I remember this correctly.",
      storyDetail: "Story Detail",
      close: "Close",
      rawTranscript: "Original Recording",
      polishedStory: "Polished Narrative",
      multimediaChoice: "How would you like to share this memory?",
      realtimeAudio: "Real-time Audio",
      realtimeVideo: "Real-time Video",
      localSavePrompt: "This record is precious. Would you like to save the original file and transcript to your device as a permanent archive?",
      localSaveYes: "Yes, save locally",
      localSaveNo: "No, cloud only",
      timePrompt: "When did this memory take place?",
      timePlaceholder: "e.g., 2025.08 - 2025.09",
      overlapDetected: "I notice some overlap in your timeline.",
      overlapPrompt: "How should I handle this?",
      overwrite: "Overwrite",
      syncStack: "Sync/Stack",
      themes: [
        "A memory from childhood", "A memory about family and home",
        "A memory about an important choice", "A memory about a difficult time",
        "A life lesson", "A turning point",
        "Something I miss dearly", "A challenge I overcame"
      ]
    },
    zh: {
      title: "声音永恒 (VoicesPreserved)",
      tagline: "你的故事，值得被记录。请慢慢说。",
      open: "翻开书卷",
      record: "记录一段回忆",
      archive: "查看档案",
      switch: "切换档案",
      wisdom: "人生智慧",
      search: "搜索记忆",
      export: "导出档案",
      archivingFor: "当前档案：",
      back: "返回",
      begin: "开始",
      tellMore: "再说一点",
      finished: "就这些了",
      polished: "整理后的",
      original: "保留原话",
      viewArchive: "查看我的生命档案",
      harvested: "记忆已珍藏",
      weaving: "我正在精心编织这段回忆...",
      loading1: "[正在深度解析您的回忆... ⏳]",
      loading2: "[正在检索历史档案并进行逻辑比对... 85%]",
      approvePrompt: "这是我对您故事的润色建议。您是否批准将其存入正式档案？",
      approveBtn: "批准",
      editBtn: "需修改",
      localArchiveAsk: "是否需要将此原始音频文件保存到您的本地设备归档中？",
      conflictFound: "我发现了一个逻辑冲突：",
      whoIsSpeaking: "选择一个档案",
      whatName: "请问您的姓名？",
      whatTitle: "为您的档案起一个标题",
      chooseType: "选择档案类型",
      indivTitle: "个人专属档案",
      indivDesc: "一本只属于您个人的私密生命之书。",
      famTitle: "家庭共享档案",
      famDesc: "一个多位家庭成员可以共同记录的空间。",
      addMembers: "还有谁会参与记录？",
      addMemberBtn: "添加成员",
      setPassphrase: "设置一个私密口令",
      passOptional: "（可选 - 留空则创建开放档案）",
      newArchive: "+ 创建新档案",
      openArchive: "打开档案",
      confirmAndCreate: "创建我的档案",
      passwordPrompt: "请输入私密口令",
      welcomeTitle: "我在倾听。",
      welcomeSub: "我是你的叙事伙伴。我会替你记住所有你分享的细节。",
      themePrompt: "今天想聊聊什么？",
      customTheme: "+ 自定义一个生命主题...",
      recordedAt: "记录于",
      earnedAt: "领悟于",
      fallbackTime: "记录时间",
      emptyTimeline: "您的生命足迹将随着我们的交谈慢慢浮现。",
      reflectHeader: "我听到了你的分享...",
      memoriesArchived: "段珍贵回忆",
      conflictHeader: "记忆的核对",
      conflictPrompt: "我注意到了一些不同的版本，我想确保我记录得准确。",
      storyDetail: "故事详情",
      close: "关闭",
      rawTranscript: "原始记录",
      polishedStory: "润色后的叙事",
      multimediaChoice: "您现在想通过何种方式分享这段回忆？",
      realtimeAudio: "实时音频输入",
      localSavePrompt: "刚才记录的这段内容非常宝贵，您是否需要将其保存到本地设备作为永久档案？",
      localSaveYes: "是，保存到本地",
      localSaveNo: "否，仅保留在云端",
      timePrompt: "这段回忆发生的具体时间区间是？",
      timePlaceholder: "例如：2025.08 - 2025.09",
      overlapDetected: "我注意到您的时间线上存在重叠。",
      overlapPrompt: "您希望如何处理？",
      overwrite: "覆盖 (Overwrite)",
      syncStack: "同步 (Sync/Stack)",
      themes: [
        "童年的一个回忆", "关于家庭和故乡的往事",
        "一个重要的人生长择", "一次艰难但难忘的时光",
        "生活教会我的道理", "命运的转折点",
        "一些我非常怀念的事物", "我曾经克服过的一次挑战"
      ]
    },
    es: {
      title: "VocesPreservadas",
      tagline: "Tus historias importan. Tómate tu tiempo.",
      open: "Abrir el libro",
      record: "Grabar un recuerdo",
      archive: "Ver archivo",
      switch: "Cambiar archivo",
      wisdom: "Sabiduría de vida",
      search: "Buscar memorias",
      export: "Exportar archivo",
      archivingFor: "Archivo activo:",
      back: "Atrás",
      begin: "Comenzar",
      tellMore: "Cuéntame más",
      finished: "Eso es todo",
      polished: "Pulido",
      original: "Original",
      viewArchive: "Ver mi camino de vida",
      harvested: "Recuerdo preservado",
      weaving: "Estoy tejiendo cuidadosamente tu historia...",
      whoIsSpeaking: "Selecciona un archivo",
      whatName: "¿Cuál es tu nombre?",
      whatTitle: "Dale un título a tu archivo",
      chooseType: "Elige el tipo de archivo",
      indivTitle: "Archivo Individual",
      indivDesc: "Un libro de legado privado solo para ti.",
      famTitle: "Archivo Familiar Compartido",
      famDesc: "Un espacio compartido para que varios miembros contribuyan.",
      addMembers: "¿Quién más contribuirá?",
      addMemberBtn: "Añadir persona",
      setPassphrase: "Elige una contraseña privada",
      passOptional: "(Opcional - dejar en blanco para archivo abierto)",
      newArchive: "+ Crear nuevo archivo",
      openArchive: "Abrir archivo",
      confirmAndCreate: "Crear mi archivo",
      passwordPrompt: "Introduce la contraseña privada",
      welcomeTitle: "Estoy aquí para escuchar.",
      welcomeSub: "Soy tu compañero narrativo. Recuerdo todo lo que me dices.",
      themePrompt: "¿De qué vamos a hablar?",
      customTheme: "+ Crear un tema personalizado...",
      recordedAt: "Grabado el",
      earnedAt: "Ganado el",
      fallbackTime: "Registro reciente",
      emptyTimeline: "Tu camino de vida emergerá mientras hablamos.",
      reflectHeader: "Escucho lo que dices...",
      memoriesArchived: "recuerdos archivados",
      conflictHeader: "Un Momento de Claridad",
      conflictPrompt: "Noto dos versiones diferentes. Quiero asegurarme de recordar esto correctamente.",
      storyDetail: "Detalle de la historia",
      close: "Cerrar",
      rawTranscript: "Grabación original",
      polishedStory: "Narrativa pulida",
      themes: [
        "Un recuerdo de la infancia", "Sobre la familia y el hogar",
        "Una elección importante", "Un momento difícil",
        "Lección de vida", "Punto de inflexión",
        "Algo que extraño mucho", "Un desafío superado"
      ]
    }
  };

  const currentT = t[uiLang];

  const initializeNewSession = () => {
    const id = `sess_${Date.now()}`;
    setCurrentSessionId(id);
    setStep('theme');
  };

  const runLoadingSequence = async (callback: () => Promise<void>) => {
    setLoading(true);
    setLoadingStep(1);
    setLoadingTime(0);
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingStep(2);
      await callback();
    } finally {
      clearInterval(timer);
      setLoading(false);
      setLoadingStep(0);
      setLoadingTime(0);
    }
  };

  const handleFinishListening = async (transcript: string, mediaBlob?: Blob, mediaType?: 'audio' | 'upload') => {
    setCurrentTranscript(transcript);
    setCurrentMediaBlob(mediaBlob || null);
    setCurrentMediaType(mediaType || null);

    if (mediaType === 'upload' && mediaBlob) {
      processUploadedFile(mediaBlob);
      return;
    }

    if (!transcript.trim()) return;
    
    setStep('distill');
    await runLoadingSequence(async () => {
      setErrorMessage(null);
      try {
        const result = await analyzeNarrativeDepth(transcript, currentTheme);
        setAiDecision(result);
        if (result.decision === 'accept') { 
          await finalizeSession(transcript); 
        } else { 
          setStep('reflect'); 
        }
      } catch (e: any) { 
        console.error("Narrative analysis failed:", e);
        await finalizeSession(transcript); 
      }
    });
  };

  const processUploadedFile = async (file: Blob) => {
    setStep('distill');
    await runLoadingSequence(async () => {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        
        const base64 = await base64Promise;
        const result = await processMultimedia(base64, file.type);
        setExtractionResult(result);
        setCurrentTranscript(result.transcript);
        setDistilledPreview(result.summary);
        
        // Populate pending events and wisdoms from multimedia extraction
        setPendingEvents([{
          event: currentTheme || "Multimedia Memory",
          phase: LifePhase.SENIORITY,
          description: result.summary,
          confidence: 1,
          timeRange: currentT.fallbackTime
        }]);
        
        if (result.wisdomPoints) {
          setPendingWisdoms(result.wisdomPoints.map((w: string) => ({
            belief: w,
            explanation: "Extracted from multimedia archive.",
            confidence: 1
          })));
        }

        setSaveOption('original');
      } catch (e) {
        console.error("File processing failed:", e);
        setStep('theme');
      }
    });
  };

  const handleLocalSave = () => {
    if (!currentMediaBlob) return;
    const url = URL.createObjectURL(currentMediaBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echoes_${currentSessionId}.${currentMediaBlob.type.split('/')[1] || 'bin'}`;
    a.click();
    
    // Also save transcript
    const transcriptBlob = new Blob([currentTranscript], { type: 'text/plain' });
    const transcriptUrl = URL.createObjectURL(transcriptBlob);
    const b = document.createElement('a');
    b.href = transcriptUrl;
    b.download = `echoes_${currentSessionId}_transcript.txt`;
    b.click();
    
    setStep('time_collection');
  };

  const checkTimelineOverlap = (timeRange: string) => {
    if (!activePerson) return false;
    return activePerson.timeline.some(e => e.timeRange === timeRange);
  };

  const finalizeSessionWithTime = (resolution: 'overwrite' | 'sync' | 'none' = 'none') => {
    const pId = store.activePersonId;
    if (!pId || !store.people[pId]) return;

    setStore(prev => {
      const target = prev.people[pId];
      let newTimeline = [...target.timeline];
      
      if (resolution === 'overwrite') {
        newTimeline = newTimeline.filter(e => e.timeRange !== timeRangeInput);
      }

      const newEvents = pendingEvents.map((e: any) => ({
        ...e,
        id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recordedAt: Date.now(),
        timeRange: timeRangeInput,
        evidenceSessions: [currentSessionId],
        visibility: Visibility.PRIVATE
      }));

      const newWisdoms = pendingWisdoms.map((w: any) => ({
        ...w,
        id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recordedAt: Date.now(),
        evidenceSessions: [currentSessionId],
        visibility: Visibility.PRIVATE
      }));

      const newSession: MemorySession = {
        id: currentSessionId,
        timestamp: Date.now(),
        theme: currentTheme,
        transcript: currentTranscript,
        polishedTranscript: distilledPreview,
        mediaType: currentMediaType || undefined,
        status: 'completed'
      };

      return {
        ...prev,
        people: {
          ...prev.people,
          [pId]: {
            ...target,
            sessions: [...(target.sessions || []), newSession],
            timeline: [...newTimeline, ...newEvents],
            wisdoms: [...(target.wisdoms || []), ...newWisdoms]
          }
        }
      };
    });
    setStep('timeline');
  };

  const finalizeSession = async (transcript: string) => {
    const pId = store.activePersonId;
    if (!pId || !store.people[pId]) return;
    
    setStep('distill');
    
    await runLoadingSequence(async () => {
      setErrorMessage(null);
      try {
        const distilled = await distillStory(transcript, currentTheme);
        setDistilledPreview(distilled || transcript);
        
        const person = store.people[pId];
        const contextStr = (person.timeline || []).slice(-10).map(e => `${e.phase} (${e.timeRange}): ${e.event}`).join('\n');
        
        const extraction = await extractLifeStructure(transcript, contextStr);
        let wisdoms = extraction?.wisdoms || [];
        let events = extraction?.events || [];
        
        setPendingEvents(events);
        setPendingWisdoms(wisdoms);
        setConflicts(extraction?.conflicts || []);

        if (events.length === 0) {
          setPendingEvents([{
            event: currentTheme,
            phase: LifePhase.SENIORITY,
            description: transcript.slice(0, 150) + "...",
            confidence: 1,
            timeRange: currentT.fallbackTime
          }]);
        }
        
        setStep('distill');
      } catch (e: any) { 
        console.error("Finalizing session failed:", e);
        setErrorMessage(uiLang === 'zh' ? "AI 助手目前较忙，已为您保存原始记录。" : uiLang === 'es' ? "El asistente de IA está ocupado, se ha guardado el registro original." : "The AI assistant is busy. Your original record has been saved.");
        
        setPendingEvents([{
          event: currentTheme,
          phase: LifePhase.SENIORITY,
          description: transcript.slice(0, 150) + "...",
          confidence: 1,
          timeRange: currentT.fallbackTime
        }]);
        setDistilledPreview(transcript);
        setStep('distill');
      }
    });
  };

  const handleIdentitySelect = (personId: string) => {
    const person = store.people[personId];
    if (person.password) { 
      setTargetPersonId(personId); 
      setStep('identity_password'); 
    } else { 
      setStore(prev => ({ ...prev, activePersonId: personId })); 
      setStep('intro'); 
    }
  };

  const handleIdentityCreate = () => {
    if (!archiveTitleInput.trim()) return;
    const newId = `archive_${Date.now()}`;
    const newArchive: PersonProfile = {
      id: newId, 
      displayName: archiveTitleInput, 
      ownerName: nameInput,
      archiveType: archiveTypeInput,
      members: membersInput,
      password: passwordCreateInput || undefined,
      sessions: [], 
      timeline: [], 
      wisdoms: []
    };
    setStore(prev => ({
      ...prev, 
      activePersonId: newId, 
      people: { ...prev.people, [newId]: newArchive }
    }));
    // Reset inputs
    setNameInput('');
    setArchiveTitleInput('');
    setMembersInput([]);
    setPasswordCreateInput('');
    setStep('intro');
  };

  const handlePasswordSubmit = () => {
    if (!targetPersonId) return;
    const person = store.people[targetPersonId];
    if (person.password === passwordInput) {
      setStore(prev => ({ ...prev, activePersonId: targetPersonId }));
      setStep('intro');
      setPasswordInput('');
      setTargetPersonId(null);
    } else {
      alert(uiLang === 'zh' ? "密码错误" : uiLang === 'es' ? "Contraseña incorrecta" : "Incorrect password");
    }
  };

  const handleLogout = () => { 
    setStore(prev => ({ ...prev, activePersonId: null })); 
    setStep('cover'); 
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (!activePerson) return;
    setSelectedEvent(event);
    const sessionId = event.evidenceSessions?.[0];
    if (sessionId) {
      const session = activePerson.sessions.find(s => s.id === sessionId);
      setSelectedSession(session || null);
    }
  };

  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="bg-amber-200 text-stone-900 rounded px-1">{part}</mark> : part
        )}
      </>
    );
  };

  const filteredData = useMemo(() => {
    if (!activePerson || !searchQuery) return { sessions: [], timeline: [], wisdoms: [] };
    const q = searchQuery.toLowerCase();
    return {
      sessions: (activePerson.sessions || []).filter(s => 
        s.transcript.toLowerCase().includes(q) || 
        s.theme.toLowerCase().includes(q) ||
        (s.polishedTranscript?.toLowerCase().includes(q))
      ),
      timeline: (activePerson.timeline || []).filter(e => 
        e.event.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q)
      ),
      wisdoms: (activePerson.wisdoms || []).filter(w => 
        w.belief.toLowerCase().includes(q) || 
        w.explanation.toLowerCase().includes(q)
      )
    };
  }, [activePerson, searchQuery]);

  return (
    <Layout 
      onHomeClick={() => setStep(activePerson ? 'intro' : 'cover')}
      subtitle={activePerson ? (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-4">
            <span className="font-light italic text-stone-400 text-xs">
              {currentT.archivingFor} <span className="text-stone-900 font-medium not-italic">{activePerson.displayName}</span>
            </span>
            <button onClick={handleLogout} className="text-[10px] uppercase font-bold tracking-widest text-stone-300 hover:text-stone-900 border-l border-stone-200 pl-4">{currentT.switch} 🔁</button>
            <div className="flex space-x-2 border-l border-stone-200 pl-4">
              {['en', 'zh', 'es'].map(l => (
                <button key={l} onClick={() => setUiLang(l as Language)} className={`text-[10px] uppercase font-bold ${uiLang === l ? 'text-stone-900' : 'text-stone-200'}`}>{l}</button>
              ))}
            </div>
          </div>
          {activePerson.archiveType === ArchiveType.FAMILY && activePerson.members.length > 0 && (
            <div className="text-[10px] text-stone-400 italic">
              Contributors: {activePerson.members.join(', ')}
            </div>
          )}
        </div>
      ) : (
        <div className="flex space-x-2">
          {['en', 'zh', 'es'].map(l => (
            <button key={l} onClick={() => setUiLang(l as Language)} className={`text-[10px] uppercase font-bold ${uiLang === l ? 'text-stone-900' : 'text-stone-200'}`}>{l}</button>
          ))}
        </div>
      )}
    >
      {step === 'cover' && (
        <div className={`flex flex-col items-center justify-center min-h-[70vh] cursor-pointer transition-all duration-700 ${isExitingCover ? 'page-turn-exit' : 'animate-fade-in'}`} onClick={() => { setIsExitingCover(true); setTimeout(() => { setStep(activePerson ? 'intro' : 'identity_select'); setIsExitingCover(false); }, 800); }}>
          <div className="w-full max-w-sm aspect-[3/4] bg-[#fcfaf2] border border-stone-200 rounded-lg book-shadow flex flex-col items-center justify-center p-12 text-center relative group gap-16">
            <div className="absolute left-0 top-0 bottom-0 w-6 border-r border-stone-100 bg-stone-50/30 rounded-l-lg" />
            <div className="space-y-4">
              <h1 className="serif text-5xl font-light text-stone-900 leading-tight">{currentT.title}</h1>
            </div>
            <div className="space-y-6">
              <p className="text-stone-400 font-light italic text-sm">{currentT.tagline}</p>
              <div className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300 group-hover:text-stone-900">{currentT.open}</div>
            </div>
          </div>
        </div>
      )}

      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-fade-in">
          <div className="max-w-2xl text-center space-y-4">
            <h2 className="serif text-6xl font-extralight text-stone-900">{currentT.welcomeTitle}</h2>
            <p className="text-xl text-stone-400 font-light italic">{currentT.welcomeSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            <button onClick={initializeNewSession} className="sm:col-span-2 p-10 bg-stone-900 text-stone-50 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-all">{currentT.record}</button>
            <button onClick={() => setStep('timeline')} className="p-10 border border-stone-200 bg-white text-stone-700 rounded-[2rem] hover:-translate-y-1 transition-all">{currentT.archive}</button>
            <button onClick={() => setStep('wisdom')} className="p-10 border border-stone-200 bg-white text-stone-700 rounded-[2rem] hover:-translate-y-1 transition-all">{currentT.wisdom}</button>
            <button onClick={() => setStep('search')} className="sm:col-span-2 p-6 border border-stone-100 bg-stone-50/30 rounded-2xl text-stone-500 font-medium tracking-wide hover:bg-white transition-colors">
              🔍 {currentT.search}
            </button>
          </div>
        </div>
      )}

      {step === 'theme' && (
        <div className="space-y-10 animate-fade-in">
          <div className="text-center">
            <h2 className="serif text-4xl font-light">{currentT.themePrompt}</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {currentT.themes.map(th => (
              <button key={th} onClick={() => { setCurrentTheme(th); setStep('listen'); }} className="px-6 py-2 rounded-full border border-stone-200 text-sm hover:border-stone-900 transition-colors">{th}</button>
            ))}
            <div className="flex items-center space-x-2 w-full max-w-md mt-4">
              <input type="text" value={newThemeInput} onChange={(e) => setNewThemeInput(e.target.value)} placeholder={currentT.customTheme} className="flex-grow bg-transparent border-b border-stone-200 py-2 outline-none serif italic" />
              <button onClick={() => { if(newThemeInput) { setCurrentTheme(newThemeInput); setStep('listen'); } }} className="text-stone-900 font-bold uppercase text-[10px] tracking-widest">{currentT.begin}</button>
            </div>
          </div>
        </div>
      )}

      {step === 'listen' && <ListeningModule theme={currentTheme} onFinish={handleFinishListening} lang={uiLang} />}

      {step === 'archive_choice' && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-10 animate-fade-in">
          <h2 className="serif text-3xl font-light italic">{currentT.localSavePrompt}</h2>
          <div className="flex justify-center space-x-6">
            <button onClick={handleLocalSave} className="px-10 py-4 bg-stone-900 text-white rounded-full">{currentT.localSaveYes}</button>
            <button onClick={() => setStep('time_collection')} className="px-10 py-4 border border-stone-200 rounded-full">{currentT.localSaveNo}</button>
          </div>
        </div>
      )}

      {step === 'time_collection' && (
        <div className="max-w-md mx-auto py-12 text-center space-y-10 animate-fade-in">
          <h2 className="serif text-4xl font-light">{currentT.timePrompt}</h2>
          <input 
            type="text" 
            value={timeRangeInput} 
            onChange={(e) => setTimeRangeInput(e.target.value)} 
            placeholder={currentT.timePlaceholder}
            className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-3xl serif text-center outline-none focus:border-stone-900"
            autoFocus
          />
          <button 
            onClick={() => {
              if (checkTimelineOverlap(timeRangeInput)) {
                setStep('conflict_resolution');
              } else {
                finalizeSessionWithTime();
              }
            }} 
            className="px-14 py-4 bg-stone-900 text-white rounded-full"
          >
            {currentT.begin}
          </button>
        </div>
      )}

      {step === 'conflict_resolution' && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-10 animate-fade-in">
          <div className="p-10 bg-amber-50 border border-amber-100 rounded-[3rem] space-y-6">
            <h2 className="serif text-3xl text-amber-900">{currentT.overlapDetected}</h2>
            <p className="text-stone-600 italic">{currentT.overlapPrompt}</p>
          </div>
          <div className="flex justify-center space-x-6">
            <button onClick={() => finalizeSessionWithTime('overwrite')} className="px-10 py-4 bg-stone-900 text-white rounded-full">{currentT.overwrite}</button>
            <button onClick={() => finalizeSessionWithTime('sync')} className="px-10 py-4 border border-stone-200 rounded-full">{currentT.syncStack}</button>
          </div>
        </div>
      )}

      {step === 'reflect' && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-10">
          <h2 className="serif text-4xl font-light italic">{currentT.reflectHeader}</h2>
          <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-sm serif text-3xl leading-relaxed">
            {aiDecision?.message}
          </div>
          <div className="flex justify-center space-x-6">
            <button onClick={() => setStep('listen')} className="px-10 py-4 bg-stone-900 text-white rounded-full">{currentT.tellMore}</button>
            <button onClick={() => finalizeSession(currentTranscript)} className="px-10 py-4 border border-stone-200 rounded-full">{currentT.finished}</button>
          </div>
        </div>
      )}

      {step === 'distill' && (
        <div className="max-w-3xl mx-auto py-10 space-y-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
              <div className="serif italic text-2xl text-stone-400">
                {getLoadingMessage()}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300">{currentT.harvested}</span>
                <div className="flex space-x-4">
                  <button onClick={() => setSaveOption('polished')} className={`text-[10px] uppercase font-bold ${saveOption === 'polished' ? 'text-stone-900' : 'text-stone-300'}`}>{currentT.polished}</button>
                  <button onClick={() => setSaveOption('original')} className={`text-[10px] uppercase font-bold ${saveOption === 'original' ? 'text-stone-900' : 'text-stone-300'}`}>{currentT.original}</button>
                </div>
              </div>
              
              <div className="markdown-body serif text-4xl font-extralight text-stone-800 leading-snug italic whitespace-pre-wrap">
                {saveOption === 'polished' ? distilledPreview : currentTranscript}
              </div>

              {errorMessage && (
                <div className="p-4 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-sm italic">
                  {errorMessage}
                </div>
              )}

              {conflicts.length > 0 && (
                <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4 mt-12 animate-fade-in shadow-inner">
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-500 text-xl">✨</span>
                    <h3 className="serif text-xl font-medium text-amber-900">{currentT.conflictHeader}</h3>
                  </div>
                  <p className="text-stone-600 font-light italic">{currentT.conflictPrompt}</p>
                  <ul className="space-y-2">
                    {conflicts.map((c, i) => (
                      <li key={i} className="text-sm text-stone-700 pl-4 border-l border-amber-200 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={() => setStep('approval_workflow')} className="w-full py-5 bg-stone-900 text-white rounded-full shadow-2xl font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors">{uiLang === 'zh' ? '进入审核与批准' : uiLang === 'es' ? 'Ir a revisión y aprobación' : 'Go to Review & Approval'}</button>
            </div>
          )}
        </div>
      )}

      {step === 'approval_workflow' && (
        <div className="max-w-3xl mx-auto py-10 space-y-12 animate-fade-in">
          <div className="space-y-8">
            <div className="p-8 bg-white border border-stone-100 rounded-[3rem] shadow-sm">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300 mb-6">{currentT.polishedStory}</h3>
              <div className="serif text-3xl leading-relaxed text-stone-800 italic whitespace-pre-wrap">
                {distilledPreview}
              </div>
            </div>
            
            <div className="text-center space-y-8">
              <p className="serif text-2xl text-stone-600 italic">{currentT.approvePrompt}</p>
              <div className="flex justify-center space-x-6">
                <button onClick={() => setStep('local_archive_ask')} className="px-14 py-4 bg-stone-900 text-white rounded-full shadow-xl font-bold uppercase tracking-widest">{currentT.approveBtn}</button>
                <button onClick={() => setStep('listen')} className="px-14 py-4 border border-stone-200 rounded-full font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900">{currentT.editBtn}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'local_archive_ask' && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-10 animate-fade-in">
          <h2 className="serif text-3xl font-light italic">{currentT.localArchiveAsk}</h2>
          <div className="flex justify-center space-x-6">
            <button onClick={handleLocalSave} className="px-10 py-4 bg-stone-900 text-white rounded-full">{currentT.localSaveYes}</button>
            <button onClick={() => setStep('time_collection')} className="px-10 py-4 border border-stone-200 rounded-full">{currentT.localSaveNo}</button>
          </div>
        </div>
      )}

      {step === 'timeline' && activePerson && (
        <div className="space-y-12 animate-fade-in">
          <div className="flex justify-between items-end border-b border-stone-200 pb-8">
            <div className="space-y-2">
              <h2 className="serif text-5xl font-light">{currentT.archive}</h2>
              <div className="flex space-x-6">
                <button onClick={() => setStep('timeline')} className="text-xs uppercase tracking-widest font-bold text-stone-900 border-b-2 border-stone-900 pb-1">{currentT.archive}</button>
                <button onClick={() => setStep('wisdom')} className="text-xs uppercase tracking-widest font-bold text-stone-300 hover:text-stone-900 transition-colors pb-1">{currentT.wisdom}</button>
              </div>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setStep('search')} className="px-6 py-2 border border-stone-200 text-stone-400 rounded-full text-xs uppercase tracking-widest font-bold hover:text-stone-900 transition-colors">🔍</button>
              <button onClick={initializeNewSession} className="px-6 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-widest font-bold">+ {currentT.record}</button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <TimelineView 
              events={activePerson.timeline || []} 
              onEventClick={handleEventClick}
              labels={{ recordedAt: currentT.recordedAt, empty: currentT.emptyTimeline }} 
            />
          </div>
        </div>
      )}

      {step === 'wisdom' && activePerson && (
        <div className="space-y-12 animate-fade-in">
          <div className="flex justify-between items-end border-b border-stone-200 pb-8">
            <div className="space-y-2">
              <h2 className="serif text-5xl font-light">{currentT.wisdom}</h2>
              <div className="flex space-x-6">
                <button onClick={() => setStep('timeline')} className="text-xs uppercase tracking-widest font-bold text-stone-300 hover:text-stone-900 transition-colors pb-1">{currentT.archive}</button>
                <button onClick={() => setStep('wisdom')} className="text-xs uppercase tracking-widest font-bold text-stone-900 border-b-2 border-stone-900 pb-1">{currentT.wisdom}</button>
              </div>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setStep('search')} className="px-6 py-2 border border-stone-200 text-stone-400 rounded-full text-xs uppercase tracking-widest font-bold hover:text-stone-900 transition-colors">🔍</button>
              <button onClick={initializeNewSession} className="px-6 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-widest font-bold">+ {currentT.record}</button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(activePerson.wisdoms || []).map((w, i) => (
                <div key={w.id || i} className="wisdom-card p-10 rounded-[3rem] space-y-6 animate-fade-in flex flex-col justify-between min-h-[300px]">
                  <div className="space-y-6">
                    <div className="text-stone-200 text-4xl serif">“</div>
                    <h4 className="serif text-3xl leading-tight text-stone-800 -mt-8">{w.belief}</h4>
                    <p className="text-sm text-stone-500 leading-relaxed italic">{w.explanation}</p>
                  </div>
                  <div className="pt-6 border-t border-stone-100/50">
                    <div className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">{currentT.earnedAt}: {new Date(w.recordedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {(activePerson.wisdoms || []).length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
                  <p className="serif text-2xl text-stone-300 italic">No wisdom has been harvested yet. Share a life lesson with me?</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'search' && activePerson && (
        <div className="max-w-3xl mx-auto space-y-12 animate-fade-in">
          <div className="flex flex-col space-y-6 border-b border-stone-200 pb-8">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder={uiLang === 'zh' ? "搜索往昔..." : "Searching for... (places, names, feelings)"}
              className="w-full text-5xl serif italic bg-transparent outline-none text-stone-900 placeholder-stone-200"
              autoFocus
            />
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-300">Searching across {activePerson.sessions.length} sessions</span>
              <button onClick={() => setStep('intro')} className="text-stone-400 text-xs hover:text-stone-900 uppercase tracking-widest">{currentT.back}</button>
            </div>
          </div>

          <div className="space-y-16">
            {searchQuery && (
              <>
                {filteredData.sessions.length > 0 && (
                  <section className="space-y-8">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300">Stories & Transcripts</h3>
                    {filteredData.sessions.map(s => (
                      <div key={s.id} className="group p-8 bg-white border border-stone-50 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                        <div className="text-[10px] font-bold uppercase text-stone-300 mb-4">{s.theme} • {new Date(s.timestamp).toLocaleDateString()}</div>
                        <p className="serif text-2xl leading-relaxed text-stone-700 italic">
                          "<HighlightedText text={s.polishedTranscript || s.transcript} highlight={searchQuery} />"
                        </p>
                      </div>
                    ))}
                  </section>
                )}

                {filteredData.timeline.length > 0 && (
                  <section className="space-y-8">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300">Timeline Milestones</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredData.timeline.map(e => (
                        <div key={e.id} className="p-6 border-l-2 border-stone-100 bg-stone-50/50 rounded-r-2xl">
                          <span className="text-[9px] font-bold uppercase text-stone-300">{e.phase}</span>
                          <h4 className="serif text-xl text-stone-800"><HighlightedText text={e.event} highlight={searchQuery} /></h4>
                          <p className="text-sm text-stone-500 italic"><HighlightedText text={e.description} highlight={searchQuery} /></p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {filteredData.wisdoms.length > 0 && (
                  <section className="space-y-8">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300">Gleaning Wisdom</h3>
                    {filteredData.wisdoms.map(w => (
                      <div key={w.id} className="wisdom-card p-6 rounded-3xl">
                        <h4 className="serif text-xl"><HighlightedText text={w.belief} highlight={searchQuery} /></h4>
                      </div>
                    ))}
                  </section>
                )}

                {filteredData.sessions.length === 0 && filteredData.timeline.length === 0 && filteredData.wisdoms.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <p className="serif text-3xl text-stone-300 italic">"I don't recall that specific detail yet..."</p>
                    <button onClick={initializeNewSession} className="text-[10px] uppercase font-bold text-stone-900 border-b border-stone-900 pb-1">Tell me a new story about it?</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {(step === 'identity_select' || step === 'identity_init' || step === 'identity_type' || step === 'identity_members' || step === 'identity_setup_password' || step === 'identity_password') && (
        <div className="py-20 animate-fade-in">
          {step === 'identity_select' && (
             <div className="max-w-2xl mx-auto space-y-12 text-center">
               <h2 className="serif text-4xl font-light">{currentT.whoIsSpeaking}</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {(Object.values(store.people) as PersonProfile[]).map(p => (
                   <button key={p.id} onClick={() => handleIdentitySelect(p.id)} className="p-8 border border-stone-100 bg-white rounded-[2rem] hover:border-stone-900 transition-all text-left">
                     <div className="serif text-2xl">{p.displayName}</div>
                     <div className="text-[10px] uppercase font-bold text-stone-300 mt-1">{p.archiveType} • {p.sessions?.length || 0} {currentT.memoriesArchived}</div>
                   </button>
                 ))}
                 <button onClick={() => setStep('identity_init')} className="p-8 border border-dashed border-stone-200 text-stone-300 rounded-[2rem] hover:text-stone-900 transition-colors">
                    {currentT.newArchive}
                 </button>
               </div>
             </div>
          )}
          {step === 'identity_init' && (
            <div className="max-w-md mx-auto space-y-8 text-center">
              <h2 className="serif text-4xl font-light">{currentT.whatName}</h2>
              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-3xl serif text-center outline-none focus:border-stone-900" autoFocus />
              <div className="flex flex-col space-y-4">
                <button onClick={() => { if(nameInput) setStep('identity_type'); }} className="px-14 py-4 bg-stone-900 text-white rounded-full">{currentT.begin}</button>
                <button onClick={() => setStep('identity_select')} className="text-stone-300 uppercase tracking-widest text-[10px] font-bold hover:text-stone-900 transition-colors">{currentT.back}</button>
              </div>
            </div>
          )}

          {step === 'identity_type' && (
            <div className="max-w-2xl mx-auto space-y-12 text-center">
              <h2 className="serif text-4xl font-light">{currentT.chooseType}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => { setArchiveTypeInput(ArchiveType.INDIVIDUAL); setStep('identity_setup_password'); }} className="p-10 border border-stone-100 bg-white rounded-[3rem] hover:border-stone-900 transition-all text-left group">
                  <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100">📔</div>
                  <h3 className="serif text-2xl mb-2">{currentT.indivTitle}</h3>
                  <p className="text-stone-400 text-sm italic">{currentT.indivDesc}</p>
                </button>
                <button onClick={() => { setArchiveTypeInput(ArchiveType.FAMILY); setStep('identity_members'); }} className="p-10 border border-stone-100 bg-white rounded-[3rem] hover:border-stone-900 transition-all text-left group">
                  <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100">🏡</div>
                  <h3 className="serif text-2xl mb-2">{currentT.famTitle}</h3>
                  <p className="text-stone-400 text-sm italic">{currentT.famDesc}</p>
                </button>
              </div>
              <button onClick={() => setStep('identity_init')} className="text-stone-300 uppercase tracking-widest text-[10px] font-bold hover:text-stone-900 transition-colors mt-8">{currentT.back}</button>
            </div>
          )}

          {step === 'identity_members' && (
            <div className="max-w-md mx-auto space-y-8 text-center">
              <h2 className="serif text-4xl font-light">{currentT.addMembers}</h2>
              <div className="flex space-x-2">
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name / Nickname" className="flex-grow bg-transparent border-b border-stone-200 py-2 outline-none serif italic text-xl text-center" />
                <button onClick={() => { if(newMemberName) { setMembersInput([...membersInput, newMemberName]); setNewMemberName(''); } }} className="px-4 py-2 bg-stone-100 rounded-full text-[10px] uppercase font-bold tracking-widest">{currentT.addMemberBtn}</button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {membersInput.map((m, i) => (
                  <span key={i} className="px-4 py-1 bg-stone-900 text-white rounded-full text-xs">{m}</span>
                ))}
              </div>
              <div className="flex flex-col space-y-4 pt-8">
                <button onClick={() => setStep('identity_setup_password')} className="px-14 py-4 bg-stone-900 text-white rounded-full">{currentT.begin}</button>
                <button onClick={() => setStep('identity_type')} className="text-stone-300 uppercase tracking-widest text-[10px] font-bold hover:text-stone-900 transition-colors">{currentT.back}</button>
              </div>
            </div>
          )}

          {step === 'identity_setup_password' && (
            <div className="max-w-md mx-auto space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="serif text-4xl font-light">{currentT.whatTitle}</h2>
                <input type="text" value={archiveTitleInput} onChange={(e) => setArchiveTitleInput(e.target.value)} className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-3xl serif text-center outline-none focus:border-stone-900" placeholder="e.g. The Smith Legacy" />
              </div>

              <div className="space-y-2">
                <h2 className="serif text-2xl font-light text-stone-400">{currentT.setPassphrase}</h2>
                <p className="text-[10px] uppercase font-bold text-stone-300 tracking-widest">{currentT.passOptional}</p>
                <input type="password" value={passwordCreateInput} onChange={(e) => setPasswordCreateInput(e.target.value)} className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-3xl serif text-center outline-none focus:border-stone-900" />
              </div>

              <div className="flex flex-col space-y-4 pt-8">
                <button onClick={() => handleIdentityCreate()} className="px-14 py-4 bg-stone-900 text-white rounded-full shadow-xl">{currentT.confirmAndCreate}</button>
                <button onClick={() => setStep('identity_type')} className="text-stone-300 uppercase tracking-widest text-[10px] font-bold hover:text-stone-900 transition-colors">{currentT.back}</button>
              </div>
            </div>
          )}

          {step === 'identity_password' && (
            <div className="max-w-md mx-auto space-y-8 text-center">
              <h2 className="serif text-4xl font-light">{currentT.passwordPrompt}</h2>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-3xl serif text-center outline-none focus:border-stone-900" autoFocus />
              <button onClick={handlePasswordSubmit} className="px-14 py-4 bg-stone-900 text-white rounded-full shadow-lg">{currentT.openArchive}</button>
            </div>
          )}
        </div>
      )}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedEvent(null); setSelectedSession(null); }}>
          <div className="bg-[#fcfaf2] w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[3rem] shadow-2xl p-10 space-y-8 book-shadow" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-stone-100 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-300">{selectedEvent.phase} • {selectedEvent.timeRange}</span>
                <h3 className="serif text-3xl text-stone-900">{selectedEvent.event}</h3>
              </div>
              <button onClick={() => { setSelectedEvent(null); setSelectedSession(null); }} className="text-stone-300 hover:text-stone-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-10">
              {selectedSession ? (
                <>
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">{currentT.polishedStory}</h4>
                    <p className="serif text-2xl leading-relaxed text-stone-800 italic whitespace-pre-wrap">
                      {selectedSession.polishedTranscript || selectedSession.transcript}
                    </p>
                  </div>
                  {selectedSession.polishedTranscript && (
                    <div className="space-y-4 pt-6 border-t border-stone-100">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">{currentT.rawTranscript}</h4>
                      <p className="text-stone-500 font-light italic text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedSession.transcript}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="serif text-2xl leading-relaxed text-stone-800 italic">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="pt-8 flex justify-center">
              <button onClick={() => { setSelectedEvent(null); setSelectedSession(null); }} className="px-10 py-3 bg-stone-900 text-white rounded-full uppercase text-[10px] font-bold tracking-widest hover:bg-stone-800 transition-colors">
                {currentT.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
