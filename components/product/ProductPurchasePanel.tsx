"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { StarRating } from "@/components/ui/StarRating"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { addToCartAction } from "@/lib/actions/cart"
import { formatPrice, cn } from "@/lib/utils"
import type { ProductDetailData } from "@/lib/types"

export function ProductPurchasePanel({ product }: { product: ProductDetailData }) {
  const router = useRouter()
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscribe">("one_time")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0],
    [product.variants, selectedVariantId]
  )

  const onSale =
    selectedVariant?.compareAtPriceCents != null &&
    selectedVariant.compareAtPriceCents > selectedVariant.priceCents

  const displayPriceCents =
    purchaseType === "subscribe" && selectedVariant
      ? Math.round(selectedVariant.priceCents * 0.95)
      : selectedVariant?.priceCents ?? 0

  function handleAddToCart(redirectToCheckout: boolean) {
    if (!selectedVariant) return
    setError(null)
    startTransition(async () => {
      const result = await addToCartAction(selectedVariant.id, quantity)
      if (!result.success) {
        setError(result.error ?? "Something went wrong.")
        return
      }
      router.push(redirectToCheckout ? "/checkout" : "/cart")
      router.refresh()
    })
  }

  return (
    <div>
      {product.brandName && (
        <span className="text-sm font-medium uppercase tracking-wide text-forest">{product.brandName}</span>
      )}
      <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{product.name}</h1>
      <div className="mt-2">
        <StarRating rating={product.rating} count={product.reviewCount} />
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-bold text-ink">{formatPrice(displayPriceCents)}</span>
        {onSale && (
          <span className="text-base text-ink-400 line-through">
            {formatPrice(selectedVariant!.compareAtPriceCents!)}
          </span>
        )}
        {purchaseType === "subscribe" && <Badge variant="forest">Autoship price</Badge>}
      </div>

      {product.shortDescription && <p className="mt-3 text-sm text-ink-600">{product.shortDescription}</p>}

      {product.variants.length > 1 && (
        <div className="mt-6">
          <span className="mb-2 block text-sm font-medium text-ink-700">Size</span>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!v.inStock}
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  v.id === selectedVariantId
                    ? "border-forest bg-forest text-white"
                    : "border-ink-200 text-ink-700 hover:border-forest"
                )}
              >
                {v.size ?? v.flavor ?? v.sku}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.isSubscribable && (
        <div className="mt-6 space-y-2">
          <span className="mb-1 block text-sm font-medium text-ink-700">Purchase Options</span>
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm",
              purchaseType === "one_time" ? "border-forest" : "border-ink-200"
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="purchaseType"
                checked={purchaseType === "one_time"}
                onChange={() => setPurchaseType("one_time")}
              />
              One-time purchase
            </span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm",
              purchaseType === "subscribe" ? "border-forest" : "border-ink-200"
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="purchaseType"
                checked={purchaseType === "subscribe"}
                onChange={() => setPurchaseType("subscribe")}
              />
              Subscribe &amp; Save 5%
            </span>
            <Badge variant="coral">Best Value</Badge>
          </label>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-ink-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center text-ink-600"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-11 w-11 items-center justify-center text-ink-600"
          >
            <Plus size={16} />
          </button>
        </div>
        {selectedVariant && !selectedVariant.inStock && (
          <span className="text-sm font-medium text-coral-600">Out of stock</span>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-coral-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={isPending || !selectedVariant?.inStock}
          onClick={() => handleAddToCart(false)}
        >
          Add to Cart
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={isPending || !selectedVariant?.inStock}
          onClick={() => handleAddToCart(true)}
        >
          Buy Now
        </Button>
      </div>
    </div>
  )
}
