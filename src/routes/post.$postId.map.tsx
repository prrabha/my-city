import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { usePosts } from "@/lib/store";
import { PostMap } from "@/components/PostMap";

export const Route = createFileRoute("/post/$postId/map")({
  head: () => ({ meta: [{ title: "Map — Loka" }] }),
  component: PostMapPage,
});

function PostMapPage() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const posts = usePosts();
  const post = posts.find((p) => p.id === postId);

  if (!post || !post.geo) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base font-semibold">No location for this post</p>
        <Link
          to="/post/$postId"
          params={{ postId }}
          className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
        >
          Back to post
        </Link>
      </div>
    );
  }

  const { geo } = post;
  const osmUrl = `https://www.openstreetmap.org/directions?from=&to=${geo.lat}%2C${geo.lng}#map=15/${geo.lat}/${geo.lng}`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur-xl">
        <button
          onClick={() => (history.length > 1 ? history.back() : navigate({ to: "/" }))}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">Location</div>
        <div className="w-10" />
      </header>

      <div className="flex-1">
        <PostMap pin={geo} height={typeof window !== "undefined" ? window.innerHeight - 220 : 480} />
      </div>

      <div className="border-t border-border/60 bg-card px-4 py-3 safe-bottom">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-primary" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">
              {geo.area ? `${geo.area}, ` : ""}
              {geo.city ?? post.cityLabel}
              {geo.state ? `, ${geo.state}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
            </div>
          </div>
          <a
            href={osmUrl}
            target="_blank"
            rel="noreferrer"
            className="tap rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
          >
            Directions
          </a>
        </div>
      </div>
    </div>
  );
}
