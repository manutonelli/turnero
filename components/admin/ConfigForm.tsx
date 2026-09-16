"use client";

import { useEffect, useState } from "react";
import type { ConfigNegocio } from "@/lib/types";

export default function ConfigForm() {
  const [config, setConfig] = useState<ConfigNegocio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((json) => setConfig(json.config));
  }, []);

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      setMensaje(res.ok ? "Guardado" : json.error || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!config) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del negocio</label>
        <input
          value={config.nombreNegocio}
          onChange={(e) => setConfig({ ...config, nombreNegocio: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Duracion del turno (min)</label>
          <input
            type="number"
            min={5}
            max={480}
            value={config.duracionTurnoMin}
            onChange={(e) => setConfig({ ...config, duracionTurnoMin: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Zona horaria</label>
          <input
            value={config.timezone}
            onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Anticipacion minima (hs)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={config.anticipacionMinimaHoras}
            onChange={(e) =>
              setConfig({ ...config, anticipacionMinimaHoras: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dias maximos de anticipacion</label>
          <input
            type="number"
            min={1}
            max={365}
            value={config.diasMaxAnticipacion}
            onChange={(e) => setConfig({ ...config, diasMaxAnticipacion: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-4 py-2"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && <span className="text-sm text-slate-500">{mensaje}</span>}
      </div>
    </div>
  );
}
