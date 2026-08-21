export type ProductCardData = {
  id: string
  slug: string
  name: string
  brandName: string | null
  imageUrl: string | null
  rating: number
  reviewCount: number
  priceCents: number
  compareAtPriceCents: number | null
  petType: "dog" | "cat" | "both"
}

export type CategoryCardData = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
}

export type BrandCardData = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

export type PromotionData = {
  id: string
  title: string
  subtitle: string | null
  ctaLabel: string | null
  ctaHref: string | null
  badgeText: string | null
}
