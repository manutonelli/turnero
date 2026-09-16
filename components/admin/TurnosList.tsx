"use client";

import { useEffect, useState } from "react";
import type { Turno } from "@/lib/types";

interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export default function TurnosList() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reprogramandoId, setReprogramandoId] = useState<string | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, Slot[]> | null>(null);
  const [fechaNueva, setFechaNueva] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/admin/turnos");
    const json = await res.json();
    setTurnos(json.turnos || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cancelar(id: string) {
    if (!confirm("¿Cancelar este turno?")) return;
    await fetch(`/api/admin/turnos/${id}`, { method: "DELETE" });
    await cargar();
  }

  async function abrirReprogramacion(id: string) {
    setReprogramandoId(id);
    setError(null);
    const res = await fetch("/api/availability");
    const json = await res.json();
    setDisponibilidad(json.disponibilidad);
    const primerDia = Object.entries(json.disponibilidad).find(
      ([, slots]) => (slots as Slot[]).length > 0
    );
    setFechaNueva(primerDia ? primerDia[0] : null);
  }

  async function confirmarReprogramacion(id: string, slot: Slot) {
    setError(null);
    const res = await fetch(`/api/admin/turnos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: slot.fecha, horaInicio: slot.horaInicio }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo reprogramar");
      return;
    }
    setReprogramandoId(null);
    await cargar();
  }

  if (cargando) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {turnos.length === 0 ? (
        <p className="text-slate-400 text-sm">No hay turnos confirmados proximos.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {turnos.map((t) => (
            <li key={t.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {t.fecha} · {t.horaInicio} a {t.horaFin}
                  </p>
                  <p className="text-sm text-slate-600">{t.nombreCliente}</p>
                  <p className="text-xs text-slate-400">
                    {t.telefono}
                    {t.email && ` · ${t.email}`}
                  </p>
                  {t.notas && <p className="text-xs text-slate-400 italic">{t.notas}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => abrirReprogramacion(t.id)}
                    className="text-brand-600 text-xs font-medium"
                  >
                    Reprogramar
                  </button>
                  <button onClick={() => cancelar(t.id)} className="text-red-500 text-xs font-medium">
                    Cancelar
                  </button>
                </div>
              </div>

              {reprogramandoId === t.id && disponibilidad && (
                <div className="mt-3 bg-slate-50 rounded-lg p-3">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.keys(disponibilidad)
                      .sort()
                      .map((fecha) => (
                        <button
                          key={fecha}
                          disabled={disponibilidad[fecha].length === 0}
                          onClick={() => setFechaNueva(fecha)}
                          className={`text-xs rounded-full px-2 py-1 border ${
                            disponibilidad[fecha].length === 0
                              ? "border-slate-100 text-slate-300"
                              : fecha === fechaNueva
                              ? "border-brand-600 bg-brand-100"
                              : "border-brand-200"
                          }`}
                        >
                          {fecha}
                        </button>
                      ))}
                  </div>
                  {fechaNueva && (
                    <div className="flex flex-wrap gap-1.5">
                      {(disponibilidad[fechaNueva] || []).map((slot) => (
                        <button
                          key={slot.horaInicio}
                          onClick={() => confirmarReprogramacion(t.id, slot)}
                          className="text-xs rounded-full px-2 py-1 border border-brand-200 hover:bg-brand-50"
                        >
                          {slot.horaInicio}
                        </button>
                      ))}
                      {(disponibilidad[fechaNueva] || []).length === 0 && (
                        <span className="text-xs text-slate-400">Sin horarios ese dia</span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setReprogramandoId(null)}
                    className="text-xs text-slate-400 mt-2"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
