'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

// Asegúrate de que estas variables de entorno estén en tu archivo .env.local
// NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patrocinador = {
  id: string;
  nombre: string;
  mensaje_texto: string | null;
  activo: boolean;
  created_at: string;
};

export default function PatrocinadoresAdminPage() {
  const [patrocinadores, setPatrocinadores] = useState<Patrocinador[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    id: '',
    nombre: '',
    mensaje_texto: '',
    activo: true,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPatrocinadores();
  }, []);

  const fetchPatrocinadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patrocinadores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar patrocinadores:', error);
      alert('Error al cargar patrocinadores. Revisa la consola.');
    } else {
      setPatrocinadores(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' && e.target instanceof HTMLInputElement ? e.target.checked : value,
    }));
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormState({ id: '', nombre: '', mensaje_texto: '', activo: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState.nombre.trim()) {
      alert('El nombre del patrocinador es obligatorio.');
      return;
    }

    const { id, ...dataToSubmit } = formState;

    let error;
    if (isEditing) {
      // Actualizar
      ({ error } = await supabase
        .from('patrocinadores')
        .update(dataToSubmit)
        .eq('id', id));
    } else {
      // Crear
      ({ error } = await supabase.from('patrocinadores').insert(dataToSubmit));
    }

    if (error) {
      console.error('Error guardando patrocinador:', error);
      alert(`Error al guardar: ${error.message}`);
    } else {
      resetForm();
      await fetchPatrocinadores();
    }
  };

  const handleEdit = (p: Patrocinador) => {
    setIsEditing(true);
    setFormState({
      id: p.id,
      nombre: p.nombre,
      mensaje_texto: p.mensaje_texto || '',
      activo: p.activo,
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este patrocinador?')) {
      const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
      if (error) {
        alert(`Error al eliminar: ${error.message}`);
      } else {
        await fetchPatrocinadores();
      }
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Panel de Patrocinadores</h1>
        <p>Crea, edita y administra los patrocinadores que aparecen en el bot.</p>
      </header>

      <div style={styles.formContainer}>
        <h2>{isEditing ? 'Editar Patrocinador' : 'Nuevo Patrocinador'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label htmlFor="nombre">Nombre del Patrocinador</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formState.nombre}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label htmlFor="mensaje_texto">Mensaje para Alertas (opcional)</label>
            <textarea
              id="mensaje_texto"
              name="mensaje_texto"
              value={formState.mensaje_texto}
              onChange={handleInputChange}
              rows={3}
              style={styles.textarea}
              placeholder="Ej: Patrocinado por Coca-Cola"
            />
             <small>Este texto se añadirá al final de las alertas de partidos.</small>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="activo"
                checked={formState.activo}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Activo
            </label>
            <small>Solo los patrocinadores activos se mostrarán en el bot.</small>
          </div>
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary}>
              {isEditing ? 'Actualizar' : 'Guardar Patrocinador'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} style={styles.buttonSecondary}>
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.listContainer}>
        <h2>Patrocinadores Existentes</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Mensaje</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patrocinadores.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                    No hay patrocinadores registrados.
                  </td>
                </tr>
              ) : (
                patrocinadores.map(p => (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.nombre}</td>
                    <td style={styles.td}>{p.mensaje_texto || '-'}</td>
                    <td style={styles.td}>
                      <span style={p.activo ? styles.statusActive : styles.statusInactive}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(p)} style={styles.actionButton}>Editar</button>
                      <button onClick={() => handleDelete(p.id)} style={{...styles.actionButton, ...styles.deleteButton}}>Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Estilos básicos para el panel de administración
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'sans-serif',
    maxWidth: '900px',
    margin: '40px auto',
    padding: '20px',
    color: '#333',
  },
  header: {
    borderBottom: '1px solid #eee',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  formContainer: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '40px',
  },
  fieldGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  buttonGroup: {
    marginTop: '20px',
  },
  buttonPrimary: {
    background: '#006847',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  buttonSecondary: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  listContainer: {},
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    background: '#f2f2f2',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
  },
  statusActive: {
    color: 'green',
    fontWeight: 'bold',
  },
  statusInactive: {
    color: 'red',
  },
  actionButton: {
    marginRight: '5px',
    padding: '5px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#fff'
  },
  deleteButton: {
      color: '#CE1126',
      borderColor: '#CE1126'
  }
};
