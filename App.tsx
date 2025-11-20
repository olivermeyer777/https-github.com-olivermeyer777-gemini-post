
import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, Settings, Pause, Box, Mail, CreditCard, Search, Video, Globe, Accessibility, Bot, Sparkles, ChevronRight, Check, AlertCircle, ChevronLeft, Weight, Ruler, ArrowUpFromLine, ArrowRightFromLine, Scale, Home, User, Truck, PenTool } from 'lucide-react';
import { useGeminiLive } from './hooks/useGeminiLive';
import AudioVisualizer from './components/AudioVisualizer';
import TranscriptView from './components/TranscriptView';
import { ConnectionState, VOICE_NAMES, VoiceName, ActionType, Language } from './types';

// --- MULTILINGUAL CONTENT CONFIGURATION ---

const BASE_INSTRUCTION = `You are the Swiss Post assistant (PostAssistant). You are helpful, polite, and efficient.
Your primary goal is to help users navigate the self-service portal.

You have access to a tool called "trigger_action" that can control the buttons on the user's screen.
Always Use the tool when the user indicates intent.

Context:
- Dashboard: User can choose send parcel, letter, payment, track, or video call.
- Parcel Flow Step 1 (Dest): Switzerland or Abroad.
- Parcel Flow Step 2 (Weight): The scale automatically weighs the item (7kg 796g). You should ask if the address is already attached.
- Parcel Flow Step 3 (Address): If no address, user must enter it. You can fill this for them if they dictate it (simulate by clicking Next).
- Parcel Flow Step 4 (Options): Explain Economy (2 days) vs Priority (Next day). Handle Signature extras.
- Parcel Flow Step 5 (Payment): User must pay at the terminal.
- Parcel Flow Step 6 (Finish): Instruct to stick label and drop package. Ask for feedback (0-10).

Action Mapping:
- "Select Switzerland" -> trigger_action(action_id="select_destination_ch")
- "Address is there" / "Yes" -> trigger_action(action_id="address_exists_yes")
- "No address" / "No" -> trigger_action(action_id="address_exists_no")
- "Economy" / "Slow" -> trigger_action(action_id="select_economy")
- "Priority" / "Fast" -> trigger_action(action_id="select_priority")
- "Signature" / "Sign" -> trigger_action(action_id="toggle_signature")
- "Confirm" / "Next" -> trigger_action(action_id="confirm_details")
- "Pay" -> trigger_action(action_id="confirm_payment")
- "Finish" / "Close" -> trigger_action(action_id="finish_process")
`;

