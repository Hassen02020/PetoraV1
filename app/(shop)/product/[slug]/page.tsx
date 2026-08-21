import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel"
import { ProductInfo } from "@/components/product/ProductInfo"
import { ReviewsList } from "@/components/product/ReviewsList"
import { ProductGrid } from "@/components/product/ProductGrid"
import { getProductBySlug, getRelatedProducts, getApprovedReviews } from "@/lib/data/product"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  return {
    title: product.name,
    description: product.seoDescription ?? product.shortDescription ?? product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.categorySlug, product.id),
    getApprovedReviews(product.id),
  ])

  const lowestPrice = Math.min(...product.variants.map((v) => v.priceCents))
  const anyInStock = product.variants.some((v) => v.inStock)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    brand: product.brandName ? { "@type": "Brand", name: product.brandName } : undefined,
    image: product.images.map((i) => i.url),
    aggregateRating:
      product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (lowestPrice / 100).toFixed(2),
      availability: anyInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  }

  return (
    <div className="container py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />
        <ProductPurchasePanel product={product} />
      </div>

      <ProductInfo product={product} />
      <ReviewsList reviews={reviews} rating={product.rating} count={product.reviewCount} />

      {related.length > 0 && (
        <div className="mt-12 border-t border-ink-100 pt-8">
          <ProductGrid title="You May Also Like" products={related} bare titleAs="h2" />
        </div>
      )}
    </div>
  )
}
