export default function ProductLoading() {
  return (
    <div className="container animate-pulse py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-ink-100" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-ink-100" />
          <div className="h-8 w-3/4 rounded bg-ink-100" />
          <div className="h-4 w-32 rounded bg-ink-100" />
          <div className="h-8 w-28 rounded bg-ink-100" />
          <div className="h-24 rounded bg-ink-100" />
          <div className="h-11 rounded-full bg-ink-100" />
        </div>
      </div>
    </div>
  )
}
