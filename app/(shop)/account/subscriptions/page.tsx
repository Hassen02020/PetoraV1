import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Autoship" }

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = user
    ? await supabase
        .from("subscriptions")
        .select("id, status, frequency_weeks, next_order_date")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null }

  const subscriptions = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Autoship</h1>

      {subscriptions.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">
          You don&apos;t have any Autoship subscriptions yet. Choose &quot;Subscribe &amp; Save&quot; on any eligible
          product to set up recurring delivery.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-ink-100 bg-white p-4 text-sm">
              <p className="font-medium text-ink capitalize">{sub.status}</p>
              <p className="text-ink-500">
                Every {sub.frequency_weeks} weeks · Next order {new Date(sub.next_order_date).toLocaleDateString("en-US")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
