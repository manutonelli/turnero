"use client";

import { useEffect, useMemo, useState } from "react";

interface TurnoPublico {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombreCliente: string;
  telefono: string;
  email: string;
  estado: "CONFIRMADO" | "CANCELADO";
  notas: string;
}

interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

function formatearFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(d);
}

export default function TurnoPage({ params }: { params: { token: string } }) {
  const [turno, setTurno] = useState<TurnoPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [reprogramando, setReprogramando] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, Slot[]> | null>(null);
  const [fechaNueva, setFechaNueva] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function cargarTurno() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/turnos/${params.token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se encontro el turno");
        return;
      }
      setTurno(json.turno);
    } catch {
      setError("No se pudo cargar el turno");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTurno();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  async function iniciarReprogramacion() {
    setReprogramando(true);
    setError(null);
    try {
      const res = await fetch("/api/availability");
      const json = await res.json();
      setDisponibilidad(json.disponibilidad);
      const primerDia = Object.entries(json.disponibilidad).find(
        ([, slots]) => (slots as Slot[]).length > 0
      );
      if (primerDia) setFechaNueva(primerDia[0]);
    } catch {
      setError("No se pudo cargar la disponibilidad");
    }
  }

  async function reprogramar(slot: Slot) {
    setProcesando(true);
    setError(null);
    try {
      const res = await fetch(`/api/turnos/${params.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: slot.fecha, horaInicio: slot.horaInicio }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo reprogramar");
        return;
      }
      setMensaje("Tu turno fue reprogramado con exito.");
      setReprogramando(false);
      await cargarTurno();
    } catch {
      setError("No se pudo reprogramar el turno");
    } finally {
      setProcesando(false);
    }
  }

  async function cancelar() {
    if (!confirm("¿Seguro que queres cancelar este turno?")) return;
    setProcesando(true);
    setError(null);
    try {
      const res = await fetch(`/api/turnos/${params.token}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo cancelar");
        return;
      }
      setMensaje("Tu turno fue cancelado.");
      await cargarTurno();
    } catch {
      setError("No se pudo cancelar el turno");
    } finally {
      setProcesando(false);
    }
  }

  const fechas = useMemo(
    () => (disponibilidad ? Object.keys(disponibilidad).sort() : []),
    [disponibilidad]
  );
  const slotsDelDia = useMemo(
    () => (disponibilidad && fechaNueva ? disponibilidad[fechaNueva] || [] : []),
    [disponibilidad, fechaNueva]
  );

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <a href="/" className="text-brand-600 text-sm mb-4 inline-block">
          ← Volver al inicio
        </a>

        {cargando && <p className="text-slate-500">Cargando...</p>}
        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            {mensaje}
          </p>
        )}

        {!cargando && turno && (
          <div>
            <h1 className="text-xl font-bold mb-1">Tu turno</h1>
            <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
              <p className="capitalize font-medium">{formatearFecha(turno.fecha)}</p>
              <p className="text-slate-600">
                {turno.horaInicio} a {turno.horaFin} hs
              </p>
              <p className="text-sm text-slate-500 mt-2">{turno.nombreCliente}</p>
              <p
                className={`inline-block mt-3 text-xs font-medium rounded-full px-2 py-1 ${
                  turno.estado === "CONFIRMADO"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {turno.estado === "CONFIRMADO" ? "Confirmado" : "Cancelado"}
              </p>
            </div>

            {turno.estado === "CONFIRMADO" && !reprogramando && (
              <div className="flex gap-2">
                <button
                  onClick={iniciarReprogramacion}
                  disabled={procesando}
                  className="flex-1 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 py-2.5 font-medium"
                >
                  Reprogramar
                </button>
                <button
                  onClick={cancelar}
                  disabled={procesando}
                  className="flex-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 py-2.5 font-medium"
                >
                  Cancelar turno
                </button>
              </div>
            )}

            {reprogramando && (
              <section className="mt-4">
                <button
                  className="text-brand-600 text-sm mb-3"
                  onClick={() => setReprogramando(false)}
                >
                  ← Cancelar reprogramacion
                </button>
                <h2 className="font-semibold mb-3">Elegi un nuevo dia</h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {fechas.map((fecha) => {
                    const disponibles = disponibilidad?.[fecha].length || 0;
                    return (
                      <button
                        key={fecha}
                        disabled={disponibles === 0}
                        onClick={() => setFechaNueva(fecha)}
                        className={`rounded-lg border px-2 py-2 text-sm capitalize ${
                          disponibles === 0
                            ? "border-slate-100 text-slate-300 cursor-not-allowed"
                            : fecha === fechaNueva
                            ? "border-brand-600 bg-brand-50"
                            : "border-brand-200 hover:bg-brand-50"
                        }`}
                      >
                        {new Intl.DateTimeFormat("es-AR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(`${fecha}T00:00:00`))}
                      </button>
                    );
                  })}
                </div>
                {fechaNueva && (
                  <>
                    <h2 className="font-semibold mb-3">Elegi un horario</h2>
                    <div className="grid grid-cols-4 gap-2">
                      {slotsDelDia.length === 0 && (
                        <p className="text-slate-500 col-span-4">No quedan horarios ese dia.</p>
                      )}
                      {slotsDelDia.map((slot) => (
                        <button
                          key={slot.horaInicio}
                          disabled={procesando}
                          onClick={() => reprogramar(slot)}
                          className="rounded-lg border border-brand-200 hover:bg-brand-50 px-2 py-2 text-sm"
                        >
                          {slot.horaInicio}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
