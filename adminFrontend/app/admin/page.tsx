"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminContent } from "@/components/admin/admin-content"
import { AdminCircles } from "@/components/admin/admin-circles"
import { AdminReports } from "@/components/admin/admin-reports"
import { AdminSettings } from "@/components/admin/admin-settings"

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard")

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Fixed Full-Screen Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/15 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-1/2 w-48 h-48 bg-accent/10 rounded-full blur-xl" />
      </div>

      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-6 relative z-10 overflow-y-auto min-h-screen">
        {activeSection === "dashboard" && <AdminDashboard />}
        {activeSection === "users" && <AdminUsers />}
        {activeSection === "content" && <AdminContent />}
        {activeSection === "circles" && <AdminCircles />}
        {activeSection === "reports" && <AdminReports />}
        {activeSection === "settings" && <AdminSettings />}
      </main>
    </div>
  )
}
