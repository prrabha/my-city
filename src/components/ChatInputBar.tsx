import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Paperclip, Camera, Mic, Send, X, StopCircle } from "lucide-react";

export type ChatAttachment = {
  kind: "file" | "image";
  file: File;
  previewUrl?: string;
};

export type ChatInputBarProps = {
  onSend: (payload: { text: string; attachments: ChatAttachment[]; voice?: Blob }) => void;
  placeholder?: string;
  disabled?: boolean;
  maxRows?: number;
  className?: string;
};

/**
 * Mobile-first sticky composer with keyboard avoidance.
 * Layout: [Attach] [Camera] [Textarea (auto-grow)] [Mic] [Send]
 *
 * Keyboard handling:
 *   The bar is fixed and uses `bottom: var(--kb-inset, 0px)` which is
 *   updated by <KeyboardAwareFocus /> via the Visual Viewport API.
 *   The result: the bar slides smoothly above the keyboard on iOS/Android.
 */
export function ChatInputBar({
  onSend,
  placeholder = "Message…",
  disabled,
  maxRows = 6,
  className = "",
}: ChatInputBarProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [recording, setRecording] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-grow textarea up to maxRows
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const lineH = parseFloat(getComputedStyle(ta).lineHeight || "20");
    const maxH = lineH * maxRows + 16;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
    ta.style.overflowY = ta.scrollHeight > maxH ? "auto" : "hidden";
  }, [text, maxRows]);

  const canSend = !disabled && (text.trim().length > 0 || attachments.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    onSend({ text: text.trim(), attachments });
    setText("");
    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = (files: FileList | null, kind: "file" | "image") => {
    if (!files) return;
    const next: ChatAttachment[] = Array.from(files).map((file) => ({
      kind,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...next].slice(0, 8));
  };

  const removeAt = (i: number) => {
    setAttachments((prev) => {
      const a = prev[i];
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onSend({ text: "", attachments: [], voice: blob });
      };
      recRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRec = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const iconBtn =
    "tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground";

  return (
    <div
      className={`fixed inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl ${className}`}
      style={{
        bottom: "var(--kb-inset, 0px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        transition: "bottom 180ms ease",
      }}
    >
      {attachments.length > 0 && (
        <div className="mx-auto flex max-w-xl gap-2 overflow-x-auto px-3 pt-2 no-scrollbar">
          {attachments.map((a, i) => (
            <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {a.previewUrl ? (
                <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-1 text-[10px] text-muted-foreground line-clamp-3">
                  {a.file.name}
                </div>
              )}
              <button
                onClick={() => removeAt(i)}
                aria-label="Remove"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-xl items-end gap-1 px-2 py-2">
        <button
          type="button"
          aria-label="Attach file"
          className={iconBtn}
          onClick={() => fileRef.current?.click()}
          disabled={disabled || recording}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Camera"
          className={iconBtn}
          onClick={() => camRef.current?.click()}
          disabled={disabled || recording}
        >
          <Camera className="h-5 w-5" />
        </button>

        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            addFiles(e.target.files, "file");
            e.target.value = "";
          }}
        />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            addFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />

        <div className="flex flex-1 items-end rounded-3xl bg-secondary px-3 py-1.5">
          {recording ? (
            <div className="flex h-9 flex-1 items-center gap-2 text-sm text-destructive">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Recording…
            </div>
          ) : (
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="block w-full resize-none bg-transparent py-1.5 text-base leading-5 placeholder:text-muted-foreground focus:outline-none md:text-sm"
              style={{ maxHeight: `${maxRows * 1.5}em` }}
            />
          )}
        </div>

        {canSend ? (
          <button
            type="button"
            onClick={handleSend}
            aria-label="Send"
            className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
          >
            <Send className="h-5 w-5" strokeWidth={2.25} />
          </button>
        ) : recording ? (
          <button
            type="button"
            onClick={stopRec}
            aria-label="Stop recording"
            className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <StopCircle className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={startRec}
            aria-label="Record voice"
            className={iconBtn}
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
