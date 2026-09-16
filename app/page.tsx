"use client";

import { useEffect, useMemo, useState } from "react";

interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

interface DisponibilidadResponse {
  config: { nombreNegocio: string; duracionTurnoMin: number; timezone: string };
  disponibilidad: Record<string, Slot[]>;
}

type Paso = "fecha" | "hora" | "datos" | "confirmado";

function formatearFechaCorta(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`);
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

export default function HomePage() {
  const [paso, setPaso] = useState<Paso>("fecha");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DisponibilidadResponse | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tokenCreado, setTokenCreado] = useState<string | null>(null);

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    fetch("/api/availability")
      .then((r) => r.json())
      .then((json: DisponibilidadResponse) => {
        if (cancelado) return;
        setData(json);
        const primerDiaConTurnos = Object.entries(json.disponibilidad).find(
          ([, slots]) => slots.length > 0
        );
        if (primerDiaConTurnos) setFechaSeleccionada(primerDiaConTurnos[0]);
      })
      .catch(() => !cancelado && setError("No se pudo cargar la disponibilidad"))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, []);

  const fechas = useMemo(() => (data ? Object.keys(data.disponibilidad).sort() : []), [data]);
  const slotsDelDia = useMemo(
    () => (data && fechaSeleccionada ? data.disponibilidad[fechaSeleccionada] || [] : []),
    [data, fechaSeleccionada]
  );

  async function confirmarReserva() {
    if (!slotSeleccionado) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: slotSeleccionado.fecha,
          horaInicio: slotSeleccionado.horaInicio,
          nombreCliente,
          telefono,
          email,
          notas,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo reservar el turno");
        setEnviando(false);
        return;
      }
      setTokenCreado(json.token);
      setPaso("confirmado");
    } catch {
      setError("No se pudo reservar el turno. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const nombreNegocio = data?.config.nombreNegocio || "Turnero";
  const linkTurno = tokenCreado ? `${typeof window !== "undefined" ? window.location.origin : ""}/turno/${tokenCreado}` : "";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-brand-800 mb-1">{nombreNegocio}</h1>
        <p className="text-slate-500 mb-6">Reserva tu turno online en simples pasos.</p>

        {cargando && <p className="text-slate-500">Cargando disponibilidad...</p>}

        {!cargando && error && paso !== "confirmado" && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
        )}

        {!cargando && data && paso === "fecha" && (
          <section>
            <h2 className="font-semibold mb-3">1. Elegi un dia</h2>
            {fechas.every((f) => data.disponibilidad[f].length === 0) && (
              <p className="text-slate-500">No hay turnos disponibles por el momento.</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {fechas.map((fecha) => {
                const disponibles = data.disponibilidad[fecha].length;
                return (
                  <button
                    key={fecha}
                    disabled={disponibles === 0}
                    onClick={() => {
                      setFechaSeleccionada(fecha);
                      setPaso("hora");
                    }}
                    className={`rounded-lg border px-2 py-3 text-sm capitalize transition ${
                      disponibles === 0
                        ? "border-slate-100 text-slate-300 cursor-not-allowed"
                        : "border-brand-200 hover:bg-brand-50 text-slate-700"
                    }`}
                  >
                    {formatearFechaCorta(fecha)}
                    <span className="block text-xs text-slate-400">
                      {disponibles === 0 ? "sin turnos" : `${disponibles} libres`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!cargando && data && paso === "hora" && fechaSeleccionada && (
          <section>
            <button className="text-brand-600 text-sm mb-3" onClick={() => setPaso("fecha")}>
              ← Elegir otro dia
            </button>
            <h2 className="font-semibold mb-3 capitalize">
              2. Elegi un horario - {formatearFechaCorta(fechaSeleccionada)}
            </h2>
            {slotsDelDia.length === 0 ? (
              <p className="text-slate-500">No quedan horarios libres ese dia.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slotsDelDia.map((slot) => (
                  <button
                    key={slot.horaInicio}
                    onClick={() => {
                      setSlotSeleccionado(slot);
                      setPaso("datos");
                    }}
                    className="rounded-lg border border-brand-200 hover:bg-brand-50 px-2 py-2 text-sm text-slate-700"
                  >
                    {slot.horaInicio}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {paso === "datos" && slotSeleccionado && (
          <section>
            <button className="text-brand-600 text-sm mb-3" onClick={() => setPaso("hora")}>
              ← Elegir otro horario
            </button>
            <h2 className="font-semibold mb-1">3. Tus datos</h2>
            <p className="text-sm text-slate-500 mb-4 capitalize">
              {formatearFechaCorta(slotSeleccionado.fecha)} a las {slotSeleccionado.horaInicio} hs
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                confirmarReserva();
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1">Nombre y apellido *</label>
                <input
                  required
                  minLength={2}
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefono *</label>
                <input
                  required
                  minLength={6}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={2}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5"
              >
                {enviando ? "Reservando..." : "Confirmar turno"}
              </button>
            </form>
          </section>
        )}

        {paso === "confirmado" && slotSeleccionado && (
          <section className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h2 className="font-semibold text-lg mb-1">Turno confirmado</h2>
            <p className="text-slate-500 mb-4 capitalize">
              {formatearFechaCorta(slotSeleccionado.fecha)} a las {slotSeleccionado.horaInicio} hs
            </p>
            <p className="text-sm text-slate-600 mb-2">
              Guarda este link para reprogramar o cancelar tu turno cuando quieras:
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={linkTurno}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => navigator.clipboard.writeText(linkTurno)}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3"
              >
                Copiar
              </button>
            </div>
            <a
              href={`/turno/${tokenCreado}`}
              className="inline-block mt-5 text-brand-600 text-sm underline"
            >
              Ver mi turno
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
