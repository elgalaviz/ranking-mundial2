"use client";

import { useEffect, useState } from "react";

const KICKOFF = new Date("2026-06-11T23:00:00Z"); // 18:00 CDMX = 23:00 UTC

function calcTime() {
  const diff = KICKOFF.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-white font-black text-5xl sm:text-6xl tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function CountdownBanner() {
  const [time, setTime] = useState(calcTime());

  useEffect(() => {
    const id = setInterval(() => setTime(calcTime()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <section className="bg-[#006847] px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Texto izquierda */}
        <div>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
            T-MINUS · INICIO DE TRANSMISIÓN
          </p>
          <p className="text-white font-black text-xl sm:text-2xl uppercase leading-tight">
            El silbato suena el<br />
            11.06.2026 · 18:00 CDMX
          </p>
        </div>

        {/* Números derecha */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Digit value={time.days} label="días" />
          <span className="text-white/40 font-black text-4xl leading-none mb-4">:</span>
          <Digit value={time.hours} label="horas" />
          <span className="text-white/40 font-black text-4xl leading-none mb-4">:</span>
          <Digit value={time.mins} label="min" />
          <span className="text-white/40 font-black text-4xl leading-none mb-4">:</span>
          <Digit value={time.secs} label="seg" />
        </div>

      </div>
    </section>
  );
}
