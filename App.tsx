
import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Settings, Pause, Box, Mail, Search, Video, Globe, Accessibility, 
  Bot, Sparkles, ChevronRight, Check, AlertCircle, ChevronLeft, 
  ArrowRightFromLine, Scale, User, Truck, PenTool, MapPin, Package, 
  CreditCard
} from 'lucide-react';
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
      step1Prompt: "Where are you sending your parcel?",
      destCH: "Switzerland / Liechtenstein",
      destAbroad: "Abroad",
      errorAbroad: "Shipping abroad is not possible here. Please contact the counter.",
      
      step2Title: "Enter parcel details",
      weightDetected: "Measurement successful",
      labelWeight: "Weight",
      labelLength: "Length",
      labelWidth: "Width",
      labelHeight: "Height",
      questionAddress: "Do you already have an address label?",
      btnYes: "YES",
      subYes: "I have a label",
      btnNo: "NO",
      subNo: "Create new label",

      step3Title: "Recipient address",
      typePrivate: "Private",
      typeCompany: "Company",
      plHName: "Name, First name",
      plHZip: "Zip",
      plHCity: "City",
      plHStreet: "Street",
      plHNr: "No.",
      plHAdd: "Address supplement",
      btnCancel: "Cancel",
      btnNext: "Continue",

      step4Title: "Shipping options",
      headerRecipient: "Recipient",
      headerService: "Select shipping speed",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "2 working days",
      servicePrioSub: "Next working day",
      headerExtras: "Additional Services",
      extraSig: "Signature required",
      agb: "Please take note of the GTC.",
      total: "Total Amount",
      btnConfirm: "Proceed to Checkout",

      step5Title: "Payment",
      checkoutTitle: "Order Summary",
      payPrompt: "Please follow instructions on the terminal.",
      payNote: "Cards only (No Cash/TWINT)",
      btnPay: "Simulate Payment",

      step6Title: "Almost done",
      instrTitle: "Final Steps",
      instr1: "Take label",
      instr2: "Stick on parcel",
      instr2Sub: "Ensure barcode is flat",
      instr3: "Drop parcel",
      feedbackTitle: "Rate your experience",
      feedbackSub: "How easy was this process?",
      minSat: "Difficult",
      maxSat: "Easy",
      thankYou: "Thank you!",
      btnFinish: "Back to Home"
    }
};

