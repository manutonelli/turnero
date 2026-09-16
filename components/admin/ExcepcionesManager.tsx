"use client";

import { useEffect, useState } from "react";
import type { Excepcion, TipoExcepcion } from "@/lib/types";

export default function ExcepcionesManager() {
  const [excepciones, setExcepciones] = useState<Excepcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<TipoExcepcion>("BLOQUEO");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/admin/excepciones");
    const json = await res.json();
    setExcepciones(json.excepciones || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/excepciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, tipo, horaInicio, horaFin, nota }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo agregar");
        return;
      }
      setFecha("");
      setHoraInicio("");
      setHoraFin("");
      setNota("");
      await cargar();
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar(fila: number) {
    await fetch(`/api/admin/excepciones?fila=${fila}`, { method: "DELETE" });
    await cargar();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
      <p className="text-sm text-slate-500 mb-4">
        Usa esto para bloquear un feriado o dia puntual, o para agregar un refuerzo de horario
        fuera de lo habitual.
      </p>
      <form onSubmit={agregar} className="flex flex-wrap items-end gap-2 mb-5">
        <div>
          <label className="block text-xs font-medium mb-1">Fecha</label>
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoExcepcion)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="BLOQUEO">Bloqueo</option>
            <option value="EXTRA">Refuerzo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Desde {tipo === "BLOQUEO" && "(opcional)"}
          </label>
          <input
            type="time"
            required={tipo === "EXTRA"}
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Hasta {tipo === "BLOQUEO" && "(opcional)"}
          </label>
          <input
            type="time"
            required={tipo === "EXTRA"}
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium mb-1">Nota</label>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="ej: Feriado nacional"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5"
        >
          Agregar
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {cargando ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : excepciones.length === 0 ? (
        <p className="text-slate-400 text-sm">No hay excepciones cargadas.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {excepciones.map((exc) => (
            <li key={exc.fila} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">{exc.fecha}</span>{" "}
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ml-1 ${
                    exc.tipo === "BLOQUEO" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {exc.tipo === "BLOQUEO" ? "Bloqueo" : "Refuerzo"}
                </span>{" "}
                <span className="text-slate-500">
                  {exc.horaInicio && exc.horaFin
                    ? `${exc.horaInicio} - ${exc.horaFin}`
                    : "todo el dia"}
                </span>
                {exc.nota && <span className="text-slate-400"> · {exc.nota}</span>}
              </div>
              <button onClick={() => eliminar(exc.fila)} className="text-red-500 text-xs">
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
