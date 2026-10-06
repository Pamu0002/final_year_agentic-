// UI-only redesign: Restyled guest reviews page with rating summary badges, user avatars, and photo cards
import { Suspense } from "react";
import Image from "next/image";
import { Star, MessageSquare, Calendar, Sparkles } from "lucide-react";
import { serverFetch } from "@/lib/server/api";
import { PaginationBar } from "@/components/admin/PaginationBar";
import { ReviewReplyForm } from "@/components/restaurant-portal/ReviewReplyForm";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  imageUrls: string;
  createdAt: string;
  reply: string | null;
  user: { name: string | null; email: string };
  reservation: { date: string; time: string } | null;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  avgRating: number | null;
  totalReviews: number;
}

interface SearchParams { page?: string; rating?: string }

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default async function PortalReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page: pageParam, rating } = await searchParams;
  const page = Number(pageParam ?? 1);
  const limit = 25;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(rating ? { rating } : {}),
  });

  const result = await serverFetch<ReviewsResponse>(
    `restaurant-portal/reviews?${params.toString()}`
  );

  const parseImageUrls = (raw: string): string[] => {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  };

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Guest reviews"
        description={`${result.totalReviews} guest experiences, feedback, and restaurant replies.`}
        actions={result.avgRating != null ? (
          <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20 px-5 py-3 shadow-xs">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-sans leading-none">{result.avgRating.toFixed(1)}</p>
              <p className="text-[0.66rem] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mt-1">{result.totalReviews} reviews</p>
            </div>
            <div className="h-8 w-px bg-amber-500/30" />
            <StarDisplay rating={Math.round(result.avgRating)} size="lg" />
          </div>
        ) : undefined}
      />

      {/* Rating filter */}
      <Suspense>
        <div className="flex flex-wrap gap-2">
          <a
            href="?page=1"
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 shadow-2xs",
              !rating
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "border-border/80 bg-card text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
            )}
          >
            All Ratings
          </a>
          {[5, 4, 3, 2, 1].map((r) => (
            <a
              key={r}
              href={`?page=1&rating=${r}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 shadow-2xs",
                rating === String(r)
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "border-border/80 bg-card text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
              )}
            >
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{r} Stars</span>
            </a>
          ))}
        </div>
      </Suspense>

      {/* Reviews list */}
      {result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-center shadow-xs">
          <Star className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No reviews found</p>
          <p className="text-xs text-muted-foreground">Guest feedback for completed dining reservations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {result.data.map((review) => {
            const images = parseImageUrls(review.imageUrls);
            const name = review.user.name?.trim() || review.user.email.split("@")[0];
            const initial = name[0]?.toUpperCase() || "R";

            return (
              <div
                key={review.id}
                className="group rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-sm font-extrabold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{review.user.name ?? "Guest"}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{review.user.email}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    {review.reservation && (
                      <p className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1">
                        <Calendar className="size-3 text-emerald-600" />
                        Visit: {new Date(review.reservation.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })} at {review.reservation.time}
                      </p>
                    )}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-foreground leading-relaxed font-sans">{review.comment}</p>
                )}

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {images.map((url, i) => (
                      <div key={i} className="relative size-20 rounded-xl overflow-hidden border border-border/80 shadow-xs transition-transform hover:scale-105">
                        <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                )}

                {review.reply && (
                  <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground mt-3">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">Restaurant Response:</span>
                    {review.reply}
                  </div>
                )}

                <div className="pt-3">
                  <ReviewReplyForm reviewId={review.id} existingReply={review.reply} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Suspense>
        <PaginationBar page={page} total={result.total} limit={limit} />
      </Suspense>
    </div>
  );
}
