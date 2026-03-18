import React, { useState, useEffect } from 'react'
import { executionApi } from '../../services/api'
import { Modal, StatusBadge, Spinner } from '../common'
import { fmtDate, fmtDuration } from '../../utils/helpers'
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

function LogCard({ log, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`border rounded-xl overflow-hidden
      ${log.status === 'completed'
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-red-500/20 bg-red-500/5'}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}>
        {log.status === 'completed'
          ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          : <AlertCircle  size={14} className="text-red-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-200">{log.step_name}</span>
            <span className="badge bg-surface-3 text-slate-400 text-xs capitalize">{log.step_type}</span>
          </div>
          {log.selected_next_step && (
            <p className="text-xs text-slate-500 mt-0.5">→ {log.selected_next_step}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {log.duration_ms != null && <span>{log.duration_ms}ms</span>}
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5">
          {log.evaluated_rules?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
                Rules Evaluated
              </p>
              <div className="flex flex-col gap-1">
                {log.evaluated_rules.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`font-bold shrink-0 mt-0.5 ${r.result ? 'text-green-400' : 'text-slate-600'}`}>
                      {r.result ? '✓' : '✗'}
                    </span>
                    <code className={`font-mono break-all
                      ${r.result ? 'text-brand-300' : 'text-slate-500'}`}>
                      {r.rule}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Metadata</p>
              <pre className="text-xs font-mono text-slate-400 bg-surface-2 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            {log.started_at && <div>Started: <span className="text-slate-400">{fmtDate(log.started_at)}</span></div>}
            {log.ended_at   && <div>Ended: <span className="text-slate-400">{fmtDate(log.ended_at)}</span></div>}
          </div>

          {log.error_message && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              Error: {log.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExecutionLogsModal({ open, executionId, onClose }) {
  const [execution, setExecution] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!open || !executionId) return
    setLoading(true)
    executionApi.get(executionId)
      .then(e => { setExecution(e); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, executionId])

  return (
    <Modal open={open} onClose={onClose} title="Execution Details" size="xl">
      {loading || !execution ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Workflow',  execution.workflowName],
              ['Version',   `v${execution.workflowVersion}`],
              ['Status',    <StatusBadge status={execution.status} />],
              ['Started By', execution.triggeredBy || '—'],
              ['Start',     fmtDate(execution.startedAt)],
              ['Duration',  fmtDuration(execution.startedAt, execution.endedAt)],
            ].map(([label, val]) => (
              <div key={label} className="bg-surface-2 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <div className="text-sm font-medium text-slate-200">{val}</div>
              </div>
            ))}
          </div>

          {/* Input Data */}
          {execution.data && Object.keys(execution.data).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Input Data</p>
              <pre className="text-xs font-mono text-slate-300 bg-surface-2 rounded-xl p-4 overflow-x-auto">
                {JSON.stringify(execution.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Step Logs */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">
              Step Logs ({execution.logs?.length ?? 0})
            </p>
            {!execution.logs?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-surface-4 rounded-xl">
                No logs recorded
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {execution.logs.map((log, i) => (
                  <LogCard key={i} log={log} defaultOpen={i === 0} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
