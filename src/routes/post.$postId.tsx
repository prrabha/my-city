import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  Map as MapIcon,
  Send,
  Heart,
} from "lucide-react";
import { GoogleMapsPinIcon, googleMapsUrlForPost } from "@/components/GoogleMapsPinIcon";
import {
  startChatWith,
  usePosts,
  timeAgo,
  postImages,
  usePostComments,
  addPostComment,
  toggleLike,
  incrementShares,
  useUser,
} from "@/lib/store";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$postId")({
  head: () => ({ meta: [{ title: "Post — Loka" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    focus: s.focus === "comment" ? ("comment" as const) : undefined,
  }),
  component: PostDetail,
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center">Post not found</div>
  ),
});

function PostDetail() {
  const { postId } = Route.useParams();
  const { focus } = Route.useSearch();
  const navigate = useNavigate();
  const posts = usePosts();
  const user = useUser();
  const post = posts.find((p) => p.id === postId);
  const comments = usePostComments(postId);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (post) {
      setLiked(post.liked);
      setLikes(post.likes);
      setShares(post.sharesCount);
    }
  }, [post?.id, post?.liked, post?.likes, post?.sharesCount]);

  useEffect(() => {
    if (focus === "comment") {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [focus]);

  if (!post) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Post not found</p>
        <Link to="/" className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          Back to feed
        </Link>
      </div>
    );
  }

  const onMessage = () => {
    const id = startChatWith(post.authorDisplayName, post.cityLabel);
    navigate({ to: "/inbox/$chatId", params: { chatId: id } });
  };

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    setBump(true);
    setTimeout(() => setBump(false), 220);
    const confirmed = await toggleLike(post.id, !next);
    if (confirmed !== next) {
      setLiked(confirmed);
      setLikes((n) => Math.max(0, n + (confirmed ? 1 : -1) - (next ? 1 : -1)));
    }
  };

  const onShare = async () => {
    const url = window.location.href;
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
      /* cancelled */
    }
  };

  const submitComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const t = text;
    setText("");
    await addPostComment(post.id, t, user?.name ?? "You");
  };

  return (
    <div className="min-h-dvh bg-background pb-40">
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-3">
        <button
          onClick={() => history.length > 1 ? history.back() : navigate({ to: "/" })}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">Post</div>
        <button
          onClick={onShare}
          aria-label="Share"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <main className="mx-auto max-w-xl">
        <ImageCarousel images={postImages(post)} alt={post.caption} />

        <section className="px-5 pt-4">
          <div className="flex items-center gap-3">
            <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size={48} />
            <div>
              <div className="flex items-center gap-1 text-base font-bold">
                {post.authorDisplayName}
                <BadgeCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {post.cityLabel} · {timeAgo(post.createdAt)} ago
              </div>
            </div>
            <a
              href={googleMapsUrlForPost(post)}
              target="_blank"
              rel="noreferrer"
              aria-label="Open in Google Maps"
              className="tap ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 active:bg-secondary/70"
            >
              <GoogleMapsPinIcon className="h-5 w-5 text-foreground" />
            </a>
          </div>

          {/* Like / Comment / Share bar */}
          <div className="mt-4 flex items-center gap-1 border-y border-border/60 py-2">
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
            <button
              onClick={() => inputRef.current?.focus()}
              aria-label="Comments"
              className="tap flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
            >
              <MessageCircle className="h-6 w-6 text-foreground/70" strokeWidth={2} />
              <span className="min-w-4 text-sm font-semibold tabular-nums">{comments.length}</span>
            </button>
            <button
              onClick={onShare}
              aria-label="Share"
              className="tap flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
            >
              <Share2 className="h-6 w-6 text-foreground/70" strokeWidth={2} />
              <span className="min-w-4 text-sm font-semibold tabular-nums">{shares}</span>
            </button>
          </div>

          {post.category && (
            <div className="mt-4">
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                {post.category}
              </span>
            </div>
          )}

          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {post.caption}
          </p>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                >
                  #{h}
                </span>
              ))}
            </div>
          )}

          {post.geo && (
            <Link
              to="/post/$postId/map"
              params={{ postId: post.id }}
              className="tap mt-5 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapIcon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Open map</div>
                  <div className="text-xs text-muted-foreground">
                    {post.geo.area ? `${post.geo.area}, ` : ""}
                    {post.geo.city ?? post.cityLabel}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-primary">View →</span>
            </Link>
          )}

          {/* Comments */}
          <div ref={commentsRef} className="mt-6">
            <h2 className="text-sm font-bold">
              Comments <span className="text-muted-foreground">({comments.length})</span>
            </h2>
            <div className="mt-3 space-y-3">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">Be the first to comment.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author} size={32} />
                  <div className="min-w-0 flex-1 rounded-2xl bg-secondary px-3 py-2">
                    <div className="text-xs font-semibold">{c.author}</div>
                    <p className="text-sm leading-snug">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Sticky actions + comment composer */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur-xl safe-bottom"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + var(--kb-inset, 0px))" }}
      >
        <div className="mx-auto max-w-xl space-y-2">
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              enterKeyHint="send"
              inputMode="text"
              className="h-11 flex-1 rounded-full border border-border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              aria-label="Send comment"
              disabled={!text.trim()}
              className="tap flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <div className="flex items-center gap-2">
            <a
              href={`tel:+91${post.authorMobile}`}
              className="tap flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow"
            >
              <Phone className="h-5 w-5" /> Call
            </a>
            <button
              onClick={onMessage}
              className="tap flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold"
            >
              <MessageCircle className="h-5 w-5" /> Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
