"use client";

import { useState } from "react";

type Posicion = {
  userId: string;
  nombre: string;
  phone: string;
  puntos: number;
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3);
  return `***${last3}`;
}

export default function PosicionesTabla({
  posiciones,
  miUserId,
}: {
  posiciones: Posicion[];
  miUserId: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = posiciones.filter((p) => {
    if (!search) return true;
    const digits = search.replace(/\D/g, "");
    return p.phone.endsWith(digits);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="tel"
          placeholder="Busca por últimos dígitos de tu número..."
          value={search}
          onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#006847] focus:outline-none focus:ring-1 focus:ring-[#006847]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Participante</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  No se encontró ese número.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => {
                const esMio = p.userId === miUserId;
                const pos = posiciones.indexOf(p) + 1;
                return (
                  <tr
                    key={p.userId}
                    className={`border-b border-gray-100 last:border-0 ${
                      esMio ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        pos === 1 ? "text-yellow-500" :
                        pos === 2 ? "text-gray-400" :
                        pos === 3 ? "text-amber-600" :
                        "text-gray-400"
                      }`}>
                        {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${esMio ? "text-red-700" : "text-gray-800"}`}>
                          {maskPhone(p.phone)}
                        </span>
                        {esMio && (
                          <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-base ${esMio ? "text-red-700" : "text-gray-900"}`}>
                        {p.puntos}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">pts</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center text-gray-400">
        Solo se muestran los últimos 3 dígitos del número por privacidad
      </p>
    </div>
  );
}
