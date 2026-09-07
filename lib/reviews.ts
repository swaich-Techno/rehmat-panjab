import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";

export type PublicReview = {
  id: string;
  displayName: string;
  rating: number;
  title: string;
  body: string;
  imageUrl: string | null;
  verifiedPurchase: boolean;
  helpfulCount: number;
  adminResponse: string | null;
  createdAt: string;
};

export type ReviewSummary = {
  average: number;
  total: number;
  breakdown: Record<number, number>;
  reviews: PublicReview[];
  submissionsEnabled: boolean;
};

export async function getProductReviewSummary(productId: string, productReviewsEnabled: boolean): Promise<ReviewSummary> {
  const empty: ReviewSummary = { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [], submissionsEnabled: false };
  const client = await createSupabaseServerClient();
  if (!client) return empty;
  const supabase = client as unknown as SupabaseClient;
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.from("public_product_reviews").select("id,display_name,rating,title,body,image_path,verified_purchase,helpful_count,admin_response,created_at").eq("product_id", productId).order("created_at", { ascending: false }),
    supabase.from("review_settings").select("submissions_enabled").eq("id", true).maybeSingle(),
  ]);
  if (error) return { ...empty, submissionsEnabled: Boolean(settings?.submissions_enabled && productReviewsEnabled) };
  const reviews = (data ?? []).map((review) => ({
    id: String(review.id), displayName: String(review.display_name), rating: Number(review.rating), title: String(review.title), body: String(review.body),
    imageUrl: review.image_path ? `/api/review-images/${review.id}` : null,
    verifiedPurchase: Boolean(review.verified_purchase), helpfulCount: Number(review.helpful_count ?? 0), adminResponse: review.admin_response ? String(review.admin_response) : null, createdAt: String(review.created_at),
  }));
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => { breakdown[review.rating as keyof typeof breakdown] += 1; });
  return {
    average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    total: reviews.length, breakdown, reviews,
    submissionsEnabled: Boolean(settings?.submissions_enabled && productReviewsEnabled),
  };
}
