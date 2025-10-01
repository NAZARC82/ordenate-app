// src/utils/exporters.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { pdfCSS } from '../pdf/css';

export type Movimiento = {
  id: string
  tipo: 'pago' | 'cobro'
  titulo?: string
  nota?: string
  monto: number
  fechaISO: string
  estado?: 'URGENTE' | 'PENDIENTE' | 'PAGADO' | string
}

const fmtMoney = (n:number) => n.toLocaleString('es-UY',{ style:'currency', currency:'UYU', minimumFractionDigits:0 })
const fmtDate  = (iso:string) => new Date(iso).toLocaleDateString('es-UY')
const signAmt  = (m:number, t:'pago'|'cobro') => (t==='pago' ? `-${fmtMoney(m)}` : `+${fmtMoney(m)}`)

function totals(movs: Movimiento[]){
  let pagos=0,cobros=0; movs.forEach(m=> m.tipo==='pago'? pagos+=m.monto: cobros+=m.monto)
  return { pagos, cobros, balance: cobros-pagos, total: movs.length }
}

function badge(estado?: string){
  if(!estado) return ''
  const s = estado.toUpperCase()
  if(s==='URGENTE')   return `<span class="badge badge-urg">URGENTE</span>`
  if(s==='PENDIENTE') return `<span class="badge badge-pen">PENDIENTE</span>`
  if(s==='PAGADO')    return `<span class="badge badge-ok">PAGADO</span>`
  return estado
}

// 👉 Generación de filas (usa clases para color y badges)
function buildRows(movs: Movimiento[]){
  return movs.map((m,i)=>`
    <tr>
      <td>${fmtDate(m.fechaISO)}</td>
      <td>${m.tipo === 'pago' ? 'Pago' : 'Cobro'}</td>
      <td class="${m.tipo==='pago'?'monto-neg':'monto-pos'}">${signAmt(m.monto, m.tipo)}</td>
      <td>${badge(m.estado)}</td>
      <td>${(m.titulo||'')}${m.nota?` — ${m.nota}`:''}</td>
    </tr>
  `).join('')
}

function buildHTML(movs: Movimiento[], meta: { fechaTitulo: string; hora: string; count: number; rango?: string }){
  const t = totals(movs)
  const resumen = `
    <div class="summary">
      <div class="card"><div class="card-title">💚 Cobros Totales</div><div class="card-value">${fmtMoney(t.cobros)}</div></div>
      <div class="card"><div class="card-title">🪙 Pagos Totales</div><div class="card-value">${fmtMoney(t.pagos)}</div></div>
      <div class="card"><div class="card-title">⚖️ Balance Neto</div><div class="card-value" style="color:${t.balance>=0?'#27AE60':'#E74C3C'}">${fmtMoney(t.balance)}</div></div>
    </div>`

  return `
  <html>
    <head><meta charset="utf-8"/><style>${pdfCSS}</style></head>
    <body>
      <div class="header">
        <h1>Ordénate · Reporte Financiero</h1>
        <div class="meta">📅 ${meta.fechaTitulo} · ⏰ ${meta.hora} · 🧾 ${meta.count} movimiento(s) ${meta.rango?`· 🗂 ${meta.rango}`:''}</div>
      </div>
      <div class="divider"></div>
      ${resumen}
      <table>
        <thead>
          <tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Estado</th><th>Nota</th></tr>
        </thead>
        <tbody>${buildRows(movs)}</tbody>
      </table>
      <div class="footer">Generado por Ordénate App · Tu asistente financiero personal</div>
    </body>
  </html>`
}

export async function exportPDFStyled(movs: Movimiento[], filename: string, meta?: { fechaTitulo?: string; hora?: string; rango?: string }) {
  const now = new Date()
  const html = buildHTML(movs, {
    fechaTitulo: meta?.fechaTitulo ?? now.toLocaleDateString('es-UY', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    hora:        meta?.hora        ?? now.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' }),
    count: movs.length,
    rango: meta?.rango
  })
  const { uri } = await Print.printToFileAsync({ html })
  const dest = FileSystem.cacheDirectory + filename
  await FileSystem.moveAsync({ from: uri, to: dest })
  await Sharing.shareAsync(dest, { mimeType:'application/pdf', UTI:'com.adobe.pdf' })
}

export async function exportCSV(movs: Movimiento[], filename: string) {
  const header = ['Fecha','Tipo','Monto','Estado','Nota']
  const rows = movs.map(m => [
    fmtDate(m.fechaISO),
    m.tipo === 'pago' ? 'Pago' : 'Cobro',
    signAmt(m.monto, m.tipo),
    (m.estado || '').toUpperCase(),
    (m.titulo || '') + (m.nota ? ` — ${m.nota}` : '')
  ])
  const csv = [header, ...rows].map(r => r.map(c => String(c).replace(/[\r\n,]/g,' ')).join(',')).join('\n')
  const uri = FileSystem.cacheDirectory + filename
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 })
  await Sharing.shareAsync(uri, { mimeType:'text/csv', UTI:'public.comma-separated-values-text' })
}