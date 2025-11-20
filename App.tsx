import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, Settings, Pause, Box, Mail, CreditCard, Search, Video, Globe, Accessibility, Bot, Sparkles } from 'lucide-react';
import { useGeminiLive } from './hooks/useGeminiLive';
import AudioVisualizer from './components/AudioVisualizer';
import TranscriptView from './components/TranscriptView';
import { ConnectionState, VOICE_NAMES, VoiceName, ActionType, Language } from './types';

// --- MULTILINGUAL CONTENT CONFIGURATION ---

const BASE_INSTRUCTION = `You are the Swiss Post assistant (PostAssistant). You are helpful, polite, and efficient.
Your primary goal is to help users navigate the self-service portal.

You have access to a tool called "trigger_action" that can control the buttons on the user's screen.
If the user wants to send a parcel, track a letter, make a payment, or start a video consultation, USE the tool to click the button for them.

Mapping:
- "Send package/parcel" -> trigger_action(action_id="parcel_send")
- "Send letter" -> trigger_action(action_id="letter_send")
- "Pay bill", "Payment" -> trigger_action(action_id="payment")
- "Track package", "Where is my stuff" -> trigger_action(action_id="parcel_track")
- "Talk to human", "Video call" -> trigger_action(action_id="video_consultation")
`;

