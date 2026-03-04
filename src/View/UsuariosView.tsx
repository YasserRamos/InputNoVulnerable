import { useEffect, useState } from "react";
import { Pencil, Trash2, UserPlus, Loader2, Clock } from "lucide-react";

interface Usuario {
  pk_idusuario: number;
  nombre: string;
}

const API = import.meta.env.VITE_API_URL;

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estado para gestionar la cola de peticiones (Throttling Buffer)
  const [pendientes, setPendientes] = useState(0);

  /* ==========================
      THROTTLE CON COLA (QUEUE)
  ========================== */
  function throttleAsync(fn: (...args: any[]) => Promise<any>, delay: number) {
    let ultimaEjecucion = 0;
    let colaInterna = 0;

    return async (...args: any[]) => {
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - ultimaEjecucion;

      if (tiempoTranscurrido < delay) {
        colaInterna++;
        setPendientes(colaInterna);

        const esperaNecesaria = (colaInterna * delay) - tiempoTranscurrido;
        await new Promise(resolve => setTimeout(resolve, esperaNecesaria));

        colaInterna--;
        setPendientes(colaInterna);
      }

      ultimaEjecucion = Date.now();
      return await fn(...args);
    };
  }

  /* ==========================
      ACCIONES DEL CRUD
  ========================== */
  async function cargarUsuarios() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/usuarios`);
      if (!res.ok) throw new Error("Error en la carga");
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error de conexión", error);
    } finally {
      setLoading(false);
    }
  }

  async function guardarReal(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;

    try {
      setLoading(true);
      const config = {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: limpio }),
      };
      
      const url = editId ? `${API}/api/usuarios/${editId}` : `${API}/api/usuarios`;
      const res = await fetch(url, config);
      
      if (res.ok) {
        setNombre("");
        setEditId(null);
        await cargarUsuarios();
      }
    } catch (error) {
      console.error("Error al guardar", error);
    } finally {
      setLoading(false);
    }
  }

  async function eliminarReal(id: number) {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      setLoading(true);
      await fetch(`${API}/api/usuarios/${id}`, { method: "DELETE" });
      await cargarUsuarios();
    } catch (error) {
      console.error("Error al eliminar", error);
    } finally {
      setLoading(false);
    }
  }

  // Versiones protegidas con Delay de 3 segundos
  const guardar = throttleAsync(guardarReal, 3000);
  const eliminar = throttleAsync(eliminarReal, 3000);

  useEffect(() => { cargarUsuarios(); }, []);

  return (
    <section className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8">
        
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500">Auditoría de Control de Flujo (Rate Limiting)</p>
        </header>

        {/* RECUADRO DE PETICIONES PENDIENTES */}
        {pendientes > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center animate-pulse">
            <div className="flex items-center gap-3 text-blue-700">
              <Clock className="animate-spin-slow" size={24} />
              <div>
                <p className="font-bold">Cola de Procesamiento Activa</p>
                <p className="text-sm">Ejecutando ráfaga de peticiones serializadas</p>
              </div>
            </div>
            <div className="text-2xl font-mono font-black bg-blue-600 text-white px-4 py-1 rounded-lg">
              {pendientes}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); guardar(); }}
          className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100"
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del usuario"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading && pendientes === 0}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-all"
            >
              {loading && pendientes === 0 ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
              <span>{editId ? "Actualizar" : "Guardar"}</span>
            </button>
          </div>
        </form>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {usuarios.map((user) => (
            <div key={user.pk_idusuario} className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-slate-700">{user.nombre}</p>
                <p className="text-xs text-slate-400 font-mono">ID: {user.pk_idusuario}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setNombre(user.nombre); setEditId(user.pk_idusuario); }} className="p-2 text-slate-400 hover:text-blue-600">
                  <Pencil size={18} />
                </button>
                <button onClick={() => eliminar(user.pk_idusuario)} className="p-2 text-slate-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}