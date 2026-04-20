"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

export default function UsersFilters({
  countries,
}: {
  countries: [string, number][];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/god/users?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Filter className="w-4 h-4" />Filtros:
        </span>

        <select
          defaultValue={searchParams.get("plan") ?? ""}
          onChange={(e) => update("plan", e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-indigo-300 focus:outline-none"
        >
          <option value="">Todos los Planes</option>
          <option value="free">Free</option>
          <option value="premium">PRO</option>
        </select>

        <select
          defaultValue={searchParams.get("country") ?? ""}
          onChange={(e) => update("country", e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-indigo-300 focus:outline-none"
        >
          <option value="">Todos los Países</option>
          {countries.map(([country, count]) => (
            <option key={country} value={country}>
              {country} ({count})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar nombre o teléfono..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-indigo-300 focus:outline-none w-52"
        />

        {(searchParams.get("plan") || searchParams.get("country") || searchParams.get("q")) && (
          <button
            onClick={() => router.push("/god/users")}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
