import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Workflow, Play, BarChart3, Menu, X, Zap, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/workflows',  icon: Workflow,   label: 'Workflows' },
  { to: '/audit',      icon: BarChart3,  label: 'Audit Log' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col shrink-0 bg-surface-1 border-r border-surface-3
                         transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-3">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/50">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-display font-bold text-white tracking-tight text-lg leading-none">
              Halleyx<span className="text-brand-400"> WE</span>
            </span>
          )}
          <button
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                 ${isActive
                   ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                   : 'text-slate-400 hover:text-slate-200 hover:bg-surface-3'}`
              }>
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-surface-3">
            <p className="text-xs text-slate-600 font-mono">v1.0.0 · Halleyx 2026</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
