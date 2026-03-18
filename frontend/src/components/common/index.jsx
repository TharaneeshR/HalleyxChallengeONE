import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { STATUS_COLORS, STEP_TYPE_COLORS } from '../../utils/helpers'

// ── Toast system ──────────────────────────────────────────────────────────────
const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastCtx.Provider value={{ toast: add }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="pointer-events-auto animate-slide-up flex items-start gap-3 px-4 py-3 rounded-xl
                       bg-surface-2 border border-surface-4 shadow-2xl max-w-sm">
            {t.type === 'success' && <CheckCircle2 size={16} className="text-accent-green mt-0.5 shrink-0" />}
            {t.type === 'error'   && <AlertCircle  size={16} className="text-accent-red mt-0.5 shrink-0" />}
            {t.type === 'info'    && <Info          size={16} className="text-accent-blue mt-0.5 shrink-0" />}
            <p className="text-sm text-slate-200 flex-1">{t.msg}</p>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 mt-0.5">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-surface-1 border border-surface-3
                       rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-3 shrink-0">
          <h2 className="font-display font-semibold text-lg text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-400 ${className}`} />
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={`badge border ${STATUS_COLORS[status] || 'bg-surface-3 text-slate-400'}`}>
      {status}
    </span>
  )
}

export function StepTypeBadge({ type }) {
  return (
    <span className={`badge border ${STEP_TYPE_COLORS[type] || 'bg-surface-3 text-slate-400'}`}>
      {type}
    </span>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>}
      <h3 className="font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-danger border' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose() }}>
          Confirm
        </button>
      </div>
    </Modal>
  )
}
