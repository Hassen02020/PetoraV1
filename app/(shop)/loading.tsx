export default function ShopLoading() {
  return (
    <div className="container animate-pulse py-10">
      <div className="h-64 rounded-3xl bg-ink-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-ink-100" />
        ))}
      </div>
    </div>
  )
}
