import React, { useState, useEffect, useCallback } from 'react'
import { ruleApi } from '../../services/api'
import { useToast } from '../common'
import { Plus, Trash2, GripVertical, ChevronRight, Save } from 'lucide-react'

const CONDITION_HINTS = [
  'amount > 100',
  "country == 'US'",
  "priority == 'High'",
  "department == 'HR'",
  "contains(field, 'value')",
  'DEFAULT',
]

function RuleRow({ rule, idx, allSteps, onUpdate, onDelete, onDragStart, onDragOver, onDrop }) {
  const [editing, setEditing] = useState(false)
  const [condition, setCondition] = useState(rule.condition)
  const [nextStepId, setNextStepId] = useState(rule.nextStepId || '')
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCondition(rule.condition)
    setNextStepId(rule.nextStepId || '')
  }, [rule])

  const save = async () => {
    if (!condition.trim()) return toast('Condition required', 'error')
    setSaving(true)
    try {
      const updated = await ruleApi.update(rule.id, {
        condition,
        nextStepId: nextStepId || null,
        priority: rule.priority
      })
      onUpdate(updated)
      setEditing(false)
      toast('Rule saved', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const nextStepName = allSteps.find(s => s.id === (rule.nextStepId || nextStepId))?.name

  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragOver={e => { e.preventDefault(); onDragOver(idx) }}
      onDrop={() => onDrop(idx)}
      className="group bg-surface-2 border border-surface-3 rounded-xl overflow-hidden
                 hover:border-surface-4 transition-colors cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Priority + drag */}
        <div className="flex items-center gap-2 shrink-0">
          <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400" />
          <span className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center
                           text-xs font-mono font-bold text-slate-400">
            {rule.priority}
          </span>
        </div>

        {!editing ? (
          <>
            <div className="flex-1 min-w-0">
              <code className="text-xs text-brand-300 font-mono block truncate">{rule.condition}</code>
              <div className="flex items-center gap-1 mt-0.5">
                <ChevronRight size={10} className="text-slate-600" />
                <span className="text-xs text-slate-500">
                  {rule.nextStepId ? (nextStepName || rule.nextStepId) : <span className="text-red-400">END workflow</span>}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="btn-ghost p-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100"
                onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10
                                 opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(rule.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="input text-xs font-mono flex-1"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                placeholder="Condition expression or DEFAULT"
              />
              <select
                className="select text-xs w-44"
                value={nextStepId}
                onChange={e => setNextStepId(e.target.value)}>
                <option value="">→ END workflow</option>
                {allSteps.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              {CONDITION_HINTS.map(h => (
                <button key={h}
                  className="text-xs px-2 py-0.5 rounded bg-surface-3 text-slate-400 hover:text-slate-200 hover:bg-surface-4"
                  onClick={() => setCondition(h)}>
                  {h}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-ghost text-xs py-1" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary text-xs py-1" onClick={save} disabled={saving}>
                <Save size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RuleEditor({ step, allSteps }) {
  const { toast } = useToast()
  const [rules, setRules]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [newCond, setNewCond]   = useState('')
  const [newNext, setNewNext]   = useState('')
  const [dragIdx, setDragIdx]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ruleApi.list(step.id)
      setRules(data)
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [step.id])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!newCond.trim()) return toast('Condition is required', 'error')
    const maxPriority = rules.reduce((m, r) => Math.max(m, r.priority), 0)
    try {
      await ruleApi.create(step.id, {
        condition: newCond,
        nextStepId: newNext || null,
        priority: maxPriority + 1
      })
      toast('Rule added', 'success')
      setAdding(false)
      setNewCond('')
      setNewNext('')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const handleDelete = async (ruleId) => {
    try {
      await ruleApi.delete(ruleId)
      toast('Rule deleted', 'success')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const handleDrop = async (toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) return
    const reordered = [...rules]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(toIdx, 0, moved)
    // Reassign priorities
    const updated = reordered.map((r, i) => ({ ...r, priority: i + 1 }))
    setRules(updated)
    setDragIdx(null)
    // Persist new priorities
    try {
      await Promise.all(updated.map(r =>
        ruleApi.update(r.id, { condition: r.condition, nextStepId: r.nextStepId, priority: r.priority })
      ))
      toast('Priority order saved', 'success')
    } catch (e) { toast('Failed to save order: ' + e.message, 'error'); load() }
  }

  // Check for DEFAULT rule
  const hasDefault = rules.some(r => r.condition.trim().toUpperCase() === 'DEFAULT')

  return (
    <div className="flex flex-col gap-4 min-h-[300px]">
      {/* Info bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {rules.length} rule{rules.length !== 1 ? 's' : ''} · drag to reorder priority
        </p>
        {!hasDefault && rules.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10
                          border border-amber-400/20 rounded-lg px-3 py-1.5">
            ⚠ No DEFAULT rule — add one to handle unmatched conditions
          </div>
        )}
        <button className="btn-primary text-xs py-1.5" onClick={() => setAdding(true)}>
          <Plus size={13} /> Add Rule
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-surface-2 border border-brand-600/30 rounded-xl p-4 flex flex-col gap-3 animate-slide-up">
          <div className="flex gap-2">
            <input
              className="input text-xs font-mono flex-1"
              value={newCond}
              onChange={e => setNewCond(e.target.value)}
              placeholder="e.g. amount > 100 && country == 'US' or DEFAULT"
              autoFocus
            />
            <select
              className="select text-xs w-44"
              value={newNext}
              onChange={e => setNewNext(e.target.value)}>
              <option value="">→ END workflow</option>
              {allSteps.filter(s => s.id !== step.id).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 flex-wrap">
            {CONDITION_HINTS.map(h => (
              <button key={h}
                className="text-xs px-2 py-0.5 rounded bg-surface-3 text-slate-400 hover:text-slate-200 hover:bg-surface-4"
                onClick={() => setNewCond(h)}>
                {h}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost text-xs py-1" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary text-xs py-1.5" onClick={handleAdd}>Add Rule</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading rules…</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-surface-4 rounded-xl">
          <p className="text-slate-500 text-sm mb-3">No rules yet for this step.</p>
          <p className="text-xs text-slate-600">Add a DEFAULT rule to handle all cases, then add specific conditions above it.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule, idx) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              idx={idx}
              allSteps={allSteps}
              onUpdate={updated => setRules(r => r.map(x => x.id === updated.id ? updated : x))}
              onDelete={handleDelete}
              onDragStart={setDragIdx}
              onDragOver={() => {}}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}