const TRANSLATIONS = {
  de: {
    heroTitle: "Willkommen bei der Post",
    heroSubtitle: "Erledigen Sie Ihre Postgeschäfte einfach und schnell. Wie können wir Sie heute unterstützen?",
    cardSelfServiceTitle: "Self-Service Assistent",
    cardSelfServiceDesc: "Erledigen Sie Ihre Postgeschäfte direkt hier im Self-Service.",
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
      step1Prompt: "Wohin möchten Sie Ihr Paket versenden?",
      destCH: "Schweiz / Liechtenstein",
      destAbroad: "Ausland",
      errorAbroad: "Versand ins Ausland bitte am Schalter aufgeben.",
      
      step2Title: "Paketdetails",
      weightDetected: "Messung erfolgreich",
      labelWeight: "Gewicht",
      labelLength: "Länge",
      labelWidth: "Breite",
      labelHeight: "Höhe",
      questionAddress: "Haben Sie bereits eine Adressetikette?",
      btnYes: "JA",
      subYes: "Etikette vorhanden",
      btnNo: "NEIN",
      subNo: "Etikette erstellen",

      step3Title: "Empfänger",
      typePrivate: "Privatperson",
      typeCompany: "Firma",
      plHName: "Name, Vorname",
      plHZip: "PLZ",
      plHCity: "Ort",
      plHStreet: "Strasse",
      plHNr: "Nr.",
      plHAdd: "Adresszusatz",
      btnCancel: "Abbrechen",
      btnNext: "Weiter",

      step4Title: "Versandart",
      headerRecipient: "Empfänger",
      headerService: "Geschwindigkeit wählen",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "2 Werktage (Mo–Fr)",
      servicePrioSub: "Nächster Werktag (Mo–Fr)",
      headerExtras: "Zusatzleistungen",
      extraSig: "Einschreiben (Signatur)",
      agb: "AGB akzeptieren",
      total: "Gesamtbetrag",
      btnConfirm: "Zur Kasse",

      step5Title: "Bezahlung",
      checkoutTitle: "Zusammenfassung",
      payPrompt: "Bitte folgen Sie den Anweisungen am Terminal.",
      payNote: "Nur Kartenzahlung (Kein Bargeld/TWINT)",
      btnPay: "Zahlung simulieren",
      
      step6Title: "Abschluss",
      instrTitle: "Die letzten Schritte",
      instr1: "Etikette entnehmen",
      instr2: "Aufkleben",
      instr2Sub: "Barcode muss gut lesbar sein",
      instr3: "Einwerfen",
      feedbackTitle: "Ihre Meinung zählt",
      feedbackSub: "Wie einfach war dieser Vorgang?",
      minSat: "Schwierig",
      maxSat: "Einfach",
      thankYou: "Vielen Dank!",
      btnFinish: "Zum Start"
    }
  },
  fr: {
    heroTitle: "Bienvenue à la Poste",
    heroSubtitle: "Gérez vos affaires postales simplement et rapidement.",
    cardSelfServiceTitle: "Assistant Self-Service",
    cardSelfServiceDesc: "Gérez vos affaires postales ici même en libre-service.",
    cardVideoTitle: "Conseil Vidéo",
    cardVideoDesc: "Conseil personnel par appel vidéo.",
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
      step1Prompt: "Où souhaitez-vous envoyer votre colis ?",
      destCH: "Suisse / Liechtenstein",
      destAbroad: "Étranger",
      errorAbroad: "Expédition à l'étranger uniquement au guichet.",
      
      step2Title: "Détails du colis",
      weightDetected: "Mesure réussie",
      labelWeight: "Poids",
      labelLength: "Longueur",
      labelWidth: "Largeur",
      labelHeight: "Hauteur",
      questionAddress: "Avez-vous déjà une étiquette d'adresse ?",
      btnYes: "OUI",
      subYes: "Étiquette présente",
      btnNo: "NON",
      subNo: "Créer une étiquette",

      step3Title: "Destinataire",
      typePrivate: "Particulier",
      typeCompany: "Entreprise",
      plHName: "Nom, Prénom",
      plHZip: "NPA",
      plHCity: "Lieu",
      plHStreet: "Rue",
      plHNr: "No.",
      plHAdd: "Complément",
      btnCancel: "Annuler",
      btnNext: "Continuer",

      step4Title: "Options d'expédition",
      headerRecipient: "Destinataire",
      headerService: "Choisir la vitesse",
      serviceEco: "PostPac Economy",
      servicePrio: "PostPac Priority",
      serviceEcoSub: "2 jours ouvrables",
      servicePrioSub: "Jour suivant",
      headerExtras: "Prestations complémentaires",
      extraSig: "Signature",
      agb: "Accepter les CG",
      total: "Montant total",
      btnConfirm: "Payer",

      step5Title: "Paiement",
      checkoutTitle: "Résumé",
      payPrompt: "Suivez les instructions sur le terminal.",
      payNote: "Cartes uniquement (Pas de Cash/TWINT)",
      btnPay: "Simuler le paiement",

      step6Title: "Terminé",
      instrTitle: "Dernières étapes",
      instr1: "Prendre l'étiquette",
      instr2: "Coller sur le colis",
      instr2Sub: "Code-barres bien visible",
      instr3: "Déposer le colis",
      feedbackTitle: "Votre avis",
      feedbackSub: "C'était facile ?",
      minSat: "Difficile",
      maxSat: "Facile",
      thankYou: "Merci !",
      btnFinish: "Terminer"
    }
  },
  en: EN_TRANSLATIONS,
  it: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Benvenuti", 
      footerLang: "Lingua", 
      footerAccess: "Accessibilità"
  },
  es: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Bienvenido", 
      footerLang: "Idioma", 
      footerAccess: "Accesibilidad"
  },
  pt: { 
      ...EN_TRANSLATIONS,
      heroTitle: "Bem-vindo", 
      footerLang: "Língua", 
      footerAccess: "Acessibilidade"
  }
};

type Translation = typeof EN_TRANSLATIONS;

// --- REUSABLE PROCESS COMPONENTS ---

interface ProcessLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  children: React.ReactNode;
  translations: Translation;
  aiTrigger: React.ReactNode;
  primaryAction?: React.ReactNode;
}

const ProcessLayout: React.FC<ProcessLayoutProps> = ({ 
  title, 
  currentStep, 
  totalSteps, 
  onBack, 
  children, 
  translations,
  aiTrigger,
  primaryAction
}) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      {/* Header */}
      <header className="w-full py-6 px-8 sm:px-16 flex items-center justify-start bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
           <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer" onClick={onBack}>
               <div className="w-10 h-10 bg-[#FFCC00] flex items-center justify-center font-bold text-xl tracking-tight shadow-sm rounded-lg">
                   +P
               </div>
               <span className="text-xl font-bold tracking-tight text-[#1D2533]">PostAssistant</span>
           </div>
       </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-8 w-full max-w-[90rem] mx-auto py-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            
            {/* The Main Process Card */}
            <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-2xl shadow-zinc-200/50 border border-white flex flex-col min-h-[700px] relative overflow-hidden">
                
                {/* Progress Bar Top */}
                {currentStep <= 5 && (
                    <div className="flex gap-3 mb-12 w-full max-w-md">
                        {Array.from({ length: totalSteps }).map((_, idx) => {
                             const isActive = idx + 1 === currentStep;
                             const isCompleted = idx + 1 < currentStep;
                             return (
                                 <div key={idx} className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                                     <div className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-[#FFCC00]' : isActive ? 'bg-[#1D2533]' : 'bg-transparent'}`} />
                                 </div>
                             );
                        })}
                    </div>
                )}

                {/* Card Header: Title */}
                <div className="flex flex-col gap-2 mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
                    <h2 className="text-3xl sm:text-4xl font-bold text-[#1D2533] tracking-tight">{title}</h2>
                </div>

                {/* Workflow Content Area */}
                <div className="flex-1 flex flex-col items-center justify-start w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
                    {children}
                </div>

                 {/* Unified Footer within Card */}
                <div className="mt-auto pt-10 border-t border-zinc-100/80 flex items-center justify-between w-full gap-4">
                    <button 
                        onClick={onBack}
                        className="group h-14 px-8 rounded-full border border-zinc-200 bg-white font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center gap-3 text-zinc-600 hover:text-[#1D2533]"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="tracking-wide">{translations.process.back}</span>
                    </button>

                    {/* The Primary Action Button sits here, on the same level as Back */}
                    <div className="flex-1 flex justify-end">
                        {primaryAction}
                    </div>
                </div>
            </div>

            {/* AI Sidebar Pill */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:sticky lg:top-24 w-32">
                 <div className="w-24 h-64 bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center relative overflow-hidden">
                     {aiTrigger}
                 </div>
            </div>
        </div>
      </main>

       {/* Footer */}
       <footer className="w-full py-8 px-8 border-t border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-zinc-400 tracking-wider uppercase">
           <div className="flex items-center gap-2 mb-4 sm:mb-0 text-zinc-500">
               <Globe size={16} />
               <span>{translations.footerLang}</span>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-500 hover:text-zinc-900">
               <Accessibility size={16} />
               <span>{translations.footerAccess}</span>
           </button>
       </footer>
    </div>
  );
};

