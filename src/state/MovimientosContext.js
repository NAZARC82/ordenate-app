import { createContext, useContext, useMemo, useState } from "react";

const MovimientosContext = createContext();

export function MovimientosProvider({ children }) {
  // items: { id, tipo: 'pago'|'cobro', concepto, monto, fecha }
  const [items, setItems] = useState([]);

  const addMovimiento = ({ tipo, concepto, monto }) => {
    const v = Number(String(monto).replace(",", "."));
    if (!concepto?.trim() || !isFinite(v) || v <= 0) return false;
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), tipo, concepto: concepto.trim(), monto: v, fecha: new Date().toISOString() }
    ]);
    return true;
  };

  const clearAll = () => setItems([]);
  const removeById = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const resumen = useMemo(() => {
  const sum = (tipo) =>
    items.filter(i => i.tipo === tipo).reduce((a, b) => a + Number(b.monto || 0), 0);

  const debes = sum("pago");
  const teDeben = sum("cobro");
  const balance = teDeben - debes; // positivo si te deben más, negativo si debes más

  return { debes, teDeben, balance };
}, [items]);


  return (
    <MovimientosContext.Provider value={{ items, addMovimiento, clearAll, removeById, resumen }}>
      {children}
    </MovimientosContext.Provider>
  );
}

export const useMovimientos = () => useContext(MovimientosContext);
