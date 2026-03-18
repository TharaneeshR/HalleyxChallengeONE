import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/common/Layout'
import { ToastProvider } from './components/common'
import WorkflowList    from './components/workflow/WorkflowList'
import WorkflowEditor  from './components/workflow/WorkflowEditor'
import WorkflowExecute from './components/execution/WorkflowExecute'
import AuditLog        from './components/audit/AuditLog'

export default function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/"                           element={<Navigate to="/workflows" replace />} />
          <Route path="/workflows"                  element={<WorkflowList />} />
          <Route path="/workflows/:id/edit"         element={<WorkflowEditor />} />
          <Route path="/workflows/:id/execute"      element={<WorkflowExecute />} />
          <Route path="/audit"                      element={<AuditLog />} />
          <Route path="*"                           element={<Navigate to="/workflows" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}
