import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Play, XCircle, RefreshCw, CheckCircle2,
  AlertCircle, Clock, ChevronDown, ChevronRight, Loader2
} from 'lucide-react'
import { workflowApi, executionApi } from '../../services/api'
import { fmtDate, fmtDuration, STATUS_COLORS } from '../../utils/helpers'
import { StatusBadge, LoadingScreen, useToast, Spinner } from '../common'

// ── Input Form ──────────────────────────────────────────────────────────────
function SchemaForm({ schema, values, onChange }) {
  const fields = (() => {
    try { return Object.entries(JSON.parse(schema || '{}')) }
    catch { return [] }
  })()

  if (fields.length === 0) return (
    <div className="text-sm text-slate-500 italic py-2">No input schema defined for this workflow.</div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(([key, meta]) => (
        <div key={key}>
          <label className="label">
            {key}
            {meta.required && <span className="text-red-400 ml-1">*</span>}
            <span className="text-slate-600 ml-1 normal-case">({meta.type})</span>
          </label>

          {meta.allowed_values ? (
            <select
              className="select"
              value={values[key] ?? ''}
              onChange={e => onChange(key, e.target.value)}>
              <option value="">Select…</option>
              {meta.allowed_values.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          ) : (
            <input
              className="input"
              type={meta.type === 'number' ? 'number' : 'text'}
              placeholder={`Enter ${key}`}
              value={values[key] ?? ''}
              onChange={e => onChange(key,
                meta.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Execution Status Panel ──────────────────────────────────────────────────
function ExecutionPanel({ execution, onCancel, onRetry }) {
  const statusColors = {
    PENDING:     'text-yellow-400',
    IN_PROGRESS: 'text-blue-400',
    COMPLETED:   'text-green-400',
    FAILED:      'text-red-400',
    CANCELED:    'text-slate-400',
  }

  return (
    <div className="card p-5 animate-slide-up">
      {/* Status header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            {execution.status === 'IN_PROGRESS' && <Spinner size={18} />}
            {execution.status === 'COMPLETED'   && <CheckCircle2 size={18} className="text-green-400" />}
            {execution.status === 'FAILED'      && <AlertCircle  size={18} className="text-red-400" />}
            {execution.status === 'CANCELED'    && <XCircle      size={18} className="text-slate-400" />}
            {execution.status === 'PENDING'     && <Clock        size={18} className="text-yellow-400" />}
            <h3 className={`font-semibold text-lg ${statusColors[execution.status]}`}>
              {execution.status}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{execution.id}</p>
        </div>

        <div className="flex gap-2">
          {(execution.status === 'PENDING' || execution.status === 'IN_PROGRESS') && (
            <button className="btn-danger border text-xs" onClick={onCancel}>
              <XCircle size={13} /> Cancel
            </button>
          )}
          {execution.status === 'FAILED' && (
            <button className="btn-secondary text-xs" onClick={onRetry}>
              <RefreshCw size={13} /> Retry
            </button>
          )}
        </div>
      </div>

      {/* Stats - KEPT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          ['Started', fmtDate(execution.startedAt)],
          ['Ended',   fmtDate(execution.endedAt)],
          ['Duration', fmtDuration(execution.startedAt, execution.endedAt)],
          ['Retries',  execution.retries ?? 0],
        ].map(([label, val]) => (
          <div key={label} className="bg-surface-2 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-200">{val}</p>
          </div>
        ))}
      </div>

      {/* Current step - KEPT */}
      {execution.status === 'IN_PROGRESS' && execution.currentStepName && (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5">
          <Spinner size={14} />
          <span className="text-sm text-blue-300">
            Executing: <strong>{execution.currentStepName}</strong>
          </span>
        </div>
      )}
      {/* ✂️ REMOVED: Logs section was here (lines 202-220 in original) */}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function WorkflowExecute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const pollRef = useRef(null)

  const [workflow, setWorkflow]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [inputs, setInputs]         = useState({})
  const [triggeredBy, setTriggered] = useState('user-001')
  const [executing, setExecuting]   = useState(false)
  const [execution, setExecution]   = useState(null)

  useEffect(() => {
    workflowApi.get(id)
      .then(wf => { setWorkflow(wf); setLoading(false) })
      .catch(e => { toast(e.message, 'error'); setLoading(false) })
  }, [id])

  // Poll execution status while in progress
  useEffect(() => {
    if (!execution) return
    const terminal = ['COMPLETED', 'FAILED', 'CANCELED']
    if (terminal.includes(execution.status)) {
      clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await executionApi.get(execution.id)
        setExecution(updated)
        if (terminal.includes(updated.status)) clearInterval(pollRef.current)
      } catch {}
    }, 1500)
    return () => clearInterval(pollRef.current)
  }, [execution?.id, execution?.status])

  const handleStart = async () => {
    // Validate required fields
    try {
      const schema = JSON.parse(workflow.inputSchema || '{}')
      for (const [key, meta] of Object.entries(schema)) {
        if (meta.required && (inputs[key] === undefined || inputs[key] === '')) {
          return toast(`Field "${key}" is required`, 'error')
        }
      }
    } catch {}

    setExecuting(true)
    try {
      const exec = await workflowApi.execute(id, { data: inputs, triggeredBy })
      setExecution(exec)
      toast('Execution started', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setExecuting(false) }
  }

  const handleCancel = async () => {
    try {
      const updated = await executionApi.cancel(execution.id)
      setExecution(updated)
      toast('Execution canceled', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const handleRetry = async () => {
    try {
      const updated = await executionApi.retry(execution.id)
      setExecution(updated)
      toast('Retrying execution…', 'info')
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header - KEPT */}
      <div className="flex items-center gap-4 mb-8">
        <button className="btn-ghost p-2 rounded-xl" onClick={() => navigate(`/workflows/${id}/edit`)}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-3xl text-white">Execute Workflow</h1>
          <p className="text-slate-500 text-sm mt-1">
            {workflow?.name}
            <span className="ml-2 font-mono text-xs text-slate-600">v{workflow?.version}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Form - KEPT */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">Input Data</h2>

            <SchemaForm
              schema={workflow?.inputSchema}
              values={inputs}
              onChange={(key, val) => setInputs(v => ({ ...v, [key]: val }))}
            />

            <div className="mt-4">
              <label className="label">Triggered By</label>
              <input
                className="input"
                value={triggeredBy}
                onChange={e => setTriggered(e.target.value)}
                placeholder="user-id or name"
              />
            </div>

            <button
              className="btn-primary w-full mt-5 justify-center py-2.5"
              onClick={handleStart}
              disabled={executing || execution?.status === 'IN_PROGRESS'}>
              {executing
                ? <><Spinner size={15} /> Starting…</>
                : <><Play size={15} /> Start Execution</>}
            </button>

            {execution && (
              <button
                className="btn-ghost w-full mt-2 justify-center text-xs"
                onClick={() => { setExecution(null); setInputs({}) }}>
                ↩ New Execution
              </button>
            )}
          </div>

          {/* ✂️ REMOVED: Input preview section was here (lines 356-365 in original) */}
        </div>

        {/* Execution output - KEPT (but without logs) */}
        <div className="lg:col-span-3">
          {!execution ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
                <Play size={24} className="text-slate-500" />
              </div>
              <h3 className="font-semibold text-slate-400 mb-1">Ready to Execute</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                Fill in the input data and click "Start Execution" to run the workflow.
              </p>
            </div>
          ) : (
            <ExecutionPanel
              execution={execution}
              onCancel={handleCancel}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  )
}