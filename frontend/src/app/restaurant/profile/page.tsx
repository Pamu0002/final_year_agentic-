// UI-only redesign: Restyled restaurant profile page with elevated details card and badges
import { serverFetch } from "@/lib/server/api";
import { Badge } from "@/components/ui/badge";
import { RestaurantImageManager } from "@/components/restaurant-portal/RestaurantImageManager";
import { Building2, Star, ShieldCheck, MapPin, Phone, Mail, Globe, Image as ImageIcon } from "lucide-react";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { cn } from "@/lib/utils";

interface MyRestaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  area: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  cuisineTypes: string[];
  imageUrls: string[];
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  priceRange: string;
  isActive: boolean;
  isVerified: boolean;
  avgRating: number | null;
  totalReviews: number;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
}

export default async function PortalProfilePage() {
  let r: MyRestaurant | null = null;
  try {
    r = await serverFetch<MyRestaurant>("restaurant-portal/restaurant");
  } catch {
    // no restaurant associated yet
  }

  if (!r) {
    return (
      <div className="space-y-7 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <PortalPageHeader title="Restaurant Profile" description="Manage how your restaurant appears to guests." />
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card py-20 text-center shadow-xs">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D]">
            <Building2 className="size-8" />
          </div>
          <div>
            <p className="font-bold text-base text-foreground">No restaurant linked</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your account hasn&apos;t been assigned to a restaurant yet.
              <br />Contact the platform admin to get set up.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Restaurant Profile"
        description={`Manage the guest-facing information and imagery for ${r.name}.`}
      />

      {/* Photos */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" /> Restaurant Imagery
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a profile logo, a cover banner, and additional gallery photos for customers.
          </p>
        </div>
        <RestaurantImageManager
          initialImages={Array.isArray(r.imageUrls) ? r.imageUrls : []}
          initialProfileImageUrl={r.profileImageUrl ?? null}
          initialCoverImageUrl={r.coverImageUrl ?? null}
        />
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/70 bg-muted/30">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-5 text-primary" /> Basic Details & Settings
          </h2>
        </div>
        <dl className="divide-y divide-border/60 px-6">
          <Field label="Name" value={r.name} />
          <Field label="Description" value={r.description ?? "—"} />
          <Field label="Address" value={<span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{r.address}</span>} />
          <Field label="Area" value={r.area} />
          <Field label="Phone" value={r.phone ? <span className="flex items-center gap-1.5 font-mono"><Phone className="size-4 text-primary" />{r.phone}</span> : "—"} />
          <Field label="Email" value={r.email ? <span className="flex items-center gap-1.5"><Mail className="size-4 text-primary" />{r.email}</span> : "—"} />
          <Field label="Website" value={r.website ? <span className="flex items-center gap-1.5"><Globe className="size-4 text-primary" />{r.website}</span> : "—"} />
          <Field
            label="Cuisine Types"
            value={
              <div className="flex flex-wrap gap-1.5">
                {r.cuisineTypes.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[0.68rem] font-bold uppercase tracking-wider rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D]">
                    {c}
                  </Badge>
                ))}
              </div>
            }
          />
          <Field label="Price Range" value={<span className="font-mono font-bold">{r.priceRange.replace("_", " ")}</span>} />
          <Field
            label="Status"
            value={
              <div className="flex gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
                    r.isActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D] border-primary/30"
                      : "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30"
                  )}
                >
                  <span className={cn("size-2 rounded-full", r.isActive ? "bg-primary" : "bg-rose-500")} />
                  {r.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
                    r.isVerified
                      ? "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/30"
                      : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30"
                  )}
                >
                  <ShieldCheck className="size-3.5" />
                  {r.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            }
          />
          <Field
            label="Rating"
            value={r.avgRating != null ? <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400"><Star className="size-4 fill-amber-400 text-amber-400" /> {r.avgRating.toFixed(1)} ({r.totalReviews} reviews)</span> : "No ratings yet"}
          />
        </dl>
      </div>
    </div>
  );
}
