import { useQuery } from "@tanstack/react-query";
import type { GetGalleryResponse } from "../types/api";
import { apiClient } from "@/lib/api-client";

export default function Gallery() {
  const { data, isLoading } = useQuery<GetGalleryResponse>({
    queryKey: ["gallery"],
    queryFn: async () => apiClient.get("/gallery").then(res => res.data || { images: [] }),
  });

  const images = data?.images ?? [];

  return (
    <section className="container py-12 md:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground mt-2">
          Photos from our initiatives. Admins can add more via the Admin panel.
        </p>
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground">Loading...</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <figure
            key={img.url}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <img
              src={img.url}
              alt={img.title}
              className="h-56 w-full object-cover"
            />
            <figcaption className="p-3 text-sm text-muted-foreground">
              {img.title}
            </figcaption>
          </figure>
        ))}
      </div>

      {images.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground mt-6">
          No images yet.
        </div>
      )}
    </section>
  );
}
