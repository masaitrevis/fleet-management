'use client';

import { useEffect, useRef } from 'react';

interface PlatformChartProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  type?: 'bar' | 'line' | 'pie';
}

export default function PlatformChart({ title, data, type = 'bar' }: PlatformChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const cw = w - padding.left - padding.right;
    const ch = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data.map((d) => d.value), 1);
    const barWidth = cw / data.length * 0.6;
    const spacing = cw / data.length;

    if (type === 'bar') {
      data.forEach((d, i) => {
        const x = padding.left + i * spacing + (spacing - barWidth) / 2;
        const barH = (d.value / max) * ch;
        const y = padding.top + ch - barH;

        ctx.fillStyle = d.color || '#3b82f6';
        ctx.fillRect(x, y, barWidth, barH);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, h - 10);
      });

      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + ch);
      ctx.lineTo(padding.left + cw, padding.top + ch);
      ctx.stroke();
    } else if (type === 'pie') {
      const total = data.reduce((s, d) => s + d.value, 0);
      let start = -Math.PI / 2;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(cx, cy) - 20;

      data.forEach((d) => {
        const angle = (d.value / total) * Math.PI * 2;
        ctx.fillStyle = d.color || '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, start + angle);
        ctx.fill();
        start += angle;
      });
    }

    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left, 18);
  }, [data, type, title]);

  return <canvas ref={canvasRef} className="w-full h-64" />;
}