const EN_TRANSLATIONS = {
    heroTitle: "Welcome to Swiss Post",
    heroSubtitle: "Handle your postal business simply and quickly.",
    cardSelfServiceTitle: "Self-Service Assistant",
    cardSelfServiceDesc: "Handle your postal business directly here in self-service.",
    cardVideoTitle: "Video Consultation",
    cardVideoDesc: "Personal consultation via video call.",
    actions: {
      parcel_send: "Send a parcel",
      letter_send: "Send a letter",
      payment: "Payment (Card)",
      parcel_track: "Track parcel",
      video_consultation: "Start consultation",
    },
    footerLang: "Language",
    footerAccess: "Accessibility",
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak English.`,
    process: {
      back: "Back",
      step1Title: "Frank parcel",
      step1Prompt: "Place your parcel on the scale to start.",
      destCH: "Switzerland / Liechtenstein",
      destAbroad: "Abroad",
      errorAbroad: "Shipping abroad is not possible here. Please contact the counter.",
      
      step2Title: "Enter parcel details",
      weightDetected: "Weight and dimensions detected",
      labelWeight: "Weight",
      labelLength: "Length",
      labelWidth: "Width",
      labelHeight: "Height",
      questionAddress: "Is a recipient address already attached to your shipment?",
      btnYes: "YES",
      subYes: "Address is present",
      btnNo: "NO",
      subNo: "Enter address",

      step3Title: "Enter recipient",
      typePrivate: "Private person",
      typeCompany: "Company",
      plHName: "Name, First name",
      plHZip: "Zip",
      plHCity: "City",
      plHStreet: "Street",
      plHNr: "Number",
      plHAdd: "Address supplement (optional)",
      btnCancel: "Cancel",
      btnNext: "Next",

      step4Title: "Enter parcel details",
      headerRecipient: "Recipient",
      headerService: "Select shipping method",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "Delivered in 2 working days (Mon-Fri)",
      servicePrioSub: "Delivered the next working day (Mon-Fri)",
      headerExtras: "Add additional service",
      extraSig: "Signature",
      agb: "Please take note of the GTC.",
      total: "Total",
      btnConfirm: "Confirm and pay",

      step5Title: "Pay for shipment",
      checkoutTitle: "Checkout",
      payPrompt: "Please use the card terminal for payment.",
      payNote: "Cash and TWINT payment not possible",
      btnPay: "Confirm payment",

      step6Title: "Almost done",
      instrTitle: "Please follow the final instructions.",
      instr1: "1. Take label from printer.",
      instr2: "2. Stick on parcel.",
      instr2Sub: "Ensure the label is clearly visible.",
      instr3: "3. Drop off at parcel drop.",
      feedbackTitle: "How satisfied are you with your experience?",
      feedbackSub: "One second for your feedback – thank you!",
      minSat: "Not satisfied",
      maxSat: "Very satisfied",
      thankYou: "Thanks for your visit!",
      btnFinish: "Finish"
    }
};

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
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak German (Deutsch).`,
    process: {
      back: "Zurück",
      step1Title: "Paket frankieren",
      step1Prompt: "Legen Sie Ihr Paket auf die Waage um zu starten.",
      destCH: "Schweiz / Liechtenstein",
      destAbroad: "Ausland",
      errorAbroad: "Versenden ins Ausland ist hier nicht möglich. Bitte wenden Sie sich an den Schalter.",
      
      step2Title: "Paketdetails erfassen",
      weightDetected: "Gewicht und Masse Ihres Pakets erkannt",
      labelWeight: "Gewicht",
      labelLength: "Länge",
      labelWidth: "Breite",
      labelHeight: "Höhe",
      questionAddress: "Ist auf Ihrer Sendung bereits eine Empfängeradresse angebracht?",
      btnYes: "JA",
      subYes: "Adresse ist vorhanden",
      btnNo: "NEIN",
      subNo: "Adresse erfassen",

      step3Title: "Empfänger erfassen",
      typePrivate: "Privatperson",
      typeCompany: "Firma",
      plHName: "Name, Vorname",
      plHZip: "PLZ",
      plHCity: "Ort",
      plHStreet: "Strasse",
      plHNr: "Hausnummer",
      plHAdd: "Adresszusatz (optional)",
      btnCancel: "Abbrechen",
      btnNext: "Weiter",

      step4Title: "Paketdetails erfassen",
      headerRecipient: "Empfänger",
      headerService: "Versandart auswählen",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "Zugestellt in 2 Werktagen (Mo–Fr)",
      servicePrioSub: "Zugestellt am nächsten Werktag (Mo–Fr)",
      headerExtras: "Zusatzleistung hinzufügen",
      extraSig: "Signatur",
      agb: "Bitte nehmen Sie die AGB zur Kenntnis.",
      total: "Gesamt",
      btnConfirm: "Bestätigen und bezahlen",

      step5Title: "Sendung bezahlen",
      checkoutTitle: "Kasse",
      payPrompt: "Bitte nutzen Sie zur Zahlung das Kartenterminal.",
      payNote: "Zahlung mit Bargeld und TWINT nicht möglich",
      btnPay: "Zahlung bestätigen",
      
      step6Title: "Fast geschafft",
      instrTitle: "Bitte folgen Sie den letzten Anweisungen.",
      instr1: "1. Etikette aus dem Drucker nehmen.",
      instr2: "2. Aufs Paket kleben.",
      instr2Sub: "Beachten Sie, dass die Etikette gut sichtbar ist.",
      instr3: "3. Beim Paketeinwurf aufgeben.",
      feedbackTitle: "Wie zufrieden sind Sie mit Ihrer Erfahrung?",
      feedbackSub: "Eine Sekunde für Ihr Feedback – vielen Dank!",
      minSat: "Gar nicht zufrieden",
      maxSat: "Sehr zufrieden",
      thankYou: "Danke für Ihren Besuch!",
      btnFinish: "Abschliessen"
    }
  },
  fr: {
    heroTitle: "Bienvenue à la Poste",
    heroSubtitle: "Gérez vos affaires postales simplement et rapidement.",
    cardSelfServiceTitle: "Assistant Self-Service",
    cardSelfServiceDesc: "Gérez vos affaires postales ici même en libre-service.",
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
    systemInstruction: `${BASE_INSTRUCTION} \n IMPORTANT: Speak French (Français).`,
    process: {
      back: "Retour",
      step1Title: "Affranchir un colis",
      step1Prompt: "Placez votre colis sur la balance pour commencer.",
      destCH: "Suisse / Liechtenstein",
      destAbroad: "Étranger",
      errorAbroad: "L'expédition vers l'étranger n'est pas possible ici. Veuillez vous adresser au guichet.",
      
      step2Title: "Saisir les détails du colis",
      weightDetected: "Poids et dimensions détectés",
      labelWeight: "Poids",
      labelLength: "Longueur",
      labelWidth: "Largeur",
      labelHeight: "Hauteur",
      questionAddress: "Une adresse de destinataire est-elle déjà apposée sur votre envoi ?",
      btnYes: "OUI",
      subYes: "L'adresse est présente",
      btnNo: "NON",
      subNo: "Saisir l'adresse",

      step3Title: "Saisir le destinataire",
      typePrivate: "Particulier",
      typeCompany: "Entreprise",
      plHName: "Nom, Prénom",
      plHZip: "NPA",
      plHCity: "Lieu",
      plHStreet: "Rue",
      plHNr: "Numéro",
      plHAdd: "Complément d'adresse (optionnel)",
      btnCancel: "Annuler",
      btnNext: "Suivant",

      step4Title: "Saisir les détails du colis",
      headerRecipient: "Destinataire",
      headerService: "Choisir le mode d'expédition",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "Distribué en 2 jours ouvrables (lu-ve)",
      servicePrioSub: "Distribué le jour ouvrable suivant (lu-ve)",
      headerExtras: "Ajouter une prestation complémentaire",
      extraSig: "Signature",
      agb: "Veuillez prendre connaissance des CG.",
      total: "Total",
      btnConfirm: "Confirmer et payer",

      step5Title: "Payer l'envoi",
      checkoutTitle: "Caisse",
      payPrompt: "Veuillez utiliser le terminal de carte pour le paiement.",
      payNote: "Paiement en espèces et TWINT non possible",
      btnPay: "Confirmer le paiement",

      step6Title: "Presque terminé",
      instrTitle: "Veuillez suivre les dernières instructions.",
      instr1: "1. Prendre l'étiquette de l'imprimante.",
      instr2: "2. Coller sur le colis.",
      instr2Sub: "Veillez à ce que l'étiquette soit bien visible.",
      instr3: "3. Déposer au dépôt de colis.",
      feedbackTitle: "Êtes-vous satisfait de votre expérience ?",
      feedbackSub: "Une seconde pour votre avis – merci beaucoup !",
      minSat: "Pas du tout satisfait",
      maxSat: "Très satisfait",
      thankYou: "Merci de votre visite !",
      btnFinish: "Terminer"
    }
  },
  en: EN_TRANSLATIONS,
  it: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Benvenuti", 
      heroSubtitle: "...", 
      cardSelfServiceTitle: "Self-Service", 
      cardVideoTitle: "Video", 
      footerLang: "Lingua", 
      footerAccess: "Accessibilità"
  },
  es: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Bienvenido", 
      heroSubtitle: "...", 
      cardSelfServiceTitle: "Autoservicio", 
      cardVideoTitle: "Video", 
      footerLang: "Idioma", 
      footerAccess: "Accesibilidad"
  },
  pt: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Bem-vindo", 
      heroSubtitle: "...", 
      cardSelfServiceTitle: "Autoatendimento", 
      cardVideoTitle: "Video", 
      footerLang: "Língua", 
      footerAccess: "Acessibilidade"
  },
};

