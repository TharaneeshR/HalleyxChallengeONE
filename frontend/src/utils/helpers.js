import { format, formatDistanceToNow } from 'date-fns'

export const fmtDate = (iso) => {
  if (!iso) return '—'
  try { return format(new Date(iso), 'MMM d, yyyy HH:mm') } catch { return iso }
}

export const fmtRelative = (iso) => {
  if (!iso) return '—'
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) } catch { return iso }
}

export const fmtDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '—'
  try {
    const ms = new Date(endIso) - new Date(startIso)
    if (ms < 1000) return `${ms}ms`
    const s = Math.floor(ms / 1000)
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  } catch { return '—' }
}

export const STATUS_COLORS = {
  PENDING:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  COMPLETED:   'bg-green-500/10 text-green-400 border-green-500/20',
  FAILED:      'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELED:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export const STEP_TYPE_COLORS = {
  TASK:         'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  APPROVAL:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  NOTIFICATION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export const STEP_TYPE_ICONS = {
  TASK:         '⚙',
  APPROVAL:     '✓',
  NOTIFICATION: '🔔',
}

export const truncate = (str, n = 50) =>
  str && str.length > n ? str.slice(0, n) + '…' : str
