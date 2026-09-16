"use client";

import { useEffect, useState } from "react";

interface Rango {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export default function HorariosEditor() {
  const [rangos, setRangos] = useState<Rango[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/horarios")
      .then((r) => r.json())
      .then((json) => {
        setRangos(
          json.horarios.map((h: Rango) => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            activo: h.activo,
          }))
        );
      })
      .finally(() => setCargando(false));
  }, []);

  function agregarRango(dia: number) {
    setRangos([...rangos, { diaSemana: dia, horaInicio: "09:00", horaFin: "18:00", activo: true }]);
  }

  function actualizarRango(index: number, cambios: Partial<Rango>) {
    setRangos(rangos.map((r, i) => (i === index ? { ...r, ...cambios } : r)));
  }

  function eliminarRango(index: number) {
    setRangos(rangos.filter((_, i) => i !== index));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/horarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios: rangos }),
      });
      const json = await res.json();
      setMensaje(res.ok ? "Guardado" : json.error || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
      <p className="text-sm text-slate-500 mb-4">
        Defini los bloques horarios recurrentes de cada dia de la semana. Podes agregar varios
        bloques por dia (por ejemplo, manana y tarde).
      </p>
      <div className="space-y-4">
        {DIAS.map((nombreDia, dia) => {
          const rangosDelDia = rangos
            .map((r, i) => ({ ...r, index: i }))
            .filter((r) => r.diaSemana === dia);
          return (
            <div key={dia} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{nombreDia}</span>
                <button
                  onClick={() => agregarRango(dia)}
                  className="text-brand-600 text-xs font-medium"
                >
                  + Agregar bloque
                </button>
              </div>
              {rangosDelDia.length === 0 && (
                <p className="text-xs text-slate-400">Sin atencion este dia</p>
              )}
              <div className="space-y-2">
                {rangosDelDia.map((r) => (
                  <div key={r.index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={r.horaInicio}
                      onChange={(e) => actualizarRango(r.index, { horaInicio: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <span className="text-slate-400 text-sm">a</span>
                    <input
                      type="time"
                      value={r.horaFin}
                      onChange={(e) => actualizarRango(r.index, { horaFin: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-500 ml-1">
                      <input
                        type="checkbox"
                        checked={r.activo}
                        onChange={(e) => actualizarRango(r.index, { activo: e.target.checked })}
                      />
                      Activo
                    </label>
                    <button
                      onClick={() => eliminarRango(r.index)}
                      className="text-red-500 text-xs ml-auto"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100">
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-4 py-2"
        >
          {guardando ? "Guardando..." : "Guardar horarios"}
        </button>
        {mensaje && <span className="text-sm text-slate-500">{mensaje}</span>}
      </div>
    </div>
  );
}
