import { useEffect, useState, useRef, useCallback } from "react";
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
  const [pendientes, setPendientes] = useState(0);

  const ultimaEjecucion = useRef(0);
  const colaInterna = useRef(0);
  // Referencia para capturar el valor real de 'nombre' sin que useCallback lo rompa
  const nombreRef = useRef(""); 

  useEffect(() => {
    nombreRef.current = nombre;
  }, [nombre]);

  /* ==========================
      THROTTLE CON COLA (CORREGIDO)
  ========================== */
  const throttleAsync = (fn: (nombreCap: string, idCap: number | null) => Promise<any>, delay: number) => {
    return async () => {
      // Capturamos los valores justo al hacer click para que no se pierdan
      const nombreAProcesar = nombreRef.current;
      const idAProcesar = editId;

      colaInterna.current++;
      setPendientes(colaInterna.current);

      const ahora = Date.now();
      const tiempoTranscurrido = ahora - ultimaEjecucion.current;
      
      const esperaNecesaria = Math.max(0, (colaInterna.current * delay) - tiempoTranscurrido);
      
      await new Promise(resolve => setTimeout(resolve, esperaNecesaria));

      try {
        await fn(nombreAProcesar, idAProcesar);
      } finally {
        ultimaEjecucion.current = Date.now();
        colaInterna.current--;
        setPendientes(colaInterna.current);
      }
    };
  };

  /* ==========================
      ACCIONES DEL CRUD
  ========================== */
  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API}/api/usuarios`);
      const data = await res.json();
      setUsuarios(data);
    } catch (error) { console.error("Error", error); }
  };

  const guardarReal = async (nombreCap: string, idCap: number | null) => {
    const limpio = nombreCap.trim();
    if (!limpio) return;

    try {
      setLoading(true);
      const res = await fetch(idCap ? `${API}/api/usuarios/${idCap}` : `${API}/api/usuarios`, {
        method: idCap ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: limpio }),
      });
      
      if (res.ok) {
        setNombre("");
        setEditId(null);
        await cargarUsuarios();
      }
    } finally {
      setLoading(false);
    }
  };

  const eliminarReal = async (id: number) => {
    try {
      setLoading(true);
      await fetch(`${API}/api/usuarios/${id}`, { method: "DELETE" });
      await cargarUsuarios();
    } finally {
      setLoading(false);
    }
  };

  // Cambiamos la dependencia a [] para que 'guardar' sea una referencia fija y no se rompa la cola
  const guardar = useCallback(throttleAsync(guardarReal, 3000), []);
  const eliminar = useCallback(async (id: number) => {
    // Para eliminar usamos una lógica simplificada de cola
    colaInterna.current++;
    setPendientes(colaInterna.current);
    await new Promise(r => setTimeout(r, colaInterna.current * 3000));
    await eliminarReal(id);
    colaInterna.current--;
    setPendientes(colaInterna.current);
  }, []);

  useEffect(() => { cargarUsuarios(); }, []);

  return (
    <section className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8">
        
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 font-medium">Control de Flujo: Throttling con Cola</p>
        </header>

        {pendientes > 0 && (
          <div className="mb-6 p-5 bg-blue-600 rounded-2xl flex justify-between items-center shadow-lg shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-blue-400/30 p-2 rounded-lg">
                <Clock className="animate-spin" style={{ animationDuration: '3s' }} size={28} />
              </div>
              <div>
                <p className="font-bold text-lg">Cola de Procesamiento</p>
                <p className="text-blue-100 text-sm italic">Ejecutando ráfaga (1 cada 3s)</p>
              </div>
            </div>
            <div className="text-4xl font-mono font-black bg-white text-blue-600 px-6 py-2 rounded-xl border-b-4 border-blue-800">
              {pendientes}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); guardar(); }}
          className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200"
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del usuario"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold flex items-center gap-2"
            >
              {loading && pendientes === 0 ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
              <span>{editId ? "Actualizar" : "Guardar"}</span>
            </button>
          </div>
        </form>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {usuarios.map((user) => (
            <div key={user.pk_idusuario} className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <span className="font-bold text-slate-700">{user.nombre}</span>
              <div className="flex gap-2">
                <button onClick={() => { setNombre(user.nombre); setEditId(user.pk_idusuario); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Pencil size={18} />
                </button>
                <button onClick={() => eliminar(user.pk_idusuario)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
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