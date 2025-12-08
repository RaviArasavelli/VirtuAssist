import React, { useEffect, useRef } from 'react';

interface AvatarProps {
  volume: number; // 0 to 1
  isActive: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      // Resize
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);

      // Base circle
      ctx.beginPath();
      ctx.strokeStyle = isActive ? '#06B6D4' : '#4B5563'; // Verias Cyan or Grey
      ctx.lineWidth = 2;
      const baseRadius = 60;
      
      // Dynamic Waveform
      const points = 50;
      const maxAmp = 30 * (volume + 0.1); // Minimum movement even when silent if active

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise = isActive ? Math.sin(angle * 5 + phase) * Math.cos(angle * 3 - phase) : 0;
        const r = baseRadius + (noise * maxAmp);
        
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.closePath();
      ctx.stroke();

      // Inner Glow
      if (isActive) {
        ctx.shadowBlur = 20 + volume * 50;
        ctx.shadowColor = '#06B6D4';
        ctx.fillStyle = `rgba(6, 182, 212, ${0.1 + volume * 0.4})`;
        ctx.fill();
      } else {
        ctx.shadowBlur = 0;
      }

      phase += 0.1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [volume, isActive]);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className={`absolute pointer-events-none text-veritas-accent font-display tracking-widest text-xs uppercase ${isActive ? 'opacity-100' : 'opacity-50'}`}>
        VirtuHire
      </div>
    </div>
  );
};

export default Avatar;