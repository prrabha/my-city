import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Share2, MapPin, Bookmark, BadgeCheck, MessageCircle, Phone } from "lucide-react";
import { GoogleMapsPinIcon, googleMapsUrlForPost } from "@/components/GoogleMapsPinIcon";
import {
  type Post,
  togglePostSave,
  toggleLike,
  incrementShares,
  timeAgo,
  distanceLabel,
  useUser,
  postImages,
} from "@/lib/store";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Avatar } from "@/components/Avatar";

export function PostCard({ post }: { post: Post }) {
  const user = useUser();
  const dist = distanceLabel(post, user);

  // Optimistic local state for like/share to avoid waiting on realtime
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [shares, setShares] = useState(post.sharesCount);
  const [bump, setBump] = useState(false);

  // Keep local state in sync when prop changes (e.g. after a refresh)
  if (post.liked !== liked && post.likes !== likes) {
    // no-op: avoid unnecessary updates
  }

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    setBump(true);
    setTimeout(() => setBump(false), 220);
    const confirmed = await toggleLike(post.id, !next);
    if (confirmed !== next) {
      // revert on failure
      setLiked(confirmed);
      setLikes((n) => Math.max(0, n + (confirmed ? 1 : -1) - (next ? 1 : -1)));
    }
  };

  const onShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorDisplayName, text: post.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
      setShares((n) => n + 1);
      incrementShares(post.id, shares).catch(() => {});
    } catch {
      /* user cancelled */
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-card">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size={40} />
          <div className="leading-tight">
            <div className="flex items-center gap-1 text-sm font-semibold">
              {post.authorDisplayName}
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{post.cityLabel}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)} ago</span>
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

      {/* Action bar (Instagram-style) */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-1">
          <button
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
            onClick={onLike}
            className="tap flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
          >
            <Heart
              className={`h-6 w-6 transition-transform ${bump ? "scale-125" : "scale-100"} ${
                liked ? "fill-red-500 text-red-500" : "text-foreground/70"
              }`}
              strokeWidth={2}
            />
            <span className="min-w-4 text-sm font-semibold tabular-nums">{likes}</span>
          </button>

          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            search={{ focus: "comment" }}
            aria-label="Comments"
            className="tap flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
          >
            <MessageCircle className="h-6 w-6 text-foreground/70" strokeWidth={2} />
            <span className="min-w-4 text-sm font-semibold tabular-nums">{post.commentsCount}</span>
          </Link>

          <button
            aria-label="Share"
            onClick={onShare}
            className="tap flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
          >
            <Share2 className="h-6 w-6 text-foreground/70" strokeWidth={2} />
            <span className="min-w-4 text-sm font-semibold tabular-nums">{shares}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="Save"
            onClick={() => togglePostSave(post.id)}
            className="tap flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <Bookmark className={`h-5 w-5 ${post.saved ? "fill-foreground" : ""}`} />
          </button>
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
      </div>

      {/* Caption */}
      <div className="px-4 pb-4 pt-1">
        <p className="mt-1 line-clamp-3 text-sm text-foreground/90">
          <span className="font-semibold">{post.authorDisplayName}</span>{" "}
          <span className="text-foreground/80">{post.caption}</span>
        </p>
        <div className="mt-2 flex items-center justify-between">
          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            className="inline-block text-xs font-medium text-primary"
          >
            Open post →
          </Link>
          <div className="flex items-center gap-1">
            <a
              href={`tel:${post.authorMobile}`}
              aria-label="Call seller"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground"
            >
              <Phone className="h-4 w-4" strokeWidth={2} />
            </a>
            <Link
              to="/inbox/$chatId"
              params={{ chatId: post.userId }}
              aria-label="Message seller"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
