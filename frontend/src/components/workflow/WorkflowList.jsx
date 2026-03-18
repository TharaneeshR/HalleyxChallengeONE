import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Play, Pencil, Trash2, RefreshCw, Filter, Workflow } from 'lucide-react'
import { workflowApi } from '../../services/api'
import { fmtDate } from '../../utils/helpers'
import {
  StatusBadge, Spinner, EmptyState, ConfirmDialog, LoadingScreen, useToast
} from '../common'
import WorkflowFormModal from './WorkflowFormModal'

export default function WorkflowList() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [workflows, setWorkflows]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterActive, setFilter]   = useState('')
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal]           = useState(0)
  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [delTarget, setDelTarget]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 10 }
      if (search)       params.search   = search
      if (filterActive) params.isActive = filterActive === 'active'
      const res = await workflowApi.list(params)
      setWorkflows(res.content)
      setTotalPages(res.totalPages)
      setTotal(res.totalElements)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterActive])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async () => {
    try {
      await workflowApi.delete(delTarget.id)
      toast('Workflow deleted', 'success')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const handleFormSave = () => {
    setFormOpen(false)
    setEditTarget(null)
    load()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">Workflows</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total workflows</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search workflows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select w-36"
          value={filterActive}
          onChange={e => { setFilter(e.target.value); setPage(0) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn-ghost" onClick={load} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen /> : (
          <>
            {workflows.length === 0 ? (
              <EmptyState
                icon={Workflow}
                title="No workflows found"
                description="Create your first workflow to get started with automation."
                action={
                  <button className="btn-primary" onClick={() => setFormOpen(true)}>
                    <Plus size={15} /> Create Workflow
                  </button>
                }
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-3">
                    {['Name', 'Steps', 'Version', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workflows.map(wf => (
                    <tr key={wf.id} className="table-row group">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                            {wf.name}
                          </p>
                          {wf.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{wf.description}</p>
                          )}
                          <p className="text-xs text-slate-600 font-mono mt-0.5 truncate max-w-[18rem]">{wf.id}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge bg-surface-3 text-slate-300">{wf.stepCount || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">v{wf.version}</td>
                      <td className="px-5 py-4">
                        <span className={`badge border ${wf.isActive
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {wf.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{fmtDate(wf.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            className="btn-ghost p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"
                            title="Execute"
                            onClick={() => navigate(`/workflows/${wf.id}/execute`)}>
                            <Play size={14} />
                          </button>
                          <button
                            className="btn-ghost p-1.5 rounded-lg"
                            title="Edit"
                            onClick={() => navigate(`/workflows/${wf.id}/edit`)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                            title="Delete"
                            onClick={() => setDelTarget(wf)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-surface-3">
                <p className="text-xs text-slate-500">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}>
                    Previous
                  </button>
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <WorkflowFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSaved={handleFormSave}
        workflow={editTarget}
      />

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Delete "${delTarget?.name}"? This will remove all steps and rules.`}
        danger
      />
    </div>
  )
}
