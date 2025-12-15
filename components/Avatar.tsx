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
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);

      // Base circle
      ctx.beginPath();
      ctx.strokeStyle = isActive ? '#06B6D4' : '#1E293B'; // Cyan vs Dark Slate
      ctx.lineWidth = isActive ? 1.5 : 1;
      const baseRadius = 60;
      
      // Dynamic Waveform
      const points = 60;
      const maxAmp = 35 * (volume + 0.1); 

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise = isActive ? 
          (Math.sin(angle * 5 + phase) * 0.5 + Math.cos(angle * 9 - phase * 1.5) * 0.5) : 0;
        
        const r = baseRadius + (noise * maxAmp);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.closePath();
      ctx.stroke();

      // Inner Core - Glowing Orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.55, 0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.6);
      if (isActive) {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.4, '#06B6D4'); // Cyan
        gradient.addColorStop(1, '#2563EB'); // Blue
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 30 + volume * 50;
        ctx.shadowColor = '#06B6D4';
        ctx.globalAlpha = 0.8 + volume * 0.2;
      } else {
        gradient.addColorStop(0, '#1E293B');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
      
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Outer Tech Rings
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + 20, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([5, 15]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating Ring
      if (isActive) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 12, phase, phase + Math.PI / 2);
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      phase += 0.06;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [volume, isActive]);

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className={`absolute pointer-events-none text-cyber-cyan font-display tracking-[0.3em] text-[10px] uppercase ${isActive ? 'opacity-100 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]' : 'opacity-30'} transition-opacity duration-300`}>
        NOVA SYSTEM
      </div>
    </div>
  );
};

export default Avatar;