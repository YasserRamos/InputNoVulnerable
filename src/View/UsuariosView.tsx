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

  /* ==========================
     CARGAR USUARIOS
  ========================== */
  async function cargarUsuarios() {
    try {
      const res = await fetch(`${API}/api/usuarios`);

      if (!res.ok) return;

      const data = await res.json();
      setUsuarios(data);

    } catch {
      console.log("Error de conexión");
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  /* ==========================
     VALIDAR NOMBRE
  ========================== */
  function validarNombre(valor: string): string | null {

    let limpio = valor.trim();

    if (limpio.length === 0) return null;
    if (limpio.length > 25) return null;

    limpio = limpio.replace(/<[^>]*>?/gm, "");

    const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ ]{3,25}$/;

    if (!regex.test(limpio)) return null;

    return limpio;
  }

  /* ==========================
     CREAR / MODIFICAR
  ========================== */
  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    const limpio = validarNombre(nombre);

    if (!limpio) {
      alert("Nombre inválido");
      return;
    }

    try {

      let res;

      if (!editId) {

        res = await fetch(`${API}/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: limpio }),
        });

      } else {

        res = await fetch(`${API}/api/usuarios/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: limpio }),
        });

      }

      if (!res.ok) return;

      limpiar();
      cargarUsuarios();

    } catch {
      console.log("Error de red");
    }
  }

  /* ==========================
     ELIMINAR
  ========================== */
  async function eliminar(id: number) {

    if (!confirm("¿Eliminar usuario?")) return;

    try {

      const res = await fetch(`${API}/api/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) return;

      cargarUsuarios();

    } catch {
      console.log("Error al eliminar");
    }
  }

  /* ==========================
     EDITAR
  ========================== */
  function editar(user: Usuario) {
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

      <div className="w-full max-w-3xl bg-white/95 rounded-3xl shadow-2xl p-8">

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Gestión de Usuarios
          </h1>
        </header>

        <form
          onSubmit={guardar}
          className="bg-slate-50 rounded-2xl p-6 shadow-inner mb-8"
        >
          <div className="flex gap-4">

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del usuario"
              required
              className="flex-1 px-4 py-3 rounded-xl border"
            />

            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              <UserPlus size={18} />
            </button>

          </div>
        </form>

        <div className="space-y-4">

          {usuarios.map((user) => (

            <div
              key={user.pk_idusuario}
              className="bg-white border rounded-xl p-4 flex justify-between"
            >

              <div>
                <p className="font-semibold">{user.nombre}</p>
                <p className="text-sm text-gray-500">
                  ID: #{user.pk_idusuario}
                </p>
              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => editar(user)}
                  className="text-blue-600"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => eliminar(user.pk_idusuario)}
                  className="text-red-600"
                >
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