// --- SUB-COMPONENTS FOR PARCEL WORKFLOW ---

const WeightDisplay = ({ t }: { t: Translation }) => (
  <div className="w-full bg-zinc-900 rounded-3xl p-8 mb-10 shadow-xl shadow-zinc-300/50 flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-zinc-800 relative overflow-hidden">
      {/* Glassy reflection effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center gap-6 z-10">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700 shadow-inner">
              <Scale size={32} className="text-[#FFCC00]" />
          </div>
          <div>
             <div className="text-[#FFCC00] text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse"></span>
                 {t.process.weightDetected}
             </div>
             <div className="text-white text-4xl font-mono font-medium tracking-tight tabular-nums">1.507 <span className="text-xl text-zinc-500 font-normal">kg</span></div>
          </div>
      </div>
      
      <div className="h-12 w-px bg-zinc-800 hidden md:block"></div>

      <div className="grid grid-cols-3 gap-8 text-center z-10 w-full md:w-auto">
          <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t.process.labelLength}</span>
              <span className="font-mono text-white text-xl tabular-nums">42<span className="text-sm text-zinc-600 ml-1">cm</span></span>
          </div>
          <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t.process.labelWidth}</span>
              <span className="font-mono text-white text-xl tabular-nums">22<span className="text-sm text-zinc-600 ml-1">cm</span></span>
          </div>
          <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t.process.labelHeight}</span>
              <span className="font-mono text-white text-xl tabular-nums">7<span className="text-sm text-zinc-600 ml-1">cm</span></span>
          </div>
      </div>
  </div>
);

const Step1Destination = ({ t, onTrigger, highlighted }: { t: Translation, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center pt-4">
        <h3 className="text-xl text-zinc-500 font-medium mb-8 text-center">{t.process.step1Prompt}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <button 
                onClick={() => onTrigger('select_destination_ch')} 
                className={`relative group w-full bg-white rounded-3xl border-2 p-10 flex flex-col items-center justify-center gap-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${highlighted === 'select_destination_ch' ? 'ring-4 ring-[#FFCC00]/50 border-[#FFCC00]' : 'border-zinc-100 hover:border-[#FFCC00]'}`}
            >
                <div className="w-28 h-28 rounded-full bg-[#FFF8E1] group-hover:bg-[#FFCC00] flex items-center justify-center text-[#FFCC00] group-hover:text-[#1D2533] transition-colors duration-300 shadow-inner">
                    <MapPin size={48} strokeWidth={2} />
                </div>
                <span className="block text-2xl font-bold text-[#1D2533] text-center">{t.process.destCH}</span>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#FFCC00]">
                    <Check size={24} />
                </div>
            </button>

            <button 
                onClick={() => onTrigger('select_destination_abroad')} 
                className={`relative w-full bg-zinc-50 rounded-3xl border-2 border-zinc-100 p-10 flex flex-col items-center justify-center gap-6 opacity-60 cursor-not-allowed grayscale-[0.5] hover:grayscale-0 transition-all ${highlighted === 'select_destination_abroad' ? 'ring-4 ring-red-100 border-red-200' : ''}`}
            >
                <div className="w-28 h-28 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 shadow-inner">
                    <Globe size={48} strokeWidth={2} />
                </div>
                <div className="flex flex-col items-center text-center">
                    <span className="text-2xl font-bold text-zinc-400 mb-3">{t.process.destAbroad}</span>
                    <span className="text-red-600 text-xs font-bold bg-red-100 px-4 py-1.5 rounded-full uppercase tracking-wide">{t.process.errorAbroad}</span>
                </div>
            </button>
        </div>
    </div>
);

const Step2Weights = ({ t, onTrigger, highlighted }: { t: Translation, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center">
        <WeightDisplay t={t} />
        <div className="w-full bg-[#FFCC00] rounded-[2rem] p-10 sm:p-14 shadow-xl shadow-[#FFCC00]/20 mt-4 text-center relative overflow-hidden group">
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
             <h3 className="text-3xl font-bold text-[#1D2533] mb-10 relative z-10">{t.process.questionAddress}</h3>
             <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                 <button onClick={() => onTrigger('address_exists_yes')} className={`group/btn bg-white hover:bg-zinc-50 min-w-[200px] p-6 rounded-2xl text-center shadow-lg shadow-black/5 hover:shadow-xl transition-all hover:-translate-y-1 ${highlighted === 'address_exists_yes' ? 'ring-4 ring-white scale-105' : ''}`}>
                     <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 group-hover/btn:scale-110 transition-transform shadow-inner"><Check size={28} strokeWidth={3} /></div>
                     <div className="text-xl font-bold mb-1 text-[#1D2533]">{t.process.btnYes}</div>
                     <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{t.process.subYes}</div>
                 </button>
                 <button onClick={() => onTrigger('address_exists_no')} className={`group/btn bg-[#1D2533] hover:bg-black min-w-[200px] p-6 rounded-2xl text-center shadow-lg shadow-black/10 hover:shadow-xl transition-all hover:-translate-y-1 ${highlighted === 'address_exists_no' ? 'ring-4 ring-white scale-105' : ''}`}>
                     <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white group-hover/btn:scale-110 transition-transform shadow-inner"><PenTool size={28} /></div>
                     <div className="text-xl font-bold mb-1 text-white">{t.process.btnNo}</div>
                     <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{t.process.subNo}</div>
                 </button>
             </div>
        </div>
    </div>
);

const Step3Address = ({ t, onTrigger, highlighted }: { t: Translation, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="w-full bg-zinc-100 rounded-full p-1.5 flex mb-10 max-w-sm shadow-inner">
            <button className="flex-1 bg-white text-[#1D2533] rounded-full py-3 text-sm font-bold shadow-sm transition-all border border-zinc-200/50">{t.process.typePrivate}</button>
            <button className="flex-1 text-zinc-500 hover:text-zinc-800 py-3 text-sm font-medium transition-colors">{t.process.typeCompany}</button>
        </div>
        
        <div className="w-full bg-white border border-zinc-100 p-8 sm:p-10 rounded-[2rem] shadow-lg shadow-zinc-200/50 mb-8">
            <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#FFF8E1] p-2.5 rounded-xl text-[#FFCC00]"><MapPin size={24} /></div>
                    <span className="font-bold text-lg text-[#1D2533]">{t.process.destCH}</span>
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-50/50 p-2 rounded-2xl border border-zinc-200 focus-within:border-[#FFCC00] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FFCC00]/10 transition-all">
                        <div className="px-3 pt-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.process.plHName}</label>
                        </div>
                        <input className="w-full bg-transparent outline-none text-xl font-medium text-[#1D2533] px-3 pb-2 placeholder-zinc-300" defaultValue="Mustermann Max" />
                    </div>
                    
                    <div className="grid grid-cols-[1fr_2fr] gap-4">
                         <div className="bg-zinc-50/50 p-2 rounded-2xl border border-zinc-200 focus-within:border-[#FFCC00] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FFCC00]/10 transition-all">
                             <div className="px-3 pt-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.process.plHZip}</label>
                             </div>
                            <input className="w-full bg-transparent outline-none text-xl font-medium text-[#1D2533] px-3 pb-2" defaultValue="3000" />
                         </div>
                         <div className="bg-zinc-50/50 p-2 rounded-2xl border border-zinc-200 focus-within:border-[#FFCC00] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FFCC00]/10 transition-all">
                             <div className="px-3 pt-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.process.plHCity}</label>
                             </div>
                            <input className="w-full bg-transparent outline-none text-xl font-medium text-[#1D2533] px-3 pb-2" defaultValue="Bern" />
                         </div>
                    </div>

                    <div className="grid grid-cols-[2fr_1fr] gap-4">
                         <div className="bg-zinc-50/50 p-2 rounded-2xl border border-zinc-200 focus-within:border-[#FFCC00] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FFCC00]/10 transition-all">
                             <div className="px-3 pt-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.process.plHStreet}</label>
                             </div>
                            <input className="w-full bg-transparent outline-none text-xl font-medium text-[#1D2533] px-3 pb-2" defaultValue="Musterstrasse 77" />
                         </div>
                         <div className="bg-zinc-50/50 p-2 rounded-2xl border border-zinc-200 focus-within:border-[#FFCC00] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FFCC00]/10 transition-all">
                             <div className="px-3 pt-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.process.plHNr}</label>
                             </div>
                            <input className="w-full bg-transparent outline-none text-xl font-medium text-[#1D2533] px-3 pb-2" />
                         </div>
                    </div>
                </div>
            </div>
        </div>
            
        {/* Clean Keyboard Visual */}
        <div className="w-full bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-sm">
            <div className="grid grid-cols-10 gap-2 mb-2">
                {[1,2,3,4,5,6,7,8,9,0].map(n => <div key={n} className="bg-zinc-50 h-12 rounded-lg flex items-center justify-center font-bold text-zinc-600 shadow-sm hover:bg-zinc-200 transition-colors cursor-pointer text-base">{n}</div>)}
            </div>
            <div className="grid grid-cols-10 gap-2 px-4 mb-2">
                    {['Q','W','E','R','T','Z','U','I','O','P'].map(l => <div key={l} className="bg-zinc-50 h-12 rounded-lg flex items-center justify-center font-bold text-zinc-600 shadow-sm hover:bg-zinc-200 transition-colors cursor-pointer text-base">{l}</div>)}
            </div>
             <div className="w-1/2 mx-auto bg-zinc-50 h-12 rounded-lg mt-4 shadow-sm"></div>
        </div>
    </div>
);

