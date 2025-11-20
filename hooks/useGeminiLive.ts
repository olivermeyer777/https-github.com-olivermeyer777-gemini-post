
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, TranscriptionItem, VoiceName, ActionType } from '../types';
import { createPCMBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Define the tool for Gemini
const actionToolDeclaration: FunctionDeclaration = {
  name: 'trigger_action',
  description: 'Triggers a click on a specific UI button on the self-service portal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action_id: {
        type: Type.STRING,
        enum: [
          'parcel_send', 
          'letter_send', 
          'payment', 
          'parcel_track', 
          'video_consultation',
          'select_destination_ch',
          'select_destination_abroad',
          'address_exists_yes',
          'address_exists_no',
          'submit_address',
          'select_economy',
          'select_priority',
          'toggle_signature',
          'confirm_details',
          'confirm_payment',
          'finish_process',
          'nav_back',
          'nav_next'
        ],
        description: 'The specific ID of the action/button to trigger.'
      }
    },
    required: ['action_id']
  }
};

interface UseGeminiLiveProps {
  onActionTriggered?: (actionId: ActionType) => void;
}

export const useGeminiLive = ({ onActionTriggered }: UseGeminiLiveProps = {}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Session and Playback State
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Transcription State
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  const cleanupAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourcesRef.current.clear();

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setVolume(0);
  }, []);

  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        await session.close(); 
      } catch (e) {
        console.error('Error closing session:', e);
      }
      sessionPromiseRef.current = null;
    }
    cleanupAudio();
    setConnectionState(ConnectionState.DISCONNECTED);
  }, [cleanupAudio]);

  const connect = useCallback(async (voiceName: VoiceName, systemInstruction: string) => {
    if (!process.env.API_KEY) {
      setError("API Key is missing in environment variables.");
      return;
    }

    await disconnect();

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      await inputAudioContext.resume();
      await outputAudioContext.resume();

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);
      outputNodeRef.current = outputNode;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: [actionToolDeclaration] }]
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(prev => prev * 0.8 + rms * 2.0);

              const pcmBlob = createPCMBlob(inputData);
              
              if (sessionPromiseRef.current) {
                 sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 }).catch(err => {
                     console.error("Error sending input:", err);
                 });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (The Bot wants to click a button)
            if (message.toolCall) {
                const functionCalls = message.toolCall.functionCalls;
                const responses = [];

                for (const call of functionCalls) {
                    if (call.name === 'trigger_action') {
                        const actionId = call.args['action_id'] as ActionType;
                        console.log(`🤖 Bot triggered action: ${actionId}`);
                        
                        // Trigger UI callback
                        if (onActionTriggered) {
                            onActionTriggered(actionId);
                        }

                        responses.push({
                            id: call.id,
                            name: call.name,
                            response: { result: 'Action triggered successfully' }
                        });
                    }
                }

                // Must send response back to continue conversation
                if (responses.length > 0 && sessionPromiseRef.current) {
                     sessionPromiseRef.current.then(session => {
                         session.sendToolResponse({ functionResponses: responses });
                     });
                }
            }

            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
               const text = message.serverContent.outputTranscription.text;
               currentOutputTranscriptionRef.current += text;
               setTranscripts(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.source === 'model' && last.isPartial) {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, text: currentOutputTranscriptionRef.current }
                    ];
                 }
                 return [
                   ...prev,
                   { 
                     id: Date.now().toString(), 
                     source: 'model', 
                     text: currentOutputTranscriptionRef.current, 
                     isPartial: true, 
                     timestamp: new Date() 
                   }
                 ];
               });
            } else if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               currentInputTranscriptionRef.current += text;
                 setTranscripts(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.source === 'user' && last.isPartial) {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, text: currentInputTranscriptionRef.current }
                    ];
                 }
                 return [
                   ...prev,
                   { 
                     id: Date.now().toString(), 
                     source: 'user', 
                     text: currentInputTranscriptionRef.current, 
                     isPartial: true, 
                     timestamp: new Date() 
                   }
                 ];
               });
            }

            if (message.serverContent?.turnComplete) {
               setTranscripts(prev => {
                 return prev.map((t, i) => {
                   if (i >= prev.length - 2) {
                     return { ...t, isPartial: false };
                   }
                   return t;
                 });
               });
               currentInputTranscriptionRef.current = '';
               currentOutputTranscriptionRef.current = '';
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              if (!outputAudioContextRef.current || !outputNodeRef.current) return;
              
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              sourcesRef.current.add(source);
              
              nextStartTimeRef.current += audioBuffer.duration;
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => {
                source.stop();
                sourcesRef.current.delete(source);
              });
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setError("Connection failed. Service might be temporarily unavailable.");
            setConnectionState(ConnectionState.ERROR);
            cleanupAudio();
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            setConnectionState(ConnectionState.DISCONNECTED);
            cleanupAudio();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect.");
      setConnectionState(ConnectionState.ERROR);
      cleanupAudio();
    }
  }, [disconnect, cleanupAudio, onActionTriggered]);

  useEffect(() => {
    return () => {
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(s => s.close()).catch(() => {});
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    connect,
    disconnect,
    connectionState,
    transcripts,
    volume,
    error
  };
};