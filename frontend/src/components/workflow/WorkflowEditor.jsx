import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronRight, Play,
  GripVertical, AlertCircle, CheckCircle2, Settings2
} from 'lucide-react'
import { workflowApi, stepApi } from '../../services/api'
import { STEP_TYPE_COLORS, STEP_TYPE_ICONS } from '../../utils/helpers'
import {
  LoadingScreen, EmptyState, ConfirmDialog, StepTypeBadge, useToast, Modal
} from '../common'
import StepFormModal from './StepFormModal'
import RuleEditor from './RuleEditor'
import WorkflowFormModal from './WorkflowFormModal'

export default function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [workflow, setWorkflow]   = useState(null)
  const [steps, setSteps]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [stepForm, setStepForm]   = useState(false)
  const [editStep, setEditStep]   = useState(null)
  const [delStep, setDelStep]     = useState(null)
  const [ruleStep, setRuleStep]   = useState(null)
  const [wfEdit, setWfEdit]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const wf = await workflowApi.get(id)
      setWorkflow(wf)
      setSteps(wf.steps || [])
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleDeleteStep = async () => {
    try {
      await stepApi.delete(delStep.id)
      toast('Step deleted', 'success')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const handleSetStart = async (stepId) => {
    try {
      await workflowApi.update(id, { ...workflow, startStepId: stepId })
      toast('Start step updated', 'success')
      load()
    } catch (e) { toast(e.message, 'error') }
  }

  const schemaFields = () => {
    try {
      const s = JSON.parse(workflow?.inputSchema || '{}')
      return Object.entries(s)
    } catch { return [] }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button className="btn-ghost p-2 rounded-xl mt-1" onClick={() => navigate('/workflows')}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-3xl text-white">{workflow?.name}</h1>
            <span className="badge bg-brand-600/20 text-brand-300 border border-brand-600/30 font-mono text-xs">
              v{workflow?.version}
            </span>
            <span className={`badge border ${workflow?.isActive
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
              {workflow?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {workflow?.description && (
            <p className="text-slate-500 text-sm mt-1">{workflow.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setWfEdit(true)}>
            <Settings2 size={15} /> Edit
          </button>
          <button className="btn-primary" onClick={() => navigate(`/workflows/${id}/execute`)}>
            <Play size={15} /> Execute
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-white">Steps</h2>
            <button className="btn-primary py-1.5 text-xs"
              onClick={() => { setEditStep(null); setStepForm(true) }}>
              <Plus size={13} /> Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="card py-12">
              <EmptyState
                title="No steps yet"
                description="Add your first step to build the workflow."
                action={
                  <button className="btn-primary text-sm" onClick={() => setStepForm(true)}>
                    <Plus size={14} /> Add First Step
                  </button>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {steps.map((step, idx) => (
                <div key={step.id}
                  className={`card p-4 transition-all duration-200 border
                    ${step.id === workflow?.startStepId
                      ? 'border-brand-600/50 bg-brand-600/5'
                      : 'hover:border-surface-4'}`}>
                  <div className="flex items-start gap-3">
                    {/* Order badge */}
                    <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center
                                    text-sm font-bold text-slate-400 shrink-0 mt-0.5">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{step.name}</span>
                        <StepTypeBadge type={step.stepType} />
                        {step.id === workflow?.startStepId && (
                          <span className="badge bg-brand-600/20 text-brand-300 border border-brand-600/30 text-xs">
                            START
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{step.id}</p>

                      {/* Rule summary */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">{step.rules?.length || 0} rules</span>
                        <button
                          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                          onClick={() => setRuleStep(step)}>
                          Manage rules →
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {step.id !== workflow?.startStepId && (
                        <button
                          className="btn-ghost p-1.5 rounded-lg text-xs text-brand-400 hover:bg-brand-500/10"
                          title="Set as start step"
                          onClick={() => handleSetStart(step.id)}>
                          ▶
                        </button>
                      )}
                      <button className="btn-ghost p-1.5 rounded-lg"
                        onClick={() => { setEditStep(step); setStepForm(true) }}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                        onClick={() => setDelStep(step)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Schema sidebar */}
        <div>
          <h2 className="font-semibold text-lg text-white mb-4">Input Schema</h2>
          <div className="card p-4">
            {schemaFields().length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No schema defined</p>
            ) : (
              <div className="flex flex-col gap-2">
                {schemaFields().map(([key, val]) => (
                  <div key={key} className="bg-surface-2 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-200">{key}</span>
                      <div className="flex gap-1">
                        <span className="badge bg-surface-3 text-slate-400 text-xs">{val.type}</span>
                        {val.required && (
                          <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                            required
                          </span>
                        )}
                      </div>
                    </div>
                    {val.allowed_values && (
                      <p className="text-xs text-slate-500 mt-1">
                        {val.allowed_values.join(' | ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow info */}
          <div className="card p-4 mt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Info</h3>
            <div className="flex flex-col gap-2 text-xs">
              {[
                ['ID', <span className="font-mono text-slate-500 truncate">{workflow?.id}</span>],
                ['Start Step', steps.find(s => s.id === workflow?.startStepId)?.name || '—'],
                ['Total Steps', steps.length],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StepFormModal
        open={stepForm}
        onClose={() => { setStepForm(false); setEditStep(null) }}
        onSaved={() => { setStepForm(false); setEditStep(null); load() }}
        workflowId={id}
        step={editStep}
        steps={steps}
      />

      <ConfirmDialog
        open={!!delStep}
        onClose={() => setDelStep(null)}
        onConfirm={handleDeleteStep}
        title="Delete Step"
        message={`Delete step "${delStep?.name}"? All rules for this step will also be removed.`}
        danger
      />

      {ruleStep && (
        <Modal open={!!ruleStep} onClose={() => { setRuleStep(null); load() }}
          title={`Rules — ${ruleStep.name}`} size="xl">
          <RuleEditor step={ruleStep} allSteps={steps} />
        </Modal>
      )}

      <WorkflowFormModal
        open={wfEdit}
        onClose={() => setWfEdit(false)}
        onSaved={() => { setWfEdit(false); load() }}
        workflow={workflow}
      />
    </div>
  )
}