const TRANSLATIONS = {
  de: {
    heroTitle: "Willkommen bei der Post",
    heroSubtitle: "Erledigen Sie Ihre Postgeschäfte einfach und schnell. Wie können wir Sie heute unterstützen?",
    cardSelfServiceTitle: "Self-Service Assistent",
    cardSelfServiceDesc: "Erledigen Sie Ihre Postgeschäfte direkt hier im Self-Service, bei Bedarf mit Unterstützung eines digitalen Assistenten.",
    cardVideoTitle: "Video-Beratung",
    cardVideoDesc: "Persönliche Beratung per Video-Call mit unseren Expertinnen und Experten.",
    actions: {
      parcel_send: "Paket aufgeben",
      letter_send: "Brief versenden",
      payment: "Einzahlung (mit Karte)",
      parcel_track: "Paket verfolgen",
      video_consultation: "Beratung starten",
    },
    footerLang: "Sprache / Language",
    footerAccess: "Barrierefreiheit",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak German (Deutsch). Always confirm actions in German, e.g. "Gerne, ich öffne die Sendungsverfolgung für Sie."`,
  },
  fr: {
    heroTitle: "Bienvenue à la Poste",
    heroSubtitle: "Gérez vos affaires postales simplement et rapidement. Comment pouvons-nous vous aider aujourd'hui ?",
    cardSelfServiceTitle: "Assistant Self-Service",
    cardSelfServiceDesc: "Gérez vos affaires postales ici même en libre-service, avec l'aide d'un assistant numérique si nécessaire.",
    cardVideoTitle: "Conseil Vidéo",
    cardVideoDesc: "Conseil personnel par appel vidéo avec nos expertes et experts.",
    actions: {
      parcel_send: "Envoyer un colis",
      letter_send: "Envoyer une lettre",
      payment: "Paiement (par carte)",
      parcel_track: "Suivre un envoi",
      video_consultation: "Démarrer le conseil",
    },
    footerLang: "Langue / Language",
    footerAccess: "Accessibilité",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak French (Français). Always confirm actions in French, e.g. "Volontiers, j'ouvre le suivi des envois pour vous."`,
  },
  it: {
    heroTitle: "Benvenuti alla Posta",
    heroSubtitle: "Sbrigate le vostre operazioni postali in modo semplice e veloce. Come possiamo aiutarvi oggi?",
    cardSelfServiceTitle: "Assistente Self-Service",
    cardSelfServiceDesc: "Sbrigate le vostre operazioni postali direttamente qui in self-service, se necessario con il supporto di un assistente digitale.",
    cardVideoTitle: "Consulenza Video",
    cardVideoDesc: "Consulenza personale tramite videochiamata con i nostri esperti.",
    actions: {
      parcel_send: "Spedire un pacco",
      letter_send: "Spedire una lettera",
      payment: "Pagamento (con carta)",
      parcel_track: "Tracciare un pacco",
      video_consultation: "Avviare consulenza",
    },
    footerLang: "Lingua / Language",
    footerAccess: "Accessibilità",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak Italian (Italiano). Always confirm actions in Italian, e.g. "Volentieri, apro il tracciamento per lei."`,
  },
  en: {
    heroTitle: "Welcome to Swiss Post",
    heroSubtitle: "Handle your postal business simply and quickly. How can we support you today?",
    cardSelfServiceTitle: "Self-Service Assistant",
    cardSelfServiceDesc: "Handle your postal business directly here in self-service, with the support of a digital assistant if needed.",
    cardVideoTitle: "Video Consultation",
    cardVideoDesc: "Personal consultation via video call with our experts.",
    actions: {
      parcel_send: "Send a parcel",
      letter_send: "Send a letter",
      payment: "Payment (Card)",
      parcel_track: "Track parcel",
      video_consultation: "Start consultation",
    },
    footerLang: "Language",
    footerAccess: "Accessibility",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak English. Always confirm actions in English, e.g. "Certainly, I will open the tracking for you."`,
  },
  es: {
    heroTitle: "Bienvenido a Swiss Post",
    heroSubtitle: "Realice sus gestiones postales de forma sencilla y rápida. ¿Cómo podemos ayudarle hoy?",
    cardSelfServiceTitle: "Asistente de Autoservicio",
    cardSelfServiceDesc: "Realice sus gestiones postales directamente aquí en autoservicio, con la ayuda de un asistente digital si es necesario.",
    cardVideoTitle: "Video Asesoramiento",
    cardVideoDesc: "Asesoramiento personal por videollamada con nuestros expertos.",
    actions: {
      parcel_send: "Enviar paquete",
      letter_send: "Enviar carta",
      payment: "Pago (con tarjeta)",
      parcel_track: "Rastrear paquete",
      video_consultation: "Iniciar asesoramiento",
    },
    footerLang: "Idioma / Language",
    footerAccess: "Accesibilidad",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak Spanish (Español). Always confirm actions in Spanish.`,
  },
  pt: {
    heroTitle: "Bem-vindo aos Correios",
    heroSubtitle: "Trate dos seus assuntos postais de forma simples e rápida. Como podemos ajudá-lo hoje?",
    cardSelfServiceTitle: "Assistente de Autoatendimento",
    cardSelfServiceDesc: "Trate dos seus assuntos postais diretamente aqui no autoatendimento, com o apoio de um assistente digital, se necessário.",
    cardVideoTitle: "Consultoria por Vídeo",
    cardVideoDesc: "Consultoria pessoal via videochamada com os nossos especialistas.",
    actions: {
      parcel_send: "Enviar encomenda",
      letter_send: "Enviar carta",
      payment: "Pagamento (com cartão)",
      parcel_track: "Rastrear encomenda",
      video_consultation: "Iniciar consultoria",
    },
    footerLang: "Língua / Language",
    footerAccess: "Acessibilidade",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak Portuguese (Português). Always confirm actions in Portuguese.`,
  },
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  // State for UI and Language
  const [language, setLanguage] = useState<Language>('de');
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [highlightedAction, setHighlightedAction] = useState<ActionType | null>(null);
  
  const t = TRANSLATIONS[language];

  // Callback when Gemini triggers an action
  const handleActionTriggered = useCallback((actionId: ActionType) => {
    console.log("UI Action Triggered:", actionId);
    setHighlightedAction(actionId);
    
    // Reset highlight after 2 seconds
    setTimeout(() => {
        setHighlightedAction(null);
    }, 2000);
    
    setActiveAction(actionId);
  }, []);

  const { 
    connect, 
    disconnect, 
    connectionState, 
    transcripts, 
    volume, 
    error 
  } = useGeminiLive({ onActionTriggered: handleActionTriggered });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState(0);

  const isConnected = connectionState === ConnectionState.CONNECTED;

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Reconnect if language changes while active
  useEffect(() => {
    if (isConnected) {
        // If we are already talking, we need to reconnect to update the system instruction
        // so the bot switches language seamlessly.
        const timeout = setTimeout(() => {
             connect(selectedVoice, TRANSLATIONS[language].systemInstruction);
        }, 500); // Small delay to avoid rapid flickering
        return () => clearTimeout(timeout);
    }
  }, [language]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      disconnect();
    } else {
      setIsOpen(true);
      connect(selectedVoice, t.systemInstruction);
    }
  };

  const handleDisconnect = () => {
      disconnect();
      setIsOpen(false);
  };

  // UI Components for the Landing Page
  const ActionButton = ({ 
      id, 
      icon: Icon, 
      label 
  }: { id: ActionType, icon: any, label: string }) => {
      const isHighlighted = highlightedAction === id;
      
      return (
          <button 
            onClick={() => handleActionTriggered(id)}
            className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all duration-300 group
                ${isHighlighted 
                    ? 'bg-[#FFCC00] text-zinc-900 scale-[1.02] shadow-lg ring-2 ring-offset-2 ring-[#FFCC00]' 
                    : 'bg-[#1D2533] text-white hover:bg-[#2E394C]'
                }`}
          >
              <div className={`${isHighlighted ? 'text-zinc-900' : 'text-white group-hover:scale-110 transition-transform'}`}>
                  <Icon size={24} strokeWidth={1.5} />
              </div>
              <span className="font-medium text-sm sm:text-base">{label}</span>
          </button>
      );
  };

  const LanguageButton = ({ lang, label }: { lang: Language, label: string }) => (
    <button 
        onClick={() => setLanguage(lang)}
        className={`px-4 py-1.5 rounded-full shadow-sm transition-all duration-200 font-medium ${
            language === lang 
            ? 'bg-[#1D2533] text-white' 
            : 'hover:text-zinc-900 text-zinc-500 hover:bg-zinc-200'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900 relative overflow-x-hidden">
       
       {/* --- HEADER --- */}
       <header className="w-full py-8 px-8 sm:px-16 flex items-center justify-start">
           <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#FFCC00] flex items-center justify-center font-bold text-xl tracking-tight">
                   +P
               </div>
               <span className="text-xl font-bold tracking-tight">PostAssistant</span>
           </div>
       </header>

       {/* --- MAIN CONTENT --- */}
       <main className="flex-1 flex flex-col items-center pt-12 px-4 sm:px-8 w-full max-w-[90rem] mx-auto">
           
           {/* Hero Text */}
           <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="relative inline-block">
                   <div className="absolute -inset-1 bg-[#FFCC00]/20 blur-3xl rounded-full pointer-events-none"></div>
                   <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold text-[#1D2533] mb-6 tracking-tight">
                       {t.heroTitle}
                   </h1>
               </div>
               <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                   {t.heroSubtitle}
               </p>
           </div>

           {/* Cards Grid + AI Sidebar */}
           <div className="w-full max-w-7xl mb-20 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-8 items-stretch">
               
               {/* Card 1: Self Service */}
               <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col hover:shadow-xl transition-shadow duration-300 h-full">
                   <div className="w-12 h-12 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#FFCC00] mb-6">
                       <Box size={28} strokeWidth={1.5} />
                   </div>
                   <h2 className="text-2xl font-bold text-[#1D2533] mb-3">{t.cardSelfServiceTitle}</h2>
                   <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                       {t.cardSelfServiceDesc}
                   </p>
                   
                   <div className="flex flex-col gap-3 mt-auto">
                       <ActionButton id="parcel_send" icon={Box} label={t.actions.parcel_send} />
                       <ActionButton id="letter_send" icon={Mail} label={t.actions.letter_send} />
                       <ActionButton id="payment" icon={CreditCard} label={t.actions.payment} />
                       <ActionButton id="parcel_track" icon={Search} label={t.actions.parcel_track} />
                   </div>
               </div>

               {/* Card 2: Video Beratung */}
               <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col hover:shadow-xl transition-shadow duration-300 h-full">
                   <div className="w-12 h-12 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#FFCC00] mb-6">
                       <Video size={28} strokeWidth={1.5} />
                   </div>
                   <h2 className="text-2xl font-bold text-[#1D2533] mb-3">{t.cardVideoTitle}</h2>
                   <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                       {t.cardVideoDesc}
                   </p>
                   
                   <div className="mt-auto">
                       <ActionButton id="video_consultation" icon={Video} label={t.actions.video_consultation} />
                   </div>
               </div>

               {/* AI Sidebar Pill - Compact & Centered */}
               <div className="flex flex-col items-center justify-center h-full lg:w-32 animate-in slide-in-from-right-8 fade-in duration-700 delay-200">
                   <div className="w-24 h-64 bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
                       
                       {/* Trigger Button */}
                       <button 
                          onClick={handleToggle}
                          className="group relative w-16 h-16"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300 blur opacity-40"></div>
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
                                {isOpen ? (
                                     <AudioVisualizer isActive={isConnected} volume={volume} />
                                ) : (
                                     <Bot size={32} className="fill-white/20" />
                                )}
                           </div>
                           {/* Sparkle Accent */}
                           <div className="absolute -top-2 -right-2 bg-white text-[#FFCC00] p-1.5 rounded-full shadow-md animate-bounce">
                                <Sparkles size={12} fill="currentColor" />
                           </div>
                       </button>

                   </div>
               </div>

           </div>

       </main>

       {/* --- FOOTER --- */}
       <footer className="w-full py-8 px-8 border-t border-zinc-100 bg-white flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-zinc-400 tracking-wider uppercase">
           <div className="flex items-center gap-2 mb-4 sm:mb-0">
               <Globe size={16} />
               <span>{t.footerLang}</span>
           </div>
           
           <div className="flex items-center flex-wrap justify-center gap-1 bg-zinc-50 rounded-full p-1 border border-zinc-100 mb-4 sm:mb-0">
               <LanguageButton lang="de" label="Deutsch" />
               <LanguageButton lang="fr" label="Français" />
               <LanguageButton lang="it" label="Italiano" />
               <LanguageButton lang="en" label="English" />
               <LanguageButton lang="es" label="Español" />
               <LanguageButton lang="pt" label="Português" />
           </div>

           <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
               <Accessibility size={16} />
               <span>{t.footerAccess}</span>
           </button>
       </footer>


       {/* -------------------------------------------------------------------------- */}
       {/* VOICE WIDGET OVERLAY */}
       {/* -------------------------------------------------------------------------- */}
       
       {/* Only show the floating widget overlay if open. The trigger is now on-page. */}
       {isOpen && (
         <div className="fixed bottom-0 right-0 p-6 flex flex-col items-end z-50">
            <div className="w-[400px] h-[600px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col justify-end relative mb-4 animate-in slide-in-from-bottom-8 fade-in-0 duration-300">
                
                {/* Close Button (Floating top-right of area) */}
                <div className="absolute top-0 right-0 z-20">
                    <button 
                        onClick={handleDisconnect}
                        className="bg-white/80 backdrop-blur text-zinc-500 hover:text-red-600 hover:bg-white p-2 rounded-full shadow-sm border border-zinc-100 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Settings Toggle (Floating top-left) */}
                <div className="absolute top-0 left-0 z-20">
                    <div className="relative">
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-white/80 backdrop-blur text-zinc-500 hover:text-zinc-900 hover:bg-white p-2 rounded-full shadow-sm border border-zinc-100 transition-all"
                        >
                            <Settings size={18} />
                        </button>
                        
                        {/* Settings Popover */}
                        {showSettings && (
                            <div className="absolute top-10 left-0 bg-white rounded-xl shadow-xl border border-zinc-100 p-3 w-48 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Voice Selection</div>
                                <div className="space-y-1">
                                    {VOICE_NAMES.map(voice => (
                                        <button
                                            key={voice}
                                            onClick={() => {
                                                setSelectedVoice(voice);
                                                if (isConnected) connect(voice, t.systemInstruction);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedVoice === voice 
                                                ? 'bg-[#FFCC00] text-black font-medium' 
                                                : 'hover:bg-zinc-50 text-zinc-600'
                                            }`}
                                        >
                                            {voice}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Transcripts Floating Area */}
                <div className="flex-1 min-h-0 flex flex-col justify-end mb-4 relative z-10">
                    {/* Error Banner */}
                    {error && (
                        <div className="mx-4 mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm shadow-sm">
                            {error}
                        </div>
                    )}
                    <TranscriptView transcripts={transcripts} status={connectionState} />
                </div>

                {/* Voice Cloud Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 ring-1 ring-black/5 p-6 relative overflow-hidden z-20">
                    {/* Card Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FFCC00]/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col gap-6 relative">
                        
                        {/* Visualizer Area */}
                        <div className="h-16 flex items-center justify-center">
                            {isConnected ? (
                                <AudioVisualizer isActive={true} volume={volume} />
                            ) : (
                                <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                                    <span className="text-sm font-medium">Initializing...</span>
                                </div>
                            )}
                        </div>

                        {/* Controls Footer */}
                        <div className="flex items-center justify-between px-2">
                            {/* Status */}
                            <div className="flex items-center gap-2 w-24">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#FFCC00] animate-pulse' : 'bg-zinc-300'}`}></span>
                                <span className="text-xs font-medium text-zinc-500">
                                    {isConnected ? 'Agent online' : 'Connecting'}
                                </span>
                            </div>

                            {/* Stop Button */}
                            <button 
                                onClick={handleDisconnect}
                                className="w-12 h-12 flex items-center justify-center bg-[#0056D2] hover:bg-[#0044A5] text-white rounded-full shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
                                title="End Conversation"
                            >
                                <Pause size={20} fill="currentColor" />
                            </button>

                            {/* Timer */}
                            <div className="w-24 text-right">
                                <span className="text-xs font-mono font-medium text-zinc-400">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default App;