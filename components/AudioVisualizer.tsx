import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  // Create a symmetrical set of bars
  const barCount = 28; // Even number for symmetry
  const bars = Array.from({ length: barCount }, (_, i) => i);
  
  return (
    <div className="flex items-center justify-center gap-[2px] h-16 w-full px-8">
      {bars.map((i) => {
        // Calculate distance from center (0 to 1)
        const center = (barCount - 1) / 2;
        const dist = Math.abs(i - center) / center;
        
        // Gaussian-like curve for the "at rest" shape
        // Center bars are taller, edges are shorter
        const baseHeight = 10 + (1 - dist) * 15; 
        
        let height = baseHeight;
        let opacity = 0.3;
        
        if (isActive) {
            // Active animation
            // 1. Volume scales the whole wave
            // 2. Sine wave creates the "rippling" movement
            // 3. Random noise makes it look organic
            const wave = Math.sin(Date.now() / 150 + i * 0.5);
            const activeVol = Math.max(0.1, volume * 2.0); 
            
            // Center bars react more strongly to volume
            const sensitivity = 1 - (dist * 0.5);
            
            height = Math.max(6, baseHeight + (activeVol * 40 * sensitivity * Math.abs(wave)));
            opacity = 0.8 + (activeVol * 0.2);
        }

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ease-out ${isActive ? 'bg-[#FFCC00]' : 'bg-zinc-300'}`}
            style={{
              height: `${height}px`,
              opacity: opacity,
              minHeight: '4px'
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioVisualizer;