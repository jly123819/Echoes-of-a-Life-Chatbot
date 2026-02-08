
import React, { useState, useEffect } from 'react';
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
  Visibility
} from './types';
import { 
  distillStory, 
  extractLifeStructure, 
  analyzeNarrativeDepth 
} from './services/geminiService';

const STORAGE_KEY = 'project_vibe_multi_identity_v1';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiDecision, setAiDecision] = useState<{decision: string, message?: string} | null>(null);
  const [distilledPreview, setDistilledPreview] = useState<string>('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [targetPersonId, setTargetPersonId] = useState<string | null>(null);
  
  const [store, setStore] = useState<LifeMemoryStore>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { 
      activePersonId: null, 
      people: {} 
    };
  });

  const activePerson: PersonProfile | null = store.activePersonId ? store.people[store.activePersonId] : null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const themes = [
    "A memory from childhood",
    "A memory about family and home",
    "A memory about an important choice",
    "A memory about a difficult time",
    "A memory about a life lesson",
    "A memory about a turning point",
    "A memory about something I miss",
    "A memory about a challenge I overcame"
  ];

  const initializeNewSession = () => {
    const id = `sess_${Date.now()}`;
    setCurrentSessionId(id);
    setStep('theme');
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

  const handlePasswordSubmit = () => {
    if (!targetPersonId) return;
    const person = store.people[targetPersonId];
    if (person.password === passwordInput) {
      setStore(prev => ({ ...prev, activePersonId: targetPersonId }));
      setStep('intro');
      setPasswordInput('');
      setTargetPersonId(null);
    } else {
      alert("Incorrect password.");
    }
  };

  const handleIdentityCreate = () => {
    if (!nameInput.trim()) return;
    const personId = `person_${Date.now()}`;
    const newPerson: PersonProfile = {
      id: personId,
      displayName: nameInput.trim(),
      password: passwordInput.trim() || undefined,
      sessions: [],
      timeline: [],
      wisdoms: []
    };
    setStore(prev => ({
      ...prev,
      activePersonId: personId,
      people: { ...prev.people, [personId]: newPerson }
    }));
    initializeNewSession();
    setNameInput('');
    setPasswordInput('');
  };

  const handleFinishListening = async (transcript: string) => {
    setCurrentTranscript(transcript);
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeNarrativeDepth(transcript, currentTheme);
      setAiDecision(result);
      if (result.decision === 'accept') {
        finalizeSession(transcript);
      } else {
        setStep('reflect');
      }
    } catch (e) {
      finalizeSession(transcript);
    } finally { setLoading(false); }
  };

  const finalizeSession = async (transcript: string) => {
    if (!store.activePersonId) return;
    setLoading(true);
    setStep('distill');
    try {
      const distilled = await distillStory(transcript, currentTheme);
      setDistilledPreview(distilled || '');
      const contextStr = activePerson?.timeline.map(e => `${e.phase}: ${e.event}`).join(', ') || '';
      const { wisdoms, events } = await extractLifeStructure(transcript, contextStr);
      
      const newSession: MemorySession = {
        id: currentSessionId,
        timestamp: Date.now(),
        theme: currentTheme,
        transcript: transcript,
        status: 'completed'
      };

      setStore(prev => {
        const pId = prev.activePersonId!;
        const person = prev.people[pId];
        return {
          ...prev,
          people: {
            ...prev.people,
            [pId]: {
              ...person,
              sessions: [...person.sessions, newSession],
              wisdoms: [...person.wisdoms, ...wisdoms.map((w: any) => ({ 
                ...w, id: `w_${Math.random()}`, evidenceSessions: [currentSessionId], visibility: Visibility.PRIVATE 
              }))],
              timeline: [...person.timeline, ...events.map((e: any) => ({ 
                ...e, id: `e_${Math.random()}`, evidenceSessions: [currentSessionId], visibility: Visibility.PRIVATE 
              }))]
            }
          }
        };
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSwitchVisibility = (type: 'wisdom' | 'event', id: string, visibility: Visibility) => {
    setStore(prev => {
      const pId = prev.activePersonId!;
      const person = prev.people[pId];
      if (type === 'wisdom') {
        return {
          ...prev,
          people: {
            ...prev.people,
            [pId]: {
              ...person,
              wisdoms: person.wisdoms.map(w => w.id === id ? { ...w, visibility } : w)
            }
          }
        };
      } else {
        return {
          ...prev,
          people: {
            ...prev.people,
            [pId]: {
              ...person,
              timeline: person.timeline.map(e => e.id === id ? { ...e, visibility } : e)
            }
          }
        };
      }
    });
  };

  const handleLogout = () => {
    setStore(prev => ({ ...prev, activePersonId: null }));
    setStep('intro');
  };

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center space-y-12 py-10 text-center animate-fade-in">
      <div className="max-w-2xl space-y-6">
        <h2 className="serif text-6xl font-extralight text-stone-900 tracking-tight leading-tight">Harvesting <br/>Life Wisdom.</h2>
        <p className="text-xl text-stone-400 font-light leading-relaxed max-w-lg mx-auto">
          A patient space for older adults to weave their memories into a tapestry for the future.
        </p>
      </div>
      
      {!activePerson ? (
        <button 
          onClick={() => setStep('identity_select')}
          className="px-12 py-5 bg-stone-900 text-stone-50 rounded-full text-lg font-medium shadow-2xl hover:scale-105 transition-all"
        >
          Begin Journey
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl pt-10">
          <button onClick={initializeNewSession} className="p-8 bg-stone-900 text-stone-50 rounded-2xl text-center shadow-2xl hover:-translate-y-1 transition-all">
            <span className="block text-xs uppercase tracking-widest opacity-50 mb-2">Preservation</span>
            <span className="text-lg font-medium">Record a New Memory</span>
          </button>
          <button onClick={() => setStep('timeline')} className="p-8 border border-stone-200 bg-white text-stone-700 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-all">
            <span className="block text-xs uppercase tracking-widest opacity-50 mb-2">Legacy</span>
            <span className="text-lg font-medium">View Memory Archive</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderIdentitySelect = () => {
    const existingPeople = Object.values(store.people);
    return (
      <div className="max-w-2xl mx-auto space-y-12 py-10 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="serif text-4xl font-light text-stone-900">Who is telling their story?</h2>
          <p className="text-stone-400 font-light">Select an existing archive or create a new one.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {existingPeople.map(person => (
            <button 
              key={person.id}
              onClick={() => handleIdentitySelect(person.id)}
              className="p-6 border border-stone-100 bg-white rounded-2xl text-left hover:border-stone-400 transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="serif text-xl font-medium text-stone-800">{person.displayName}</h3>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">{person.sessions.length} Memories Harvested</p>
              </div>
              {person.password && <div className="text-stone-200 group-hover:text-stone-400 transition-colors">🔒</div>}
            </button>
          ))}
          <button 
            onClick={() => setStep('identity_init')}
            className="p-6 border border-dashed border-stone-200 bg-stone-50/50 rounded-2xl text-center hover:bg-stone-50 transition-all"
          >
            <span className="text-stone-400 font-medium">+ Create New Archive</span>
          </button>
        </div>
      </div>
    );
  };

  const renderIdentityInit = () => (
    <div className="max-w-md mx-auto space-y-12 py-10 text-center animate-fade-in">
      <div className="space-y-4">
        <h2 className="serif text-4xl font-light text-stone-900">Identify Yourself</h2>
        <p className="text-stone-400 font-light">A name to anchor your legacy, and an optional password to protect it.</p>
      </div>
      <div className="space-y-6">
        <input 
          type="text" 
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="What name shall I remember?"
          className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-2xl serif text-center outline-none focus:border-stone-400 transition-all"
          autoFocus
        />
        <input 
          type="password" 
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Passphrase (optional)"
          className="w-full bg-transparent border-b-2 border-stone-100 py-4 text-sm text-center outline-none focus:border-stone-400 transition-all"
        />
        <div className="pt-4 flex flex-col space-y-3">
          <button 
            onClick={handleIdentityCreate}
            disabled={!nameInput.trim()}
            className="px-12 py-4 bg-stone-900 text-white rounded-full font-medium shadow-lg disabled:bg-stone-100 transition-all"
          >
            Create My Archive
          </button>
          <button onClick={() => setStep('identity_select')} className="text-stone-400 text-xs hover:text-stone-600 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderPasswordPrompt = () => (
    <div className="max-w-md mx-auto py-20 text-center animate-fade-in space-y-8">
      <div className="space-y-4">
        <h2 className="serif text-3xl font-light">Memory Access Protected</h2>
        <p className="text-stone-400">Please enter the passphrase for {targetPersonId && store.people[targetPersonId].displayName}.</p>
      </div>
      <div className="space-y-6">
        <input 
          type="password" 
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent border-b-2 border-stone-200 py-4 text-3xl text-center outline-none focus:border-stone-900 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          autoFocus
        />
        <div className="flex justify-center space-x-4">
          <button onClick={handlePasswordSubmit} className="px-10 py-3 bg-stone-900 text-white rounded-full">Enter</button>
          <button onClick={() => setStep('identity_select')} className="px-10 py-3 text-stone-400">Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout 
      onHomeClick={() => setStep('intro')}
      subtitle={activePerson ? (
        <div className="flex items-center space-x-4">
          <span className="font-light italic text-stone-400">Harvesting for: {activePerson.displayName}</span>
          <button onClick={handleLogout} className="text-[10px] uppercase font-bold tracking-widest text-stone-300 hover:text-stone-900 transition-colors border-l border-stone-200 pl-4">Switch Person 🔁</button>
        </div>
      ) : undefined}
    >
      {step === 'intro' && renderIntro()}
      {step === 'identity_select' && renderIdentitySelect()}
      {step === 'identity_init' && renderIdentityInit()}
      {step === 'identity_password' && renderPasswordPrompt()}
      {step === 'theme' && (
        <div className="space-y-12 animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="serif text-4xl font-light text-stone-900">What do you remember today?</h2>
            <p className="text-stone-400 text-sm tracking-widest uppercase">Select a prompt to focus your narrative</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {themes.map((t) => (
              <button key={t} onClick={() => { setCurrentTheme(t); setStep('listen'); }}
                className={`px-8 py-3 rounded-full border text-sm transition-all duration-300 ${
                  currentTheme === t ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 'listen' && <ListeningModule theme={currentTheme} onFinish={handleFinishListening} />}
      {step === 'reflect' && (
        <div className="max-w-2xl mx-auto py-20 space-y-12 text-center animate-fade-in">
          <div className="space-y-8">
            <h2 className="serif text-4xl font-light text-stone-900">A Gentle Reflection</h2>
            <div className="p-10 bg-white border border-stone-100 rounded-3xl shadow-sm italic serif text-3xl text-stone-800 leading-snug">
              "{aiDecision?.message}"
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <button onClick={() => setStep('listen')} className="px-12 py-4 bg-stone-900 text-white rounded-full font-medium shadow-xl hover:-translate-y-1 transition-all">Expand My Story</button>
            <button onClick={() => finalizeSession(currentTranscript)} className="px-12 py-4 border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50">No, That is All</button>
          </div>
        </div>
      )}
      {step === 'distill' && (
        <div className="max-w-3xl mx-auto py-10 animate-fade-in space-y-16">
          {loading ? (
            <div className="text-center space-y-8 py-20">
              <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto" />
              <p className="serif text-2xl font-light italic text-stone-500">Distilling the narrative...</p>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <div className="flex items-center space-x-4 opacity-30">
                  <div className="h-px bg-stone-900 flex-grow" />
                  <span className="text-xs uppercase font-bold tracking-[0.4em]">Memory Harvested</span>
                  <div className="h-px bg-stone-900 flex-grow" />
                </div>
                <div className="prose prose-stone max-w-none">
                  <p className="serif text-4xl font-extralight text-stone-800 leading-[1.3] whitespace-pre-wrap">{distilledPreview}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <button onClick={() => setStep('timeline')} className="px-12 py-5 bg-stone-900 text-white rounded-full font-medium shadow-2xl hover:bg-stone-800 transition-all hover:scale-105">Update Archive</button>
              </div>
            </>
          )}
        </div>
      )}
      {step === 'timeline' && activePerson && (
        <div className="animate-fade-in space-y-12">
           <div className="flex justify-between items-end border-b border-stone-100 pb-8">
            <h2 className="serif text-5xl font-light">{activePerson.displayName}'s Life Path</h2>
            <button onClick={initializeNewSession} className="text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
              + Harvest Memory
            </button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2">
                <TimelineView events={activePerson.timeline} />
              </div>
              <div className="space-y-12">
                <section className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-300 border-b border-stone-50 pb-2">Distilled Wisdom</h3>
                  {activePerson.wisdoms.map((w, i) => (
                    <div key={i} className="wisdom-card p-8 rounded-[2rem] space-y-4 group">
                       <div className="flex justify-between items-start">
                         <h4 className="serif text-2xl leading-tight text-stone-800">“{w.belief}”</h4>
                         <select 
                           value={w.visibility} 
                           onChange={(e) => handleSwitchVisibility('wisdom', w.id, e.target.value as Visibility)}
                           className="text-[10px] bg-transparent text-stone-400 border-none outline-none focus:ring-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           {Object.values(Visibility).map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                       </div>
                       <p className="text-sm text-stone-500 font-light leading-relaxed">{w.explanation}</p>
                       <div className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">{w.visibility}</div>
                    </div>
                  ))}
                </section>
              </div>
           </div>
           <div className="flex justify-center pt-20">
              <button onClick={() => setStep('legacy')} className="px-12 py-4 bg-stone-50 text-stone-400 rounded-full font-medium hover:bg-stone-100">View Future Legacy</button>
           </div>
        </div>
      )}
      {step === 'legacy' && activePerson && (
        <div className="max-w-3xl mx-auto py-10 pb-40 space-y-24 animate-fade-in">
           <div className="text-center space-y-4">
             <h2 className="serif text-6xl font-extralight tracking-tight">The Legacy of {activePerson.displayName}</h2>
             <p className="text-stone-300 italic uppercase text-xs tracking-[0.5em]">Selected memories for future generations</p>
           </div>
           <div className="space-y-32">
              <section className="space-y-20">
                {activePerson.wisdoms.filter(w => w.visibility !== Visibility.PRIVATE).map((w, i) => (
                  <div key={i} className="text-center space-y-8 max-w-xl mx-auto">
                    <p className="serif text-4xl font-light text-stone-800 leading-tight px-4 italic">“{w.belief}”</p>
                    <p className="text-stone-400 font-light leading-relaxed max-w-sm mx-auto">{w.explanation}</p>
                  </div>
                ))}
              </section>
              <section className="space-y-16">
                 {activePerson.timeline.filter(e => e.visibility !== Visibility.PRIVATE).map((event, i) => (
                   <div key={i} className="flex flex-col md:flex-row gap-12 items-start group">
                      <div className="md:w-32 flex-shrink-0 text-stone-200 text-xs font-bold uppercase tracking-[0.3em] pt-2">{event.phase}</div>
                      <div className="space-y-4">
                        <h4 className="serif text-3xl font-light text-stone-900">{event.event}</h4>
                        <p className="text-stone-500 font-light leading-relaxed text-xl">{event.description}</p>
                      </div>
                   </div>
                 ))}
              </section>
           </div>
           <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
              <button onClick={() => setStep('intro')} className="px-14 py-4 bg-stone-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all">Return to Archive</button>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
