import { useEffect, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";

interface Usuario {
  pk_idusuario: number;
  nombre: string;
}

const API = import.meta.env.VITE_API_URL;

export default function UsuariosView() {

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);

  /* ==========================
     VERIFICAR PERMISO
  ========================== */
  async function cargarPermiso() {
    try {
      const res = await fetch(`${API}/api/permisos`);
      if (!res.ok) return;

      const data = await res.json();

      if (data.rol === "admin") {
        setEsAdmin(true);
      }
    } catch {}
  }

  /* ==========================
     CARGAR USUARIOS
  ========================== */
  async function cargarUsuarios() {
    try {
      const res = await fetch(`${API}/api/usuarios`);
      if (!res.ok) return;

      const data = await res.json();
      setUsuarios(data);
    } catch {}
  }

  useEffect(() => {
    cargarUsuarios();
    cargarPermiso();
  }, []);

  /* ==========================
     VALIDAR NOMBRE (FRONT)
  ========================== */
  function validarNombre(valor: string): string | null {

    let limpio = valor.trim();

    // Vacío
    if (limpio.length === 0) return null;

    // Máx 25
    if (limpio.length > 25) return null;

    // Quitar HTML
    limpio = limpio.replace(/<[^>]*>?/gm, "");

    // Bloquear palabras peligrosas
    const bloqueadas = [
      "script",
      "select",
      "insert",
      "delete",
      "drop",
      "update",
      "union",
      "javascript:",
      "--",
      "/*",
      "*/",
      "<",
      ">"
    ];

    const lower = limpio.toLowerCase();

    for (const palabra of bloqueadas) {
      if (lower.includes(palabra)) {
        return null;
      }
    }

    // Solo letras, números, espacios
    const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ ]{3,25}$/;

    if (!regex.test(limpio)) return null;

    return limpio;
  }

  /* ==========================
     CREAR / MODIFICAR
  ========================== */
  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    if (!esAdmin) {
      alert("Sistema en modo lectura");
      return;
    }

    const limpio = validarNombre(nombre);

    if (!limpio) {
      alert("Nombre inválido: sin scripts, sin símbolos, máx 25 caracteres");
      return;
    }

    try {

      if (!editId) {
        await fetch(`${API}/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: limpio }),
        });

      } else {

        await fetch(`${API}/api/usuarios/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: limpio }),
        });

      }

      limpiar();
      cargarUsuarios();

    } catch (error) {
      console.error("Error al guardar:", error);
    }
  }

  /* ==========================
     ELIMINAR
  ========================== */
  async function eliminar(id: number) {

    if (!esAdmin) {
      alert("Sistema en modo lectura");
      return;
    }

    if (!confirm("¿Eliminar usuario?")) return;

    try {

      await fetch(`${API}/api/usuarios/${id}`, {
        method: "DELETE",
      });

      cargarUsuarios();

    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }

  /* ==========================
     EDITAR
  ========================== */
  function editar(user: Usuario) {
    if (!esAdmin) return;

    setNombre(user.nombre);
    setEditId(user.pk_idusuario);
  }

  function limpiar() {
    setNombre("");
    setEditId(null);
  }

  /* ==========================
     UI
  ========================== */
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">

      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10">

        {/* HEADER */}
        <header className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-slate-800">
            Gestión de Usuarios
          </h1>

          <p className="text-slate-500 mt-1">
            Panel administrativo
          </p>

          {!esAdmin && (
            <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-medium">
              🔒 Modo lectura activado
            </div>
          )}

        </header>

        {/* FORMULARIO */}
        <form
          onSubmit={guardar}
          className="bg-slate-50 rounded-2xl p-6 shadow-inner mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del usuario"
              disabled={!esAdmin}
              required
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-200"
            />

            <button
              type="submit"
              disabled={!esAdmin}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition
                ${
                  esAdmin
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
            >
              <UserPlus size={18} />
              {editId ? "Actualizar" : "Crear"}
            </button>

          </div>
        </form>

        {/* LISTA */}
        <div className="space-y-4">

          {usuarios.length === 0 && (
            <p className="text-center text-slate-400 py-6">
              No hay usuarios registrados
            </p>
          )}

          {usuarios.map((user) => (
            <div
              key={user.pk_idusuario}
              className="group bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition"
            >

              <div>
                <p className="font-semibold text-slate-800">
                  {user.nombre}
                </p>

                <p className="text-sm text-slate-500">
                  ID: #{user.pk_idusuario}
                </p>
              </div>

              {esAdmin && (
                <div className="flex gap-3">

                  <button
                    onClick={() => editar(user)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => eliminar(user.pk_idusuario)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              )}

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
