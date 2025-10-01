import { THEME as T } from './theme'

export const pdfCSS = `
:root{
  --violet-start:${T.colors.gradientVioletStart};
  --violet-end:${T.colors.gradientVioletEnd};
  --blue-start:${T.colors.headerBlueStart};
  --blue-end:${T.colors.headerBlueEnd};
  --text:${T.colors.text};
  --muted:${T.colors.muted};
  --divider:${T.colors.divider};
  --row-alt:${T.colors.rowAlt};
  --pago:${T.colors.pago};
  --cobro:${T.colors.cobro};
  --urg-bg:${T.colors.badge.urgenteBg}; --urg-tx:${T.colors.badge.urgenteTx};
  --pen-bg:${T.colors.badge.pendienteBg}; --pen-tx:${T.colors.badge.pendienteTx};
  --ok-bg:${T.colors.badge.pagadoBg}; --ok-tx:${T.colors.badge.pagadoTx};
}
*{box-sizing:border-box}
body{margin:0;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Arial;color:var(--text);background:#fff}
.header h1{font-size:22px;margin:0 0 6px}
.meta{color:var(--muted);font-size:12px;display:flex;gap:12px;flex-wrap:wrap}
.divider{height:1px;background:var(--divider);margin:12px 0}

.summary{
  background:linear-gradient(135deg,var(--violet-start),var(--violet-end));
  border-radius:8px; padding:16px; color:#fff; box-shadow:0 2px 6px rgba(0,0,0,.10);
  margin:16px 0 18px; display:grid; grid-template-columns: repeat(3,1fr); gap:12px;
}
.card{background:rgba(255,255,255,.12); border-radius:8px; padding:12px}
.card-title{font-size:12px;opacity:.95}
.card-value{font-size:18px;font-weight:700;margin-top:4px}

table{width:100%;border-collapse:collapse}
thead th{
  color:#fff;padding:10px 8px;font-size:12px;text-align:left;
  background:linear-gradient(135deg,var(--blue-start),var(--blue-end));
}
tbody td{padding:10px 8px;font-size:12px;border:1px solid var(--divider)}
tbody tr:nth-child(odd){background:var(--row-alt)}
.monto-pos{color:var(--cobro);font-weight:700;text-align:right}
.monto-neg{color:var(--pago);font-weight:700;text-align:right}

.badge{display:inline-block;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:700}
.badge-urg{background:var(--urg-bg);color:var(--urg-tx)}
.badge-pen{background:var(--pen-bg);color:var(--pen-tx)}
.badge-ok{ background:var(--ok-bg); color:var(--ok-tx) }

.footer{margin-top:18px;color:var(--muted);font-size:11px;text-align:center}
@page{margin:24px}
`