interface Step4OptionsProps {
    t: Translation;
    onTrigger: any;
    highlighted: any;
    service: string;
    signature: boolean;
}

const Step4Options: React.FC<Step4OptionsProps> = ({ t, onTrigger, highlighted, service, signature }) => (
    <div className="w-full max-w-5xl flex flex-col items-center">
         <WeightDisplay t={t} />
         <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 w-full items-start">
             {/* Left: Recipient Summary */}
             <div className="bg-white rounded-3xl p-8 flex flex-col gap-4 border border-zinc-100 shadow-lg shadow-zinc-200/50 h-full">
                 <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-widest">
                     <User size={14} /> {t.process.headerRecipient}
                 </div>
                 <div className="text-xl font-bold text-[#1D2533] leading-relaxed mt-2">
                     Max Mustermann<br/>Musterstrasse 77<br/>3000 Bern<br/>Schweiz
                 </div>
                 <div className="h-px w-full bg-zinc-100 my-4"></div>
                 <button className="text-sm font-bold text-zinc-400 hover:text-[#1D2533] flex items-center gap-2 transition-colors mt-auto">
                     <PenTool size={14} /> Edit address
                 </button>
             </div>

             {/* Right: Service Selection */}
             <div className="flex flex-col gap-4">
                 <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-2 pl-2">{t.process.headerService}</h4>
                 
                 <button onClick={() => onTrigger('select_economy')} className={`group w-full p-6 rounded-2xl border-2 flex justify-between items-center transition-all duration-300 ${service === 'economy' ? 'border-[#FFCC00] bg-[#FFF9E6]' : 'border-zinc-100 bg-white hover:border-zinc-200'} ${highlighted === 'select_economy' ? 'scale-[1.02] shadow-lg' : ''}`}>
                     <div className="flex items-center gap-5 text-left">
                         <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${service === 'economy' ? 'border-[#FFCC00]' : 'border-zinc-200'}`}>
                             {service === 'economy' && <div className="w-3.5 h-3.5 bg-[#FFCC00] rounded-full" />}
                         </div>
                         <div>
                            <div className="font-bold text-lg text-[#1D2533] flex items-center gap-2">
                                {t.process.serviceEco}
                                <Truck size={18} className="text-zinc-400" />
                            </div>
                            <div className="text-sm font-medium text-zinc-500 mt-0.5">{t.process.serviceEcoSub}</div>
                         </div>
                     </div>
                     <div className="font-bold text-xl bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">CHF 8.50</div>
                 </button>

                 <button onClick={() => onTrigger('select_priority')} className={`group w-full p-6 rounded-2xl border-2 flex justify-between items-center transition-all duration-300 ${service === 'priority' ? 'border-[#FFCC00] bg-[#FFF9E6]' : 'border-zinc-100 bg-white hover:border-zinc-200'} ${highlighted === 'select_priority' ? 'scale-[1.02] shadow-lg' : ''}`}>
                     <div className="flex items-center gap-5 text-left">
                         <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${service === 'priority' ? 'border-[#FFCC00]' : 'border-zinc-200'}`}>
                             {service === 'priority' && <div className="w-3.5 h-3.5 bg-[#FFCC00] rounded-full" />}
                         </div>
                         <div>
                            <div className="font-bold text-lg text-[#1D2533] flex items-center gap-2">
                                {t.process.servicePrio} 
                                <span className="text-[10px] bg-[#1D2533] text-white px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Fast</span>
                            </div>
                            <div className="text-sm font-medium text-zinc-500 mt-0.5">{t.process.servicePrioSub}</div>
                         </div>
                     </div>
                     <div className="font-bold text-xl bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">CHF 10.50</div>
                 </button>

                 <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mt-6 mb-2 pl-2">{t.process.headerExtras}</h4>
                 <button onClick={() => onTrigger('toggle_signature')} className={`w-full p-5 rounded-2xl border-2 flex justify-between items-center transition-all ${signature ? 'border-[#FFCC00] bg-[#FFF9E6] shadow-sm' : 'border-zinc-100 bg-white hover:border-zinc-200'} ${highlighted === 'toggle_signature' ? 'scale-[1.02]' : ''}`}>
                     <div className="flex items-center gap-5">
                         <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${signature ? 'bg-[#FFCC00] border-[#FFCC00] text-white' : 'border-zinc-200 bg-white'}`}>
                             {signature && <Check size={18} strokeWidth={4} />}
                         </div>
                         <span className="font-bold text-[#1D2533] text-lg">{t.process.extraSig}</span>
                     </div>
                     <span className="font-bold text-zinc-600">+ CHF 1.50</span>
                 </button>

                 <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between px-2">
                     <div className="flex flex-col">
                        <span className="font-medium text-zinc-400 text-xs uppercase tracking-widest">{t.process.total}</span>
                        <span className="font-bold text-4xl text-[#1D2533] tracking-tighter mt-1">CHF {service === 'economy' ? (signature ? '10.00' : '8.50') : (signature ? '12.00' : '10.50')}</span>
                     </div>
                 </div>
             </div>
         </div>
    </div>
);

const Step5Payment = ({ t, onTrigger, highlighted }: { t: Translation, onTrigger: any, highlighted: any }) => (
    <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Receipt Card */}
        <div className="w-full bg-white rounded-[2rem] p-10 mb-10 border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden">
             {/* Perforated edge effect visual top */}
             <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,#f4f4f5_10px,#f4f4f5_20px)]"></div>
             
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8 text-center">{t.process.checkoutTitle}</h3>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Box className="text-zinc-400" size={20} />
                        <span className="font-bold text-xl text-[#1D2533]">PostPac Economy</span>
                    </div>
                    <span className="font-mono text-xl text-zinc-600">CHF 8.50</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <PenTool className="text-zinc-400" size={20} />
                        <span className="font-medium text-lg text-zinc-600">Signature</span>
                    </div>
                    <span className="font-mono text-lg text-zinc-600">CHF 1.50</span>
                </div>
             </div>

             <div className="h-px w-full bg-zinc-100 my-8"></div>

             <div className="flex justify-between items-end px-4">
                 <span className="font-bold text-2xl text-[#1D2533]">Total</span>
                 <span className="font-bold text-5xl text-[#1D2533] tracking-tight">CHF 10.00</span>
             </div>
        </div>
        
        {/* Payment Terminal Visual */}
        <div className="w-full bg-[#1D2533] rounded-[2.5rem] p-12 flex flex-col items-center text-center shadow-2xl shadow-[#1D2533]/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h3 className="text-2xl font-bold mb-12 text-white relative z-10 max-w-md leading-snug">{t.process.payPrompt}</h3>
            
            <div className="relative mb-12 group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-[#FFCC00] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                <div className="bg-zinc-800/80 backdrop-blur-xl p-10 rounded-[2rem] border border-zinc-700 relative z-10 flex flex-col items-center gap-6 shadow-2xl">
                    <div className="flex gap-3 mb-2 opacity-80">
                        <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-red-500 opacity-90"></div></div>
                        <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-yellow-500 opacity-90"></div></div>
                        <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-blue-500 opacity-90"></div></div>
                    </div>
                    <CreditCard size={64} className="text-white" strokeWidth={1} />
                    <div className="h-1.5 w-32 bg-zinc-600 rounded-full animate-pulse mt-2"></div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 text-sm font-medium text-zinc-200 border border-white/10">
                <AlertCircle size={16} className="text-[#FFCC00]" />
                {t.process.payNote}
            </div>
        </div>
    </div>
);

interface Step6SuccessProps {
    t: Translation;
    onTrigger: any;
    highlighted: any;
}

const Step6Success: React.FC<Step6SuccessProps> = ({ t, onTrigger, highlighted }) => (
    <div className="w-full max-w-3xl flex flex-col items-center text-center pt-4">
         <div className="relative mb-8">
             <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full"></div>
             <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-green-50 animate-in zoom-in duration-500">
                 <Check size={56} className="text-green-500" strokeWidth={4} />
             </div>
         </div>

         <h2 className="text-4xl font-bold text-[#1D2533] mb-3 tracking-tight">Success!</h2>
         <p className="text-zinc-500 mb-12 text-xl">Your shipment has been paid successfully.</p>

         <div className="bg-[#FFCC00] w-full rounded-[2rem] p-10 shadow-xl shadow-[#FFCC00]/20 text-left relative overflow-hidden mb-12">
             <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>
             <h3 className="font-bold text-xl mb-8 text-[#1D2533] flex items-center gap-3 relative z-10">
                 <span className="bg-white/30 p-2 rounded-lg backdrop-blur-sm"><Box size={20} /></span>
                 {t.process.instrTitle}
             </h3>
             <div className="grid gap-4 relative z-10">
                 <div className="flex gap-6 bg-white p-6 rounded-2xl items-center shadow-sm border border-white/50 hover:scale-[1.01] transition-transform">
                     <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200">1</div>
                     <div>
                         <div className="font-bold text-lg text-[#1D2533]">{t.process.instr1}</div>
                     </div>
                 </div>
                 <div className="flex gap-6 bg-white p-6 rounded-2xl items-center shadow-sm border border-white/50 hover:scale-[1.01] transition-transform">
                     <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200">2</div>
                     <div>
                         <div className="font-bold text-lg text-[#1D2533]">{t.process.instr2}</div>
                         <div className="text-sm text-zinc-500 font-medium mt-0.5">{t.process.instr2Sub}</div>
                     </div>
                 </div>
                 <div className="flex gap-6 bg-white p-6 rounded-2xl items-center shadow-sm border border-white/50 hover:scale-[1.01] transition-transform">
                     <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200">3</div>
                     <div>
                         <div className="font-bold text-lg text-[#1D2533]">{t.process.instr3}</div>
                     </div>
                 </div>
             </div>
         </div>

         <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 w-full shadow-lg shadow-zinc-200/50">
             <div className="flex items-center justify-between mb-8">
                <div className="text-left">
                    <h4 className="font-bold text-lg text-[#1D2533]">{t.process.feedbackTitle}</h4>
                    <p className="text-sm text-zinc-500">{t.process.feedbackSub}</p>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-full"><Sparkles size={20} className="text-[#FFCC00]" /></div>
             </div>
             <div className="flex justify-between gap-1 mb-3">
                 {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                     <button key={n} className="flex-1 h-14 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-[#1D2533] hover:text-white hover:border-[#1D2533] hover:-translate-y-1 flex items-center justify-center text-sm font-bold transition-all shadow-sm">
                         {n}
                     </button>
                 ))}
             </div>
             <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
                 <span>{t.process.minSat}</span>
                 <span>{t.process.maxSat}</span>
             </div>
         </div>
    </div>
);

interface LanguageButtonProps {
    lang: Language;
    label: string;
    isSelected: boolean;
    onClick: (l: Language) => void;
}

const LanguageButton: React.FC<LanguageButtonProps> = ({ lang, label, isSelected, onClick }) => (
    <button 
        onClick={() => onClick(lang)}
        className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-200 ${isSelected ? 'bg-[#1D2533] text-white' : 'hover:text-zinc-900 text-zinc-500 hover:bg-white bg-white/50'}`}
    >
        {label}
    </button>
);

