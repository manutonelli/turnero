"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo iniciar sesion");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesion");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-xl font-bold mb-1">Panel de administracion</h1>
        <p className="text-sm text-slate-500 mb-4">Ingresa la contrasena para gestionar los turnos.</p>
        <label className="block text-sm font-medium mb-1">Contrasena</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3"
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5"
        >
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
