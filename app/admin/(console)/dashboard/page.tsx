import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Dashboard" }

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-500">
        Revenue, orders, customers and merchandising metrics land here in Phase 10.
      </p>
    </div>
  )
}
