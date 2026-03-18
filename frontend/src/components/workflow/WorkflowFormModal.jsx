import React, { useState, useEffect } from 'react'
import { workflowApi } from '../../services/api'
import { Modal, useToast } from '../common'
import { Plus, Trash2 } from 'lucide-react'

const FIELD_TYPES = ['string', 'number', 'boolean']

export default function WorkflowFormModal({ open, onClose, onSaved, workflow }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [isActive, setIsActive] = useState(true)
  const [fields, setFields]     = useState([])

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || '')
      setDesc(workflow.description || '')
      setIsActive(workflow.isActive !== false)
      try {
        const schema = JSON.parse(workflow.inputSchema || '{}')
        setFields(Object.entries(schema).map(([key, val]) => ({
          key, type: val.type || 'string',
          required: val.required || false,
          allowedValues: (val.allowed_values || []).join(',')
        })))
      } catch { setFields([]) }
    } else {
      setName(''); setDesc(''); setIsActive(true); setFields([])
    }
  }, [workflow, open])

  const addField = () =>
    setFields(f => [...f, { key: '', type: 'string', required: false, allowedValues: '' }])

  const removeField = i =>
    setFields(f => f.filter((_, j) => j !== i))

  const updateField = (i, key, val) =>
    setFields(f => f.map((x, j) => j === i ? { ...x, [key]: val } : x))

  const buildSchema = () => {
    const schema = {}
    for (const f of fields) {
      if (!f.key.trim()) continue
      const entry = { type: f.type, required: f.required }
      if (f.allowedValues.trim()) {
        entry.allowed_values = f.allowedValues.split(',').map(s => s.trim()).filter(Boolean)
      }
      schema[f.key.trim()] = entry
    }
    return JSON.stringify(schema)
  }

  const handleSave = async () => {
    if (!name.trim()) return toast('Workflow name is required', 'error')
    setSaving(true)
    try {
      const payload = { name, description: desc, isActive, inputSchema: buildSchema() }
      if (workflow) {
        await workflowApi.update(workflow.id, payload)
        toast('Workflow updated', 'success')
      } else {
        await workflowApi.create(payload)
        toast('Workflow created', 'success')
      }
      onSaved()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={workflow ? 'Edit Workflow' : 'New Workflow'}
      size="lg">
      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="label">Workflow Name *</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Expense Approval" />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="What does this workflow do?" />
        </div>

        {/* Active */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer">
            <input type="checkbox" className="sr-only" checked={isActive}
              onChange={e => setIsActive(e.target.checked)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-brand-600' : 'bg-surface-4'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform
                              ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </label>
          <span className="text-sm text-slate-300">Active</span>
        </div>

        {/* Input Schema */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Input Schema</label>
            <button className="btn-ghost text-xs py-1 px-2" onClick={addField}>
              <Plus size={12} /> Add Field
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-surface-4 rounded-xl text-sm text-slate-600">
              No fields defined. Click "Add Field" to define workflow inputs.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-center bg-surface-2 rounded-xl p-3">
                  <input
                    className="input py-1.5 text-xs w-36"
                    placeholder="field name"
                    value={f.key}
                    onChange={e => updateField(i, 'key', e.target.value)} />
                  <select
                    className="select py-1.5 text-xs w-28"
                    value={f.type}
                    onChange={e => updateField(i, 'type', e.target.value)}>
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    className="input py-1.5 text-xs flex-1"
                    placeholder="allowed values (comma-separated)"
                    value={f.allowedValues}
                    onChange={e => updateField(i, 'allowedValues', e.target.value)} />
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 cursor-pointer">
                    <input type="checkbox" checked={f.required}
                      onChange={e => updateField(i, 'required', e.target.checked)} />
                    Required
                  </label>
                  <button className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                    onClick={() => removeField(i)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-surface-3">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : (workflow ? 'Save Changes' : 'Create Workflow')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
