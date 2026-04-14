'use client'
import { useState } from 'react'
import { read, utils } from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  businessId: string
  updatedAt?: string | null
  totalProductos?: number | null
}

export default function UploadCatalogo({ businessId, updatedAt, totalProductos }: Props) {
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle')
  const [info, setInfo] = useState({
    fecha: updatedAt ?? null,
    total: totalProductos ?? null,
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEstado('cargando')

    try {
      const buffer = await file.arrayBuffer()
      const workbook = read(buffer)

      // Usa la hoja "Catalogo" si existe, si no la primera
      const sheetName = workbook.SheetNames.includes('Catalogo')
        ? 'Catalogo'
        : workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const productos = utils.sheet_to_json(sheet)

      if (!productos.length) {
        setEstado('error')
        return
      }

      const ahora = new Date().toISOString()
      const supabase = createClient()
      const { error } = await supabase
        .from('businesses')
        .update({ catalogo: productos, catalogo_updated_at: ahora })
        .eq('id', businessId)

      if (error) throw error

      setInfo({ fecha: ahora, total: productos.length })
      setEstado('ok')
    } catch {
      setEstado('error')
    }

    // Reset input para permitir subir el mismo archivo de nuevo
    e.target.value = ''
  }

  const fechaLegible = info.fecha
    ? new Intl.DateTimeFormat('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(info.fecha))
    : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-opacity
          ${estado === 'cargando'
            ? 'bg-slate-200 text-slate-400 pointer-events-none'
            : 'bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white hover:opacity-90'}
        `}>
          <UploadCloud className="w-4 h-4" />
          {estado === 'cargando' ? 'Procesando...' : 'Subir catálogo Excel'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
            disabled={estado === 'cargando'}
          />
        </label>

        {estado === 'ok' && (
          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Catálogo actualizado
          </span>
        )}
        {estado === 'error' && (
          <span className="flex items-center gap-1.5 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            Error al guardar. Verifica el archivo.
          </span>
        )}
      </div>

      {/* Indicador */}
      <p className="text-xs text-slate-400">
        {fechaLegible
          ? `${info.total?.toLocaleString('es-MX')} productos · Actualizado el ${fechaLegible}`
          : 'Sin catálogo cargado — el bot usará solo el texto de Servicios y productos.'}
      </p>
    </div>
  )
}