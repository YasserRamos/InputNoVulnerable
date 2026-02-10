import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Usuario {
  pk_idusuario: number;
  nombre: string;
}

export default function UsuariosView() {

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [esAdmin, setEsAdmin] = useState(false);

  /* ==========================
     VERIFICAR PERMISO
  ========================== */
  async function cargarPermiso() {
    const res = await fetch("/api/permisos");
    const data = await res.json();

    if (data.rol === "admin") {
      setEsAdmin(true);
    }
  }

  /* ==========================
     CARGAR USUARIOS
  ========================== */
  async function cargarUsuarios() {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setUsuarios(data);
  }

  useEffect(() => {
    cargarUsuarios();
    cargarPermiso();
  }, []);

  /* ==========================
     CREAR / MODIFICAR
  ========================== */
  async function guardar(e: any) {
    e.preventDefault();

    if (!esAdmin) {
      alert("Sistema en modo lectura");
      return;
    }

    if (!editId) {
      await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      });
    }

    if (editId) {
      await fetch(`/api/usuarios/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      });
    }

    limpiar();
    cargarUsuarios();
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

    await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
    });

    cargarUsuarios();
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

  return (
    <section className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-2xl font-bold text-center mb-4 text-[#1a202e]">
          CRUD Usuarios
        </h1>

        {!esAdmin && (
          <p className="text-center text-red-600 mb-4 font-semibold">
            🔒 Modo lectura activado
          </p>
        )}

        <form onSubmit={guardar} className="mb-6">

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            disabled={!esAdmin}
            required
            className="w-full border rounded-md px-3 py-2 mb-3 bg-gray-50"
          />

          <button
            type="submit"
            disabled={!esAdmin}
            className={`w-full py-2 rounded-md transition ${
              esAdmin
                ? "bg-[#1253a3] text-white hover:bg-blue-700"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            {editId ? "Modificar" : "Crear"}
          </button>

        </form>

        <div className="space-y-3">

          {usuarios.map((user) => (
            <div
              key={user.pk_idusuario}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
            >
              <p className="font-semibold">{user.nombre}</p>

              {esAdmin && (
                <div className="flex gap-3">
                  <button
                    onClick={() => editar(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => eliminar(user.pk_idusuario)}
                    className="text-red-600 hover:text-red-800"
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