interface AITriggerProps {
    isOpen: boolean;
    isConnected: boolean;
    volume: number;
    onClick: () => void;
}

const AITrigger: React.FC<AITriggerProps> = ({ isOpen, isConnected, volume, onClick }) => (
    <button onClick={onClick} className="group relative w-16 h-16 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300 blur opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 active:scale-95">
            {isOpen ? <AudioVisualizer isActive={isConnected} volume={volume} /> : <Bot size={32} className="fill-white/20" />}
        </div>
        <div className="absolute -top-2 -right-2 bg-white text-[#FFCC00] p-1.5 rounded-full shadow-md animate-bounce"><Sparkles size={12} fill="currentColor" /></div>
    </button>
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
            // Access current step from state would be better, but for simplicity using setStep callback
            setStep(s => {
                if (s > 1) return s - 1;
                setView('dashboard');
                setCurrentWorkflow(null);
                return 1;
            });
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
            className={`w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300 group
                ${isHighlighted 
                    ? 'bg-[#FFCC00] text-zinc-900 scale-[1.02] shadow-lg ring-2 ring-offset-2 ring-[#FFCC00]' 
                    : 'bg-[#1D2533] text-white hover:bg-[#2E394C] hover:scale-[1.01] hover:shadow-xl'
                }`}
          >
              <div className={`${isHighlighted ? 'text-zinc-900' : 'text-white group-hover:text-[#FFCC00] transition-colors'}`}>
                  <Icon size={24} strokeWidth={1.5} />
              </div>
              <span className="font-bold text-base tracking-wide">{label}</span>
              <ChevronRight size={16} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${isHighlighted ? 'text-zinc-900' : 'text-zinc-400'}`} />
          </button>
      );
  };

  // Get current title based on step
  const getStepTitle = () => {
      if (step === 1) return t.process.step1Title;
      if (step === 2) return t.process.step2Title;
      if (step === 3) return t.process.step3Title;
      if (step === 4) return t.process.step4Title;
      if (step === 5) return t.process.step5Title;
      return t.process.step6Title;
  };

  // Determine the Primary Action Button based on the current step
  const renderPrimaryAction = () => {
      if (step === 3) {
          return (
              <button 
                onClick={() => handleActionTriggered('submit_address')} 
                className={`h-14 px-10 rounded-full font-bold shadow-lg transition-all flex items-center gap-3 bg-[#1D2533] hover:bg-black text-white hover:shadow-xl hover:-translate-y-1 ${highlightedAction === 'submit_address' ? 'ring-4 ring-[#FFCC00]' : ''}`}
              >
                  {t.process.btnNext}
                  <ChevronRight size={20} />
              </button>
          );
      }
      if (step === 4) {
           return (
              <button 
                onClick={() => handleActionTriggered('confirm_details')} 
                className={`h-14 px-10 rounded-full font-bold shadow-lg transition-all flex items-center gap-3 bg-[#1D2533] hover:bg-black text-white hover:shadow-xl hover:-translate-y-1 ${highlightedAction === 'confirm_details' ? 'ring-4 ring-[#FFCC00]' : ''}`}
              >
                  {t.process.btnConfirm}
                  <ArrowRightFromLine size={20} />
              </button>
          );
      }
      if (step === 5) {
          return (
              <button 
                onClick={() => handleActionTriggered('confirm_payment')} 
                className={`h-14 px-10 rounded-full font-bold shadow-lg transition-all flex items-center gap-3 bg-[#FFCC00] hover:bg-[#ffd633] text-[#1D2533] hover:shadow-[#FFCC00]/30 hover:-translate-y-1 ${highlightedAction === 'confirm_payment' ? 'ring-4 ring-white' : ''}`}
              >
                  {t.process.btnPay}
                  <ArrowRightFromLine size={20} />
              </button>
          );
      }
      if (step === 6) {
          return (
              <button 
                onClick={() => handleActionTriggered('finish_process')} 
                className="h-14 px-10 rounded-full font-bold shadow-sm transition-all flex items-center gap-3 bg-zinc-100 hover:bg-zinc-200 text-[#1D2533]"
              >
                  {t.process.btnFinish}
              </button>
          );
      }
      return null; 
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 relative overflow-x-hidden">
       
       {view === 'dashboard' ? (
           /* --- DASHBOARD VIEW --- */
           <>
               <header className="w-full py-8 px-8 sm:px-16 flex items-center justify-start">
                   <div className="flex items-center gap-3 group cursor-default">
                       <div className="w-10 h-10 bg-[#FFCC00] flex items-center justify-center font-bold text-xl tracking-tight rounded-lg shadow-sm group-hover:rotate-3 transition-transform">+P</div>
                       <span className="text-xl font-bold tracking-tight text-[#1D2533]">PostAssistant</span>
                   </div>
               </header>
               <main className="flex-1 flex flex-col items-center pt-12 px-4 sm:px-8 w-full max-w-[90rem] mx-auto">
                   <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                       <div className="relative inline-block">
                           <div className="absolute -inset-4 bg-[#FFCC00]/20 blur-3xl rounded-full pointer-events-none"></div>
                           <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold text-[#1D2533] mb-6 tracking-tight">{t.heroTitle}</h1>
                       </div>
                       <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>
                   </div>
                   <div className="w-full max-w-7xl mb-20 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_auto] gap-8 items-stretch">
                       
                       {/* Self Service Card */}
                       <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 border border-white hover:border-zinc-100 transition-colors duration-300 flex flex-col relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFCC00]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                           <div className="w-14 h-14 bg-[#FFF8E1] rounded-2xl flex items-center justify-center text-[#FFCC00] mb-8 shadow-inner"><Box size={32} strokeWidth={1.5} /></div>
                           <h2 className="text-3xl font-bold text-[#1D2533] mb-4">{t.cardSelfServiceTitle}</h2>
                           <p className="text-zinc-500 mb-10 text-base leading-relaxed max-w-md">{t.cardSelfServiceDesc}</p>
                           <div className="flex flex-col gap-4 mt-auto relative z-10">
                               <ActionButton id="parcel_send" icon={Package} label={t.actions.parcel_send} />
                               <ActionButton id="letter_send" icon={Mail} label={t.actions.letter_send} />
                               <ActionButton id="payment" icon={CreditCard} label={t.actions.payment} />
                               <ActionButton id="parcel_track" icon={Search} label={t.actions.parcel_track} />
                           </div>
                       </div>

                       {/* Video Consultation Card */}
                       <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 border border-white hover:border-zinc-100 transition-colors duration-300 flex flex-col relative overflow-hidden">
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                           <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-8 shadow-inner"><Video size={32} strokeWidth={1.5} /></div>
                           <h2 className="text-3xl font-bold text-[#1D2533] mb-4">{t.cardVideoTitle}</h2>
                           <p className="text-zinc-500 mb-10 text-base leading-relaxed">{t.cardVideoDesc}</p>
                           <div className="mt-auto relative z-10">
                               <div className="bg-zinc-50 rounded-2xl p-6 mb-6 border border-zinc-100">
                                   <div className="flex -space-x-3 mb-4">
                                       {[1,2,3].map(i => <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500`}>{i}</div>)}
                                       <div className="w-10 h-10 rounded-full border-2 border-white bg-[#1D2533] text-white flex items-center justify-center text-xs font-bold">+12</div>
                                   </div>
                                   <div className="text-sm font-medium text-zinc-500">Available Agents</div>
                               </div>
                               <ActionButton id="video_consultation" icon={Video} label={t.actions.video_consultation} />
                           </div>
                       </div>

                       {/* AI Sidebar */}
                       <div className="flex flex-col items-center justify-center h-full lg:w-32 animate-in slide-in-from-right-8 fade-in duration-700 delay-200">
                           <div className="w-24 h-64 bg-white rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white flex flex-col items-center justify-center relative overflow-hidden">
                               <AITrigger isOpen={isOpen} isConnected={isConnected} volume={volume} onClick={handleToggle} />
                           </div>
                       </div>
                   </div>
               </main>
               <footer className="w-full py-8 px-8 border-t border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                   <div className="flex items-center gap-2 mb-4 sm:mb-0"><Globe size={16} /><span>{t.footerLang}</span></div>
                   <div className="flex items-center flex-wrap justify-center gap-2 bg-zinc-100/50 rounded-full p-1.5 border border-zinc-200/50 mb-4 sm:mb-0">
                       {['de', 'fr', 'it', 'en', 'es', 'pt'].map(l => (
                           <LanguageButton 
                               key={l} 
                               lang={l as Language} 
                               label={l.toUpperCase()} 
                               isSelected={language === l}
                               onClick={setLanguage}
                            />
                       ))}
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
             aiTrigger={<AITrigger isOpen={isOpen} isConnected={isConnected} volume={volume} onClick={handleToggle} />}
             primaryAction={renderPrimaryAction()}
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
