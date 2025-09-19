// src/state/MovimientosContext.js
import { createContext, useContext, useMemo, useState, useEffect } from "react";

const MovimientosContext = createContext();

// Exportar el Context para uso directo con useContext
export { MovimientosContext };

export function MovimientosProvider({ children }) {
  // items: { id, tipo: 'pago'|'cobro', concepto, monto, fecha }
  const [items, setItems] = useState([]);

  // Sin datos mock: iniciar vacío; Home debe mostrar 0s

  const addMovimiento = ({ tipo, concepto, monto }) => {
    const v = Number(String(monto).replace(",", "."));
    if (!concepto?.trim() || !isFinite(v) || v <= 0) return false;
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        tipo,
        concepto: concepto.trim(),
        monto: v,
        fecha: new Date().toISOString(),
      },
    ]);
    return true;
  };

  const clearAll = () => setItems([]);
  const removeById = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const getMovimientosBetween = (desde, hasta) => {
    const d0 = desde ? new Date(desde).getTime() : -Infinity;
    const d1 = hasta ? new Date(hasta).getTime() : Infinity;
    return items
      .filter(m => {
        const t = new Date(m.fecha).getTime();
        return t >= d0 && t <= d1;
      })
      .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const resumen = useMemo(() => {
    const sum = (tipo) =>
      items.filter(i => i.tipo === tipo).reduce((a, b) => a + Number(b.monto || 0), 0);
    return { debes: sum("pago"), teDeben: sum("cobro") };
  }, [items]);

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
        items, addMovimiento, clearAll, removeById, resumen,
        getMovimientosBetween,
        remindersById, setReminderFor, clearReminderFor
      }}
    >
      {children}
    </MovimientosContext.Provider>
  );
}

export const useMovimientos = () => useContext(MovimientosContext);
