// src/state/MovimientosContext.js
import { createContext, useContext, useMemo, useState, useEffect } from "react";

const MovimientosContext = createContext();

// Exportar el Context para uso directo con useContext
export { MovimientosContext };

export function MovimientosProvider({ children }) {
  // movimientos: { id, tipo: 'pago'|'cobro', nota, monto, fecha }
  const [movimientos, setMovimientos] = useState([]);

  // Sin datos mock: iniciar vacío; Home debe mostrar 0s

  const addMovimiento = ({ tipo, monto, fecha, nota }) => {
    const id = String(Date.now());
    const nMonto = Number(monto);
    const safeMonto = Number.isFinite(nMonto) ? nMonto : 0;
    const iso = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
    const cleanNota = (nota || '').trim();
    const item = {
      id,
      tipo: tipo === 'cobro' ? 'cobro' : 'pago',
      monto: safeMonto,
      fecha: iso,
      nota: cleanNota || null,
    };
    setMovimientos(prev => [item, ...prev]);
  };

  const clearAll = () => setMovimientos([]);
  const removeById = (id) => setMovimientos(prev => prev.filter(i => i.id !== id));

  const getMovimientosBetween = (desde, hasta) => {
    const d0 = desde ? new Date(desde).getTime() : -Infinity;
    const d1 = hasta ? new Date(hasta).getTime() : Infinity;
    return movimientos
      .filter(m => {
        const t = new Date(m.fecha).getTime();
        return t >= d0 && t <= d1;
      })
      .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const resumen = useMemo(() => {
    const sum = (tipo) =>
      movimientos.filter(i => i.tipo === tipo).reduce((a, b) => a + Number(b.monto || 0), 0);
    return { debes: sum("pago"), teDeben: sum("cobro") };
  }, [movimientos]);

  const getResumen = () => {
    let debes = 0, teDeben = 0;
    for (const m of movimientos) {
      const v = Number(m.monto) || 0;
      if (m.tipo === 'pago') debes += v; else teDeben += v;
    }
    return { debes, teDeben, balance: teDeben - debes };
  };

  // ─── Avisos por movimiento ───
  // { [id]: { from?: { date: Date, time: Date, leadMin: number }, to?: {...} } }
  const [remindersById, setRemindersById] = useState({});

  function setReminderFor(id, edge, { date, time, leadMin }) {
    setRemindersById(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [edge]: { date, time, leadMin },
      },
    }));
  }

  function clearReminderFor(id, edge) {
    setRemindersById(prev => {
      const entry = { ...(prev[id] || {}) };
      delete entry[edge];
      const next = { ...prev, [id]: entry };
      // si quedó vacío, limpiamos la clave
      if (!entry.from && !entry.to) delete next[id];
      return next;
    });
  }

  return (
    <MovimientosContext.Provider
      value={{
        movimientos, addMovimiento, clearAll, removeById, resumen,
        getMovimientosBetween, getResumen,
        removeMovimiento: (id) => {
          setMovimientos(prev => prev.filter(m => m.id !== id));
        },
        remindersById, setReminderFor, clearReminderFor
      }}
    >
      {children}
    </MovimientosContext.Provider>
  );
}

export const useMovimientos = () => useContext(MovimientosContext);
