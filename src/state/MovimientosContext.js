// src/state/MovimientosContext.js
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { isValidISODate } from "../utils/date";

const MovimientosContext = createContext();

// Exportar el Context para uso directo con useContext
export { MovimientosContext };

export function MovimientosProvider({ children }) {
  // movimientos: { id, tipo: 'pago'|'cobro', monto, fechaISO, nota?, estado }
  const [movimientos, setMovimientos] = useState([]);

  // Validar movimiento antes de añadir/actualizar
  const validateMovimiento = (movimiento) => {
    const { tipo, monto, fechaISO, estado } = movimiento;
    
    if (!['pago', 'cobro'].includes(tipo)) {
      throw new Error(`Tipo inválido: ${tipo}. Debe ser 'pago' o 'cobro'`);
    }
    
    const numMonto = Number(monto);
    if (!Number.isFinite(numMonto) || numMonto < 0) {
      throw new Error(`Monto inválido: ${monto}. Debe ser un número >= 0`);
    }
    
    if (!isValidISODate(fechaISO)) {
      throw new Error(`FechaISO inválida: ${fechaISO}. Debe ser ISO 8601 válido`);
    }
    
    if (!['pendiente', 'pronto', 'urgente', 'pagado'].includes(estado)) {
      throw new Error(`Estado inválido: ${estado}. Debe ser 'pendiente', 'pronto', 'urgente' o 'pagado'`);
    }
    
    return true;
  };

  const addMovimiento = ({ tipo, monto, fecha, fechaISO, nota, estado = 'pendiente' }) => {
    try {
      const id = String(Date.now());
      const safeMonto = Number(monto);
      const iso = fechaISO || (fecha ? new Date(fecha).toISOString() : new Date().toISOString());
      const cleanNota = (nota || '').trim();
      
      const item = {
        id,
        tipo: tipo === 'cobro' ? 'cobro' : 'pago',
        monto: safeMonto,
        fechaISO: iso,
        nota: cleanNota || null,
        estado,
      };
      
      validateMovimiento(item);
      setMovimientos(prev => [item, ...prev]);
      return { success: true, id };
    } catch (error) {
      console.warn('Error adding movimiento:', error.message);
      return { success: false, error: error.message };
    }
  };

  const updateMovimiento = (id, updates) => {
    try {
      setMovimientos(prev => prev.map(item => {
        if (item.id !== id) return item;
        
        const updated = { ...item, ...updates };
        validateMovimiento(updated);
        return updated;
      }));
      return { success: true };
    } catch (error) {
      console.warn('Error updating movimiento:', error.message);
      return { success: false, error: error.message };
    }
  };

  const clearAll = () => setMovimientos([]);
  const removeById = (id) => setMovimientos(prev => prev.filter(i => i.id !== id));

  const getMovimientosBetween = (desde, hasta) => {
    const d0 = desde ? new Date(desde).getTime() : -Infinity;
    const d1 = hasta ? new Date(hasta).getTime() : Infinity;
    return movimientos
      .filter(m => {
        const t = new Date(m.fechaISO).getTime();
        return t >= d0 && t <= d1;
      })
      .sort((a,b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  };

  // Resumen por estados para el almanaque
  const resumenEstados = useMemo(() => {
    const total = movimientos.reduce((sum, m) => sum + (m.monto || 0), 0);
    const pagado = movimientos
      .filter(m => m.estado === 'pagado')
      .reduce((sum, m) => sum + (m.monto || 0), 0);
    const falta = total - pagado;
    
    return { total, pagado, falta };
  }, [movimientos]);

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

  const removeMovimiento = (id) => {
    try {
      setMovimientos(prev => prev.filter(m => m.id !== id));
      return { success: true };
    } catch (error) {
      console.warn('Error removing movimiento:', error.message);
      return { success: false, error: error.message };
    }
  };

  return (
    <MovimientosContext.Provider
      value={{
        movimientos, addMovimiento, updateMovimiento, removeMovimiento, clearAll, removeById, 
        resumen, resumenEstados, getMovimientosBetween, getResumen,
        remindersById, setReminderFor, clearReminderFor
      }}
    >
      {children}
    </MovimientosContext.Provider>
  );
}

export const useMovimientos = () => useContext(MovimientosContext);
