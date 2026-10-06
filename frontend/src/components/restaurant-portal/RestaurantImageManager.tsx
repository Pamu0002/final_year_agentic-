// UI-only redesign: Restyled restaurant image uploader section with photo cards and feedback toasts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader, MultiImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Save } from "lucide-react";

interface Props {
  initialImages: string[];
  initialProfileImageUrl: string | null;
  initialCoverImageUrl: string | null;
}

export function RestaurantImageManager({
  initialImages,
  initialProfileImageUrl,
  initialCoverImageUrl,
}: Props) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(initialProfileImageUrl);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialCoverImageUrl);
  const [images, setImages] = useState<string[]>(initialImages);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/proxy/restaurant-portal/restaurant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrls: images, profileImageUrl, coverImageUrl }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save photos"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Profile Image */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold text-foreground">Profile Logo / Avatar</p>
          <p className="text-[0.68rem] text-muted-foreground">Shown as the restaurant logo on search cards and detail headers.</p>
        </div>
        <div className="max-w-[180px]">
          <ImageUploader
            endpoint="restaurantImage"
            value={profileImageUrl}
            onChange={setProfileImageUrl}
            label="Upload Logo"
            aspectRatio="1/1"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold text-foreground">Cover Banner Photo</p>
          <p className="text-[0.68rem] text-muted-foreground">Full-width hero banner shown at the top of your restaurant profile.</p>
        </div>
        <ImageUploader
          endpoint="restaurantImage"
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          label="Upload Cover Photo"
          aspectRatio="16/5"
        />
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold text-foreground">Photo Gallery</p>
          <p className="text-[0.68rem] text-muted-foreground">Additional interior, dining room, and dish photos displayed in your gallery.</p>
        </div>
        <MultiImageUploader value={images} onChange={setImages} />
      </div>

      {error && <p className="text-xs font-bold text-destructive">{error}</p>}
      
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-5 h-10 shadow-sm"
        >
          <Save className="size-4 mr-1.5" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save All Photos"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-[#D4B57D]">
            <CheckCircle2 className="size-4" /> Imagery updated successfully!
          </span>
        )}
      </div>
    </div>
  );
}
