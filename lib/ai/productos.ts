type Producto = Record<string, string | number | boolean | null>

export function buscarProductos(catalogo: Producto[] | null, pregunta: string): string {
  if (!catalogo?.length) return ''

  const palabras = pregunta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .split(/\s+/)
    .filter(p => p.length > 2) // ignora palabras muy cortas

  if (!palabras.length) return ''

  const relevantes = catalogo.filter(producto =>
    palabras.some(palabra =>
      Object.values(producto).some(val =>
        String(val ?? '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(palabra)
      )
    )
  )

  if (!relevantes.length) return ''

  const lista = relevantes
    .slice(0, 12) // máx 12 variantes para no inflar tokens
    .map(p => {
      // Arma una línea legible: nombre + variantes + precio
      const partes = [
        p.nombre || p.name,
        p.marca ? `(${p.marca})` : null,
        p.variante_1 || null,
        p.variante_2 || null,
        p.variante_3 || null,
        p.precio ? `$${p.precio}` : null,
        p.precio_oferta ? `Oferta: $${p.precio_oferta}` : null,
        p.disponible === 'no' ? '— Sin stock' : null,
        p.descripcion ? `| ${p.descripcion}` : null,
        p.imagen_url ? `| Imagen: ${p.imagen_url}` : null,
        p.url_producto ? `| Ver: ${p.url_producto}` : null,
        p.notas_bot ? `| Nota: ${p.notas_bot}` : null,
      ].filter(Boolean)

      return `• ${partes.join(' ')}`
    })
    .join('\n')

  return `\n\n📦 PRODUCTOS DEL CATÁLOGO (relacionados con la consulta):\n${lista}`
}