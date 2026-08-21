import { StarRating } from "@/components/ui/StarRating"
import { Badge } from "@/components/ui/Badge"
import type { ReviewData } from "@/lib/types"

export function ReviewsList({ reviews, rating, count }: { reviews: ReviewData[]; rating: number; count: number }) {
  return (
    <div className="mt-12 border-t border-ink-100 pt-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Customer Reviews</h2>
        <StarRating rating={rating} count={count} />
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No reviews yet — be the first to review this product.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-ink-100 pb-6 last:border-0">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                {review.isVerifiedPurchase && <Badge variant="forest">Verified Purchase</Badge>}
              </div>
              {review.title && <h3 className="mt-2 text-sm font-semibold text-ink">{review.title}</h3>}
              {review.body && <p className="mt-1 text-sm text-ink-600">{review.body}</p>}
              <p className="mt-2 text-xs text-ink-400">
                {review.authorName} &middot; {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