// --- REUSABLE PROCESS COMPONENTS ---

interface ProcessLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  children: React.ReactNode;
  translations: typeof EN_TRANSLATIONS;
  aiTrigger: React.ReactNode;
}

const ProcessLayout: React.FC<ProcessLayoutProps> = ({ 
  title, 
  currentStep, 
  totalSteps, 
  onBack, 
  children, 
  translations,
  aiTrigger
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
      {/* Header */}
      <header className="w-full py-8 px-8 sm:px-16 flex items-center justify-start">
           <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#FFCC00] flex items-center justify-center font-bold text-xl tracking-tight">
                   +P
               </div>
               <span className="text-xl font-bold tracking-tight">PostAssistant</span>
           </div>
       </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-8 w-full max-w-[90rem] mx-auto">
        <div className="w-full max-w-7xl mb-20 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-stretch">
            
            {/* The Main Process Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col min-h-[600px]">
                
                {/* Card Header: Title & Progress */}
                <div className="flex flex-col gap-8 mb-12">
                    <h2 className="text-3xl font-bold text-[#1D2533]">{title}</h2>
                    
                    {/* Progress Bar */}
                    {currentStep <= 5 && (
                        <div className="relative flex items-center justify-between w-full max-w-3xl">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 rounded-full"></div>
                            {Array.from({ length: totalSteps }).map((_, idx) => {
                                const stepNum = idx + 1;
                                const isActive = stepNum === currentStep;
                                const isCompleted = stepNum < currentStep;
                                
                                return (
                                <div key={idx} className="relative z-10 bg-white px-2">
                                    <div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                                        ${isCompleted ? 'bg-[#FFCC00] border-[#FFCC00]' : ''}
                                        ${isActive ? 'bg-[#FFCC00] border-[#FFCC00]' : ''}
                                        ${!isActive && !isCompleted ? 'bg-white border-zinc-200' : ''}
                                    `}
                                    >
                                    {isActive && <div className="w-3 h-3 bg-black rounded-full"></div>}
                                    {isCompleted && <Check size={20} className="text-black" strokeWidth={3} />}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Workflow Content Area */}
                <div className="flex-1 flex flex-col items-center justify-start w-full">
                    {children}
                </div>

                 {/* Footer within Card */}
                {currentStep <= 5 && (
                    <div className="mt-12 pt-8 border-t border-zinc-50 flex items-center justify-between w-full">
                        <button 
                        onClick={onBack}
                        className="px-6 py-3 rounded-xl border border-zinc-200 font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-2 text-zinc-600 hover:text-zinc-900"
                        >
                            <ChevronLeft size={20} />
                            {translations.process.back}
                        </button>
                    </div>
                )}
            </div>

            {/* AI Sidebar Pill */}
            <div className="hidden lg:flex flex-col items-center justify-center h-full w-32 animate-in slide-in-from-right-8 fade-in duration-700 delay-200">
                 <div className="w-24 h-64 bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
                     {aiTrigger}
                 </div>
            </div>
        </div>
      </main>

       {/* Footer */}
       <footer className="w-full py-8 px-8 border-t border-zinc-100 bg-white flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-zinc-400 tracking-wider uppercase">
           <div className="flex items-center gap-2 mb-4 sm:mb-0">
               <Globe size={16} />
               <span>{translations.footerLang}</span>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
               <Accessibility size={16} />
               <span>{translations.footerAccess}</span>
           </button>
       </footer>
    </div>
  );
};

// --- SUB-COMPONENTS FOR PARCEL WORKFLOW ---

const WeightDisplay = ({ t }: { t: typeof EN_TRANSLATIONS }) => (
  <div className="w-full bg-zinc-50 rounded-xl p-6 mb-8 border border-zinc-100 flex flex-col items-center">
      <div className="flex items-center gap-2 text-[#008A00] font-bold mb-6">
          <div className="w-6 h-6 rounded-full bg-[#008A00] flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span>{t.process.weightDetected}</span>
      </div>
      <div className="grid grid-cols-4 gap-4 w-full max-w-2xl text-center">
          <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <Weight size={24} className="mb-2 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase">{t.process.labelWeight}</span>
              <span className="font-bold text-lg text-[#1D2533]">1 kg 507g</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <Ruler size={24} className="mb-2 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase">{t.process.labelLength}</span>
              <span className="font-bold text-lg text-[#1D2533]">42 cm</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <ArrowRightFromLine size={24} className="mb-2 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase">{t.process.labelWidth}</span>
              <span className="font-bold text-lg text-[#1D2533]">22 cm</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <ArrowUpFromLine size={24} className="mb-2 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase">{t.process.labelHeight}</span>
              <span className="font-bold text-lg text-[#1D2533]">7 cm</span>
          </div>
      </div>
  </div>
);

const Step1Destination = ({ t, onTrigger, highlighted }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center pt-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <h3 className="text-2xl font-semibold text-zinc-700 mb-12 text-center">{t.process.step1Prompt}</h3>
        <div className="flex flex-col gap-6 w-full max-w-2xl">
            <button onClick={() => onTrigger('select_destination_ch')} className={`relative w-full bg-white rounded-2xl border-2 p-8 flex items-center justify-between shadow-sm hover:shadow-md transition-all group ${highlighted === 'select_destination_ch' ? 'ring-4 ring-[#FFCC00]/50 scale-[1.01] border-[#FFCC00]' : 'border-zinc-100'}`}>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-[#FFF8E1] flex items-center justify-center text-[#FFCC00]"><Check size={36} strokeWidth={3} /></div>
                    <span className="block text-xl font-bold text-[#1D2533]">{t.process.destCH}</span>
                </div>
                <ChevronRight size={28} className="text-zinc-300 group-hover:text-zinc-500" />
            </button>
            <button onClick={() => onTrigger('select_destination_abroad')} className={`w-full bg-zinc-50 rounded-2xl border border-zinc-100 p-8 flex flex-col md:flex-row md:items-center gap-6 opacity-90 cursor-not-allowed ${highlighted === 'select_destination_abroad' ? 'ring-4 ring-red-200' : ''}`}>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-400 shrink-0"><AlertCircle size={36} /></div>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-xl font-bold text-zinc-400 mb-1">{t.process.destAbroad}</span>
                        <p className="text-red-400 text-sm font-medium max-w-lg mt-1">{t.process.errorAbroad}</p>
                    </div>
                </div>
            </button>
        </div>
    </div>
);

const Step2Weights = ({ t, onTrigger, highlighted }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
        <WeightDisplay t={t} />
        <div className="w-full bg-[#FFCC00] rounded-xl p-8 mt-4">
             <h3 className="text-xl font-bold text-[#1D2533] mb-6">{t.process.questionAddress}</h3>
             <div className="flex gap-4">
                 <button onClick={() => onTrigger('address_exists_yes')} className={`flex-1 bg-white/90 hover:bg-white p-6 rounded-xl text-center shadow-sm transition-all ${highlighted === 'address_exists_yes' ? 'ring-4 ring-white scale-105' : ''}`}>
                     <div className="text-2xl font-bold mb-1">{t.process.btnYes}</div>
                     <div className="text-sm text-zinc-600">{t.process.subYes}</div>
                 </button>
                 <button onClick={() => onTrigger('address_exists_no')} className={`flex-1 bg-white/90 hover:bg-white p-6 rounded-xl text-center shadow-sm transition-all ${highlighted === 'address_exists_no' ? 'ring-4 ring-white scale-105' : ''}`}>
                     <div className="text-2xl font-bold mb-1">{t.process.btnNo}</div>
                     <div className="text-sm text-zinc-600">{t.process.subNo}</div>
                 </button>
             </div>
        </div>
    </div>
);

const Step3Address = ({ t, onTrigger, highlighted }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="w-full bg-zinc-100 rounded-full p-1 flex mb-8 max-w-md">
            <button className="flex-1 bg-[#1D2533] text-white rounded-full py-2 text-sm font-medium shadow-sm">{t.process.typePrivate}</button>
            <button className="flex-1 text-zinc-500 py-2 text-sm font-medium">{t.process.typeCompany}</button>
        </div>
        
        <div className="w-full bg-[#FFCC00] p-8 rounded-2xl">
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="bg-white p-2 rounded-lg"><span className="text-xs text-zinc-400 block">{t.process.destCH}</span><div className="h-6 w-full"></div></div>
                <input className="w-full p-3 rounded-lg border-0" placeholder={t.process.plHName} defaultValue="Mustermann Max" />
                <div className="grid grid-cols-[1fr_2fr] gap-4">
                     <input className="w-full p-3 rounded-lg border-0" placeholder={t.process.plHZip} defaultValue="3000" />
                     <input className="w-full p-3 rounded-lg border-0" placeholder={t.process.plHCity} defaultValue="Bern" />
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                     <input className="w-full p-3 rounded-lg border-0" placeholder={t.process.plHStreet} defaultValue="Musterstrasse 77" />
                     <input className="w-full p-3 rounded-lg border-0" placeholder={t.process.plHNr} />
                </div>
            </div>
            
            {/* Fake Keyboard Visual */}
            <div className="bg-[#FFCC00] pt-4 pb-8">
                <div className="grid grid-cols-10 gap-2 mb-2">
                    {[1,2,3,4,5,6,7,8,9,0].map(n => <div key={n} className="bg-white h-10 rounded flex items-center justify-center font-bold shadow-sm">{n}</div>)}
                </div>
                <div className="grid grid-cols-10 gap-2 px-4">
                     {['q','w','e','r','t','z','u','i','o','p'].map(l => <div key={l} className="bg-white h-10 rounded flex items-center justify-center font-bold shadow-sm uppercase">{l}</div>)}
                </div>
                 <div className="flex justify-center mt-8">
                    <button onClick={() => onTrigger('submit_address')} className={`bg-[#1D2533] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all ${highlighted === 'submit_address' ? 'ring-4 ring-white' : ''}`}>
                        {t.process.btnNext}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const Step4Options = ({ t, onTrigger, highlighted, service, signature }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any, service: any, signature: any }) => (
    <div className="w-full max-w-5xl flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
         <WeightDisplay t={t} />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
             {/* Left: Recipient Summary */}
             <div className="bg-white border border-zinc-200 rounded-xl p-6">
                 <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-zinc-500">{t.process.headerRecipient}</h4>
                 <div className="text-lg font-medium leading-relaxed">
                     Mustermann Max<br/>Musterstrasse 77<br/>3000 Bern<br/>Schweiz
                 </div>
             </div>

             {/* Right: Service Selection */}
             <div className="flex flex-col gap-4">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500">{t.process.headerService}</h4>
                 
                 <button onClick={() => onTrigger('select_economy')} className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${service === 'economy' ? 'border-[#FFCC00] bg-[#FFF8E1]' : 'border-zinc-200 bg-white'} ${highlighted === 'select_economy' ? 'scale-105 shadow-lg' : ''}`}>
                     <div className="text-left">
                         <div className="font-bold text-lg">{t.process.serviceEco}</div>
                         <div className="text-xs text-zinc-500">{t.process.serviceEcoSub}</div>
                     </div>
                     <div className="font-bold">CHF 8.50</div>
                 </button>

                 <button onClick={() => onTrigger('select_priority')} className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${service === 'priority' ? 'border-[#FFCC00] bg-[#FFF8E1]' : 'border-zinc-200 bg-white'} ${highlighted === 'select_priority' ? 'scale-105 shadow-lg' : ''}`}>
                     <div className="text-left">
                         <div className="font-bold text-lg">{t.process.servicePrio}</div>
                         <div className="text-xs text-zinc-500">{t.process.servicePrioSub}</div>
                     </div>
                     <div className="font-bold">CHF 10.50</div>
                 </button>

                 <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mt-4">{t.process.headerExtras}</h4>
                 <button onClick={() => onTrigger('toggle_signature')} className={`w-full p-3 rounded-xl border flex justify-between items-center ${signature ? 'border-[#FFCC00] bg-[#FFF8E1]' : 'border-zinc-200'} ${highlighted === 'toggle_signature' ? 'scale-105' : ''}`}>
                     <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${signature ? 'bg-[#FFCC00] border-[#FFCC00]' : 'border-zinc-300'}`}>
                             {signature && <Check size={14} />}
                         </div>
                         <span>{t.process.extraSig}</span>
                     </div>
                     <span className="font-medium">CHF 1.50</span>
                 </button>

                 <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between">
                     <span className="font-bold text-xl">{t.process.total}</span>
                     <span className="font-bold text-xl">CHF {service === 'economy' ? (signature ? '10.00' : '8.50') : (signature ? '12.00' : '10.50')}</span>
                 </div>

                 <button onClick={() => onTrigger('confirm_details')} className={`w-full bg-[#1D2533] text-white py-4 rounded-xl font-bold mt-4 shadow-xl hover:bg-black transition-all ${highlighted === 'confirm_details' ? 'scale-105 ring-4 ring-[#FFCC00]' : ''}`}>
                     {t.process.btnConfirm}
                 </button>
             </div>
         </div>
    </div>
);

const Step5Payment = ({ t, onTrigger, highlighted }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="w-full bg-white rounded-xl border border-zinc-200 p-6 mb-8">
             <h3 className="text-lg font-bold mb-4">{t.process.checkoutTitle}</h3>
             <div className="flex justify-between mb-2">
                 <span>PostPac Economy</span>
                 <span>CHF 8.50</span>
             </div>
             <div className="flex justify-between mb-4">
                 <span>Signatur</span>
                 <span>CHF 1.50</span>
             </div>
             <div className="flex justify-between border-t pt-2 font-bold text-xl">
                 <span>Total:</span>
                 <span>CHF 10.00</span>
             </div>
        </div>
        
        <div className="w-full bg-[#FFCC00] rounded-2xl p-12 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold mb-8">{t.process.payPrompt}</h3>
            <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 flex items-center justify-center gap-8">
                 <CreditCard size={64} className="text-zinc-800" />
                 <div className="text-left">
                     <div className="flex gap-2 mb-2">
                         <div className="w-8 h-5 bg-red-500 rounded-sm"></div>
                         <div className="w-8 h-5 bg-blue-500 rounded-sm"></div>
                         <div className="w-8 h-5 bg-yellow-500 rounded-sm"></div>
                     </div>
                     <p className="text-xs text-zinc-500 font-medium">Insert Card / Tap</p>
                 </div>
            </div>
            <div className="bg-black/10 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium mb-8">
                <AlertCircle size={16} />
                {t.process.payNote}
            </div>
            <button onClick={() => onTrigger('confirm_payment')} className={`bg-white text-black px-12 py-4 rounded-full font-bold shadow-lg text-lg hover:scale-105 transition-all ${highlighted === 'confirm_payment' ? 'ring-4 ring-black' : ''}`}>
                {t.process.btnPay}
            </button>
        </div>
    </div>
);

const Step6Success = ({ t, onTrigger, highlighted }: { t: typeof EN_TRANSLATIONS, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500 text-center">
         <div className="w-24 h-24 bg-[#008A00] rounded-full flex items-center justify-center mb-8 shadow-xl">
             <Check size={48} className="text-white" strokeWidth={4} />
         </div>

         <div className="bg-[#FFCC00] w-full rounded-2xl p-8 mb-8">
             <h3 className="font-bold text-xl mb-6">{t.process.instrTitle}</h3>
             <div className="flex flex-col gap-6 text-left">
                 <div className="flex gap-4 bg-white/50 p-4 rounded-xl items-center">
                     <div className="bg-white p-2 rounded-lg shadow-sm"><PenTool size={24} /></div>
                     <div>
                         <div className="font-bold">{t.process.instr1}</div>
                     </div>
                 </div>
                 <div className="flex gap-4 bg-white/50 p-4 rounded-xl items-center">
                     <div className="bg-white p-2 rounded-lg shadow-sm"><Box size={24} /></div>
                     <div>
                         <div className="font-bold">{t.process.instr2}</div>
                         <div className="text-sm">{t.process.instr2Sub}</div>
                     </div>
                 </div>
                 <div className="flex gap-4 bg-white/50 p-4 rounded-xl items-center">
                     <div className="bg-white p-2 rounded-lg shadow-sm"><Truck size={24} /></div>
                     <div>
                         <div className="font-bold">{t.process.instr3}</div>
                     </div>
                 </div>
             </div>
         </div>

         <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 w-full">
             <h4 className="font-bold mb-2">{t.process.feedbackTitle}</h4>
             <p className="text-sm text-zinc-500 mb-6">{t.process.feedbackSub}</p>
             <div className="flex justify-between gap-1 mb-2">
                 {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                     <button key={n} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-zinc-300 hover:bg-[#FFCC00] hover:border-[#FFCC00] flex items-center justify-center text-sm font-bold transition-colors">
                         {n}
                     </button>
                 ))}
             </div>
             <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase">
                 <span>{t.process.minSat}</span>
                 <span>{t.process.maxSat}</span>
             </div>
         </div>

         <div className="mt-8 font-bold text-xl text-[#1D2533]">{t.process.thankYou}</div>
         <button onClick={() => onTrigger('finish_process')} className="mt-8 text-zinc-500 underline hover:text-black">
             {t.process.btnFinish}
         </button>
    </div>
);

// --- APP COMPONENT ---

const App: React.FC = () => {
  // State
  const [language, setLanguage] = useState<Language>('de');
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [highlightedAction, setHighlightedAction] = useState<ActionType | null>(null);
  const [view, setView] = useState<'dashboard' | 'workflow'>('dashboard');
  const [currentWorkflow, setCurrentWorkflow] = useState<ActionType | null>(null);
  
  // Workflow State
  const [step, setStep] = useState(1);
  const [parcelData, setParcelData] = useState({
      destination: 'ch',
      weight: '1.507kg',
      addressAttached: false,
      service: 'economy', // economy | priority
      signature: false
  });

  const t = TRANSLATIONS[language];

  const handleActionTriggered = useCallback((actionId: ActionType) => {
    console.log("UI Action Triggered:", actionId);
    setHighlightedAction(actionId);
    setTimeout(() => setHighlightedAction(null), 1500);
    
    // Logic for navigation and state updates
    switch (actionId) {
        case 'parcel_send':
            setView('workflow');
            setCurrentWorkflow('parcel_send');
            setStep(1);
            break;
        case 'nav_back':
            if (step > 1) setStep(s => s - 1);
            else { setView('dashboard'); setCurrentWorkflow(null); }
            break;
        case 'select_destination_ch':
            setParcelData(prev => ({...prev, destination: 'ch'}));
            setStep(2);
            break;
        case 'select_destination_abroad':
            // Error state, do nothing or show alert
            break;
        case 'address_exists_yes':
            setParcelData(prev => ({...prev, addressAttached: true}));
            setStep(4); // Skip address entry
            break;
        case 'address_exists_no':
            setParcelData(prev => ({...prev, addressAttached: false}));
            setStep(3); // Go to address entry
            break;
        case 'submit_address':
            setStep(4);
            break;
        case 'select_economy':
            setParcelData(prev => ({...prev, service: 'economy'}));
            break;
        case 'select_priority':
            setParcelData(prev => ({...prev, service: 'priority'}));
            break;
        case 'toggle_signature':
            setParcelData(prev => ({...prev, signature: !prev.signature}));
            break;
        case 'confirm_details':
            setStep(5);
            break;
        case 'confirm_payment':
            setStep(6);
            break;
        case 'finish_process':
            setView('dashboard');
            setCurrentWorkflow(null);
            setStep(1);
            break;
        default:
            break;
    }

    setActiveAction(actionId);
  }, [step]);

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

  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
        const timeout = setTimeout(() => {
             connect(selectedVoice, t.systemInstruction);
        }, 500); 
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

  const ActionButton = ({ id, icon: Icon, label }: { id: ActionType, icon: any, label: string }) => {
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
        className={`px-4 py-1.5 rounded-full shadow-sm transition-all duration-200 font-medium ${language === lang ? 'bg-[#1D2533] text-white' : 'hover:text-zinc-900 text-zinc-500 hover:bg-zinc-200'}`}
    >
        {label}
    </button>
  );

  const AITrigger = () => (
    <button onClick={handleToggle} className="group relative w-16 h-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300 blur opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
            {isOpen ? <AudioVisualizer isActive={isConnected} volume={volume} /> : <Bot size={32} className="fill-white/20" />}
        </div>
        <div className="absolute -top-2 -right-2 bg-white text-[#FFCC00] p-1.5 rounded-full shadow-md animate-bounce"><Sparkles size={12} fill="currentColor" /></div>
    </button>
  );

  // Get current title based on step
  const getStepTitle = () => {
      if (step === 1) return t.process.step1Title;
      if (step === 2) return t.process.step2Title;
      if (step === 3) return t.process.step3Title;
      if (step === 4) return t.process.step4Title;
      if (step === 5) return t.process.step5Title;
      return t.process.step6Title;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900 relative overflow-x-hidden">
       
       {view === 'dashboard' ? (
           /* --- DASHBOARD VIEW --- */
           <>
               <header className="w-full py-8 px-8 sm:px-16 flex items-center justify-start">
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-[#FFCC00] flex items-center justify-center font-bold text-xl tracking-tight">+P</div>
                       <span className="text-xl font-bold tracking-tight">PostAssistant</span>
                   </div>
               </header>
               <main className="flex-1 flex flex-col items-center pt-12 px-4 sm:px-8 w-full max-w-[90rem] mx-auto">
                   <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                       <div className="relative inline-block">
                           <div className="absolute -inset-1 bg-[#FFCC00]/20 blur-3xl rounded-full pointer-events-none"></div>
                           <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold text-[#1D2533] mb-6 tracking-tight">{t.heroTitle}</h1>
                       </div>
                       <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>
                   </div>
                   <div className="w-full max-w-7xl mb-20 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-8 items-stretch">
                       <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col hover:shadow-xl transition-shadow duration-300 h-full">
                           <div className="w-12 h-12 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#FFCC00] mb-6"><Box size={28} strokeWidth={1.5} /></div>
                           <h2 className="text-2xl font-bold text-[#1D2533] mb-3">{t.cardSelfServiceTitle}</h2>
                           <p className="text-zinc-500 mb-8 text-sm leading-relaxed">{t.cardSelfServiceDesc}</p>
                           <div className="flex flex-col gap-3 mt-auto">
                               <ActionButton id="parcel_send" icon={Box} label={t.actions.parcel_send} />
                               <ActionButton id="letter_send" icon={Mail} label={t.actions.letter_send} />
                               <ActionButton id="payment" icon={CreditCard} label={t.actions.payment} />
                               <ActionButton id="parcel_track" icon={Search} label={t.actions.parcel_track} />
                           </div>
                       </div>
                       <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col hover:shadow-xl transition-shadow duration-300 h-full">
                           <div className="w-12 h-12 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#FFCC00] mb-6"><Video size={28} strokeWidth={1.5} /></div>
                           <h2 className="text-2xl font-bold text-[#1D2533] mb-3">{t.cardVideoTitle}</h2>
                           <p className="text-zinc-500 mb-8 text-sm leading-relaxed">{t.cardVideoDesc}</p>
                           <div className="mt-auto">
                               <ActionButton id="video_consultation" icon={Video} label={t.actions.video_consultation} />
                           </div>
                       </div>
                       <div className="flex flex-col items-center justify-center h-full lg:w-32 animate-in slide-in-from-right-8 fade-in duration-700 delay-200">
                           <div className="w-24 h-64 bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
                               <AITrigger />
                           </div>
                       </div>
                   </div>
               </main>
               <footer className="w-full py-8 px-8 border-t border-zinc-100 bg-white flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                   <div className="flex items-center gap-2 mb-4 sm:mb-0"><Globe size={16} /><span>{t.footerLang}</span></div>
                   <div className="flex items-center flex-wrap justify-center gap-1 bg-zinc-50 rounded-full p-1 border border-zinc-100 mb-4 sm:mb-0">
                       {['de', 'fr', 'it', 'en', 'es', 'pt'].map(l => <LanguageButton key={l} lang={l as Language} label={l.toUpperCase()} />)}
                   </div>
                   <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"><Accessibility size={16} /><span>{t.footerAccess}</span></button>
               </footer>
           </>
       ) : (
           /* --- WORKFLOW VIEW --- */
           <ProcessLayout
             title={getStepTitle()}
             currentStep={step}
             totalSteps={6}
             onBack={() => handleActionTriggered('nav_back')}
             translations={t}
             aiTrigger={<AITrigger />}
           >
               {step === 1 && <Step1Destination t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} />}
               {step === 2 && <Step2Weights t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} />}
               {step === 3 && <Step3Address t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} />}
               {step === 4 && <Step4Options t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} service={parcelData.service} signature={parcelData.signature} />}
               {step === 5 && <Step5Payment t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} />}
               {step === 6 && <Step6Success t={t} onTrigger={handleActionTriggered} highlighted={highlightedAction} />}
           </ProcessLayout>
       )}

       {/* VOICE WIDGET OVERLAY */}
       {isOpen && (
         <div className="fixed bottom-0 right-0 p-6 flex flex-col items-end z-50 pointer-events-none">
            <div className="pointer-events-auto w-[400px] h-[600px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col justify-end relative mb-4 animate-in slide-in-from-bottom-8 fade-in-0 duration-300">
                <div className="absolute top-0 right-0 z-20">
                    <button onClick={handleDisconnect} className="bg-white/80 backdrop-blur text-zinc-500 hover:text-red-600 hover:bg-white p-2 rounded-full shadow-sm border border-zinc-100 transition-all"><X size={18} /></button>
                </div>
                <div className="absolute top-0 left-0 z-20">
                    <div className="relative">
                        <button onClick={() => setShowSettings(!showSettings)} className="bg-white/80 backdrop-blur text-zinc-500 hover:text-zinc-900 hover:bg-white p-2 rounded-full shadow-sm border border-zinc-100 transition-all"><Settings size={18} /></button>
                        {showSettings && (
                            <div className="absolute top-10 left-0 bg-white rounded-xl shadow-xl border border-zinc-100 p-3 w-48 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Voice Selection</div>
                                <div className="space-y-1">
                                    {VOICE_NAMES.map(voice => (
                                        <button key={voice} onClick={() => { setSelectedVoice(voice); if (isConnected) connect(voice, t.systemInstruction); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedVoice === voice ? 'bg-[#FFCC00] text-black font-medium' : 'hover:bg-zinc-50 text-zinc-600'}`}>{voice}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-end mb-4 relative z-10">
                    {error && <div className="mx-4 mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm shadow-sm">{error}</div>}
                    <TranscriptView transcripts={transcripts} status={connectionState} />
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 ring-1 ring-black/5 p-6 relative overflow-hidden z-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FFCC00]/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col gap-6 relative">
                        <div className="h-16 flex items-center justify-center">
                            {isConnected ? <AudioVisualizer isActive={true} volume={volume} /> : <div className="flex items-center gap-2 text-zinc-400 animate-pulse"><span className="text-sm font-medium">Initializing...</span></div>}
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2 w-24"><span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#FFCC00] animate-pulse' : 'bg-zinc-300'}`}></span><span className="text-xs font-medium text-zinc-500">{isConnected ? 'Agent online' : 'Connecting'}</span></div>
                            <button onClick={handleDisconnect} className="w-12 h-12 flex items-center justify-center bg-[#0056D2] hover:bg-[#0044A5] text-white rounded-full shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95" title="End Conversation"><Pause size={20} fill="currentColor" /></button>
                            <div className="w-24 text-right"><span className="text-xs font-mono font-medium text-zinc-400">{formatTime(duration)}</span></div>
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
