import React, { useEffect, useRef } from 'react';
import { TranscriptionItem } from '../types';

interface TranscriptViewProps {
  transcripts: TranscriptionItem[];
  status: string;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcripts }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col justify-end pb-4 px-4 space-y-4 overflow-y-auto max-h-full no-scrollbar mask-gradient-top"
    >
      {transcripts.length === 0 && (
          <div className="flex items-end justify-center pb-8 opacity-50">
            <p className="text-sm text-zinc-400 font-medium">Start speaking to chat...</p>
          </div>
      )}
      
      {transcripts.map((item) => (
        <div
          key={item.id}
          className={`flex w-full ${
            item.source === 'user' ? 'justify-end' : 'justify-start'
          } animate-in slide-in-from-bottom-2 fade-in duration-300`}
        >
          <div
            className={`max-w-[80%] p-4 text-sm font-medium leading-relaxed shadow-sm ${
              item.source === 'user'
                ? 'bg-zinc-900 text-white rounded-2xl rounded-tr-none'
                : 'bg-white border border-zinc-100 text-zinc-900 rounded-2xl rounded-tl-none shadow-md'
            }`}
          >
            <p>
              {item.text}
              {item.isPartial && (
                 <span className="inline-block w-1.5 h-1.5 ml-1 bg-[#FFCC00] rounded-full animate-pulse align-middle" />
              )}
            </p>
          </div>
        </div>
      ))}
      <div ref={endRef} className="h-2" />
    </div>
  );
};

export default TranscriptView;