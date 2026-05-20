import { Link } from "@tanstack/react-router";
import { Heart, Share2, MapPin, Bookmark, BadgeCheck, MessageCircle } from "lucide-react";
import { GoogleMapsPinIcon, googleMapsUrlForPost } from "@/components/GoogleMapsPinIcon";
import {
  type Post,
  togglePostLike,
  togglePostSave,
  timeAgo,
  distanceLabel,
  useUser,
  postImages,
} from "@/lib/store";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";

export function PostCard({ post }: { post: Post }) {
  const user = useUser();
  const dist = distanceLabel(post, user);
  const onShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-card">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-semibold">
            {post.authorName.charAt(0)}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1 text-sm font-semibold">
              {post.authorName}
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{post.cityLabel}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {dist && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {dist}
            </span>
          )}
          {post.category && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              {post.category}
            </span>
          )}
        </div>
      </header>

      {/* Images */}
      <div className="mt-3 block">
        <Link to="/post/$postId" params={{ postId: post.id }} aria-label="Open post" className="block">
          <ImageCarousel images={postImages(post)} alt={post.caption} />
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <button
            aria-label="Like"
            onClick={() => togglePostLike(post.id)}
            className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <Heart
              className={`h-5 w-5 ${post.liked ? "fill-destructive text-destructive" : ""}`}
            />
          </button>
          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            aria-label="Comment"
            className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <button
            aria-label="Share"
            onClick={onShare}
            className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            aria-label="Save"
            onClick={() => togglePostSave(post.id)}
            className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <Bookmark className={`h-5 w-5 ${post.saved ? "fill-foreground" : ""}`} />
          </button>
        </div>
        <a
          href={googleMapsUrlForPost(post)}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in Google Maps"
          className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary active:bg-secondary/80"
        >
          <GoogleMapsPinIcon className="h-5 w-5 text-foreground" />
        </a>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4 pt-1">
        <div className="text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
        <p className="mt-1 line-clamp-3 text-sm text-foreground/90">
          <span className="font-semibold">{post.authorName}</span>{" "}
          <span className="text-foreground/80">{post.caption}</span>
        </p>
        <Link
          to="/post/$postId"
          params={{ postId: post.id }}
          className="mt-1 inline-block text-xs font-medium text-primary"
        >
          Open post →
        </Link>
      </div>
    </article>
  );
}
