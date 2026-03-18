import React, { useState, useEffect } from 'react'
import { stepApi } from '../../services/api'
import { Modal, useToast } from '../common'

const STEP_TYPES = ['TASK', 'APPROVAL', 'NOTIFICATION']

export default function StepFormModal({ open, onClose, onSaved, workflowId, step, steps }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [name, setName]           = useState('')
  const [stepType, setStepType]   = useState('TASK')
  const [order, setOrder]         = useState(1)
  const [metaRaw, setMetaRaw]     = useState('{}')
  const [metaErr, setMetaErr]     = useState('')

  useEffect(() => {
    if (step) {
      setName(step.name || '')
      setStepType(step.stepType || 'TASK')
      setOrder(step.order || 1)
      setMetaRaw(step.metadata ? JSON.stringify(JSON.parse(step.metadata || '{}'), null, 2) : '{}')
    } else {
      setName('')
      setStepType('TASK')
      setOrder((steps?.length || 0) + 1)
      setMetaRaw('{}')
    }
    setMetaErr('')
  }, [step, open, steps])

  const validateMeta = (val) => {
    try { JSON.parse(val); setMetaErr(''); return true }
    catch (e) { setMetaErr('Invalid JSON: ' + e.message); return false }
  }

  const handleSave = async () => {
    if (!name.trim()) return toast('Step name is required', 'error')
    if (!validateMeta(metaRaw)) return

    setSaving(true)
    try {
      const payload = { name, stepType, order: Number(order), metadata: metaRaw }
      if (step) {
        await stepApi.update(step.id, payload)
        toast('Step updated', 'success')
      } else {
        await stepApi.create(workflowId, payload)
        toast('Step created', 'success')
      }
      onSaved()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const metaTemplates = {
    TASK: '{\n  "action": "process",\n  "description": ""\n}',
    APPROVAL: '{\n  "assignee_email": "manager@example.com",\n  "instructions": "Please review and approve"\n}',
    NOTIFICATION: '{\n  "notification_channel": "email",\n  "template": "alert_template",\n  "recipients": ["team@example.com"]\n}',
  }

  return (
    <Modal open={open} onClose={onClose} title={step ? 'Edit Step' : 'Add Step'} size="md">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">Step Name *</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Manager Approval" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Step Type *</label>
            <select className="select" value={stepType}
              onChange={e => { setStepType(e.target.value); setMetaRaw(metaTemplates[e.target.value]) }}>
              {STEP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <input className="input" type="number" min={1} value={order}
              onChange={e => setOrder(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Metadata (JSON)</label>
            <button className="text-xs text-brand-400 hover:text-brand-300"
              onClick={() => setMetaRaw(metaTemplates[stepType])}>
              Use template
            </button>
          </div>
          <textarea
            className={`input font-mono text-xs resize-none ${metaErr ? 'border-red-500' : ''}`}
            rows={6}
            value={metaRaw}
            onChange={e => { setMetaRaw(e.target.value); validateMeta(e.target.value) }}
            spellCheck={false}
          />
          {metaErr && <p className="text-xs text-red-400 mt-1">{metaErr}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-surface-3">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !!metaErr}>
            {saving ? 'Saving…' : (step ? 'Save Changes' : 'Add Step')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
