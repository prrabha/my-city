import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, MapPin, Phone, MessageCircle, Heart, Share2 } from "lucide-react";
import {
  startChatWith,
  togglePostLike,
  usePosts,
  timeAgo,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$postId")({
  head: () => ({ meta: [{ title: "Post — Loka" }] }),
  component: PostDetail,
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center">Post not found</div>
  ),
});

function PostDetail() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const posts = usePosts();
  const post = posts.find((p) => p.id === postId);

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
    const id = startChatWith(post.authorName, post.cityLabel);
    navigate({ to: "/inbox/$chatId", params: { chatId: id } });
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post.authorName, text: post.caption, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur-xl">
        <button
          onClick={() => history.length > 1 ? history.back() : navigate({ to: "/" })}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">Post</div>
        <button
          onClick={onShare}
          aria-label="Share"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <main className="mx-auto max-w-xl">
        <img src={post.image} alt={post.caption} className="aspect-square w-full object-cover" />

        <section className="px-5 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-lg font-semibold text-primary-foreground">
              {post.authorName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1 text-base font-bold">
                {post.authorName}
                <BadgeCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {post.cityLabel} · {timeAgo(post.createdAt)} ago
              </div>
            </div>
            <button
              onClick={() => togglePostLike(post.id)}
              className="tap ml-auto flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm"
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-destructive text-destructive" : ""}`} />
              {post.likes}
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
        </section>
      </main>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 px-3 py-3 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <a
            href={`tel:+91${post.authorMobile}`}
            className="tap flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Phone className="h-5 w-5" /> Call now
          </a>
          <button
            onClick={onMessage}
            className="tap flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold"
          >
            <MessageCircle className="h-5 w-5" /> Message
          </button>
        </div>
      </div>
    </div>
  );
}
