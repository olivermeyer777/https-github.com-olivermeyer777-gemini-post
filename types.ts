
export interface TranscriptionItem {
  id: string;
  source: 'user' | 'model';
  text: string;
  isPartial: boolean;
  timestamp: Date;
}

export type VoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

export const VOICE_NAMES: VoiceName[] = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

export interface VoiceConfig {
  prebuiltVoiceConfig: {
    voiceName: VoiceName;
  };
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

// Helper type for the internal blob structure used in the audio utils
export interface PCMData {
  data: string; // Base64 encoded
  mimeType: string;
}

// Actions that can be triggered by the Voice Bot
export type ActionType = 
  | 'parcel_send' 
  | 'letter_send' 
  | 'payment' 
  | 'parcel_track' 
  | 'video_consultation'
  // Workflow Step 1: Destination
  | 'select_destination_ch'
  | 'select_destination_abroad'
  // Workflow Step 2: Address Check
  | 'address_exists_yes'
  | 'address_exists_no'
  // Workflow Step 3: Address Input
  | 'submit_address'
  // Workflow Step 4: Options
  | 'select_economy'
  | 'select_priority'
  | 'toggle_signature'
  | 'confirm_details'
  // Workflow Step 5: Payment
  | 'confirm_payment'
  // Workflow Step 6: Finish
  | 'finish_process'
  // Navigation
  | 'nav_back'
  | 'nav_next';

export const AVAILABLE_ACTIONS: {id: ActionType, label: string}[] = [
  { id: 'parcel_send', label: 'Paket aufgeben' },
  { id: 'letter_send', label: 'Brief versenden' },
  { id: 'payment', label: 'Einzahlung (mit Karte)' },
  { id: 'parcel_track', label: 'Paket verfolgen' },
  { id: 'video_consultation', label: 'Beratung starten' }
];

export type Language = 'de' | 'fr' | 'it' | 'en' | 'es' | 'pt';