"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfigForm from "@/components/admin/ConfigForm";
import HorariosEditor from "@/components/admin/HorariosEditor";
import ExcepcionesManager from "@/components/admin/ExcepcionesManager";
import TurnosList from "@/components/admin/TurnosList";

type Tab = "turnos" | "horarios" | "excepciones" | "config";

const TABS: { id: Tab; label: string }[] = [
  { id: "turnos", label: "Turnos" },
  { id: "horarios", label: "Horarios" },
  { id: "excepciones", label: "Excepciones" },
  { id: "config", label: "Negocio" },
];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("turnos");

  async function cerrarSesion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Panel de administracion</h1>
          <button onClick={cerrarSesion} className="text-sm text-slate-500 hover:text-slate-700">
            Cerrar sesion
          </button>
        </div>

        <div className="flex gap-1 mb-5 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "turnos" && <TurnosList />}
        {tab === "horarios" && <HorariosEditor />}
        {tab === "excepciones" && <ExcepcionesManager />}
        {tab === "config" && <ConfigForm />}
      </div>
    </main>
  );
}
