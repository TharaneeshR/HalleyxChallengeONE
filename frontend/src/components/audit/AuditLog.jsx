import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, Search, Eye, XCircle, RotateCcw,
  BarChart3, TrendingUp, Clock, CheckCircle2
} from 'lucide-react'
import { executionApi } from '../../services/api'
import { fmtDate, fmtDuration } from '../../utils/helpers'
import { StatusBadge, LoadingScreen, EmptyState, useToast, Modal } from '../common'
import ExecutionLogsModal from '../execution/ExecutionLogsModal'

const STATUSES = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELED']

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function AuditLog() {
  const { toast } = useToast()
  const navigate  = useNavigate()

  const [executions, setExecutions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal]           = useState(0)
  const [viewExec, setViewExec]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 15 }
      if (statusFilter) params.status = statusFilter
      const res = await executionApi.list(params)
      setExecutions(res.content)
      setTotalPages(res.totalPages)
      setTotal(res.totalElements)
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])


  const handleCancel = async (exec) => {
    try {
      await executionApi.cancel(exec.id)
      toast('Canceled', 'success')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const handleRetry = async (exec) => {
    try {
      await executionApi.retry(exec.id)
      toast('Retrying…', 'info')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  // Compute stats from loaded data
  const stats = {
    total,
    completed: executions.filter(e => e.status === 'COMPLETED').length,
    failed:    executions.filter(e => e.status === 'FAILED').length,
    active:    executions.filter(e => e.status === 'IN_PROGRESS' || e.status === 'PENDING').length,
  }

  // Filter by search (client-side name filter)
  const filtered = search
    ? executions.filter(e =>
        e.workflowName?.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.triggeredBy?.toLowerCase().includes(search.toLowerCase())
      )
    : executions

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-1">All workflow execution history</p>
        </div>
        <button className="btn-ghost" onClick={load} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Executions" value={total}
          icon={BarChart3} color="bg-brand-600/20 text-brand-400" />
        <StatCard label="Completed" value={stats.completed}
          icon={CheckCircle2} color="bg-green-500/20 text-green-400" />
        <StatCard label="Failed" value={stats.failed}
          icon={XCircle} color="bg-red-500/20 text-red-400" />
        <StatCard label="Active" value={stats.active}
          icon={Clock} color="bg-blue-500/20 text-blue-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Search by workflow, ID, user…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(0) }}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen /> : filtered.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No executions found"
            description="Execute a workflow to see it here."
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-3">
                  {['Execution ID', 'Workflow', 'Version', 'Status', 'Started By', 'Start Time', 'Duration', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(exec => (
                  <tr key={exec.id} className="table-row group">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-slate-400 truncate block max-w-[9rem]">
                        {exec.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-slate-200 whitespace-nowrap">{exec.workflowName}</p>
                        {exec.status === 'IN_PROGRESS' && exec.currentStepName && (
                          <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            {exec.currentStepName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      v{exec.workflowVersion}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={exec.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{exec.triggeredBy || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {fmtDate(exec.startedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {fmtDuration(exec.startedAt, exec.endedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          className="btn-ghost p-1.5 rounded-lg text-brand-400 hover:bg-brand-500/10"
                          title="View Logs"
                          onClick={() => setViewExec(exec)}>
                          <Eye size={14} />
                        </button>
                        {(exec.status === 'IN_PROGRESS' || exec.status === 'PENDING') && (
                          <button
                            className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                            title="Cancel"
                            onClick={() => handleCancel(exec)}>
                            <XCircle size={14} />
                          </button>
                        )}
                        {exec.status === 'FAILED' && (
                          <button
                            className="btn-ghost p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10"
                            title="Retry"
                            onClick={() => handleRetry(exec)}>
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          className="btn-ghost p-1.5 rounded-lg text-slate-400"
                          title="Go to workflow"
                          onClick={() => navigate(`/workflows/${exec.workflowId}/edit`)}>
                          →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-surface-3">
                <p className="text-xs text-slate-500">
                  Page {page + 1} of {totalPages} · {total} total
                </p>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3"
                    disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </button>
                  <button className="btn-secondary text-xs py-1.5 px-3"
                    disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Logs Modal */}
      {viewExec && (
        <ExecutionLogsModal
          open={!!viewExec}
          executionId={viewExec.id}
          onClose={() => setViewExec(null)}
        />
      )}
    </div>
  )
}
