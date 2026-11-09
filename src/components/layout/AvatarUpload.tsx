import { Camera } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Avatar } from "../Avatar";
import { BTN_GHOST, FOCUS } from "../ui";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_SIDE = 256;
const MAX_SIDE = 512;

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unreadable file")));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file is not a valid image"));
    img.src = src;
  });

/** Center-crops to a square and caps at 512px so the stored Data URL stays small. */
function normalize(img: HTMLImageElement): { dataUrl: string; smallSource: boolean } | null {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const out = Math.min(MAX_SIDE, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
  let dataUrl = canvas.toDataURL("image/webp", 0.9);
  if (!dataUrl.startsWith("data:image/webp")) dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { dataUrl, smallSource: side < MIN_SIDE };
}

export function AvatarUpload() {
  const { user, updateAvatar } = useAuth();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    setNote(null);

    if (!ACCEPTED_TYPES.includes(file.type) || !ACCEPTED_EXT.test(file.name)) {
      setError("Use a JPG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is larger than 2 MB. Choose a smaller file");
      return;
    }

    setBusy(true);
    try {
      const img = await loadImage(await readAsDataURL(file));
      const result = normalize(img);
      if (!result) {
        setError("Could not process this image");
        return;
      }
      const saved = updateAvatar(result.dataUrl);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      if (result.smallSource) setNote(`Photo is under ${MIN_SIDE}px and may look soft. ${MIN_SIDE}–${MAX_SIDE}px works best`);
      toast.avatarUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this image");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    const r = updateAvatar(null);
    if (!r.ok) setError(r.error);
    else toast.push({ kind: "info", title: "Profile picture removed" });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile picture"
        className={`relative h-24 w-24 shrink-0 rounded-full disabled:opacity-60 ${FOCUS}`}
      >
        <Avatar name={user.name} src={user.avatarUrl} size={96} />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-blue-600 text-white"
        >
          <Camera className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={onPick}
      />
      <div className="min-w-0 text-sm">
        <p className="text-slate-300">JPG, PNG or WebP, up to 2 MB</p>
        <p className="text-slate-400">Best at 256–512 px, square</p>
        {user.avatarUrl && (
          <button type="button" onClick={remove} className={`${BTN_GHOST} mt-2`}>
            Remove photo
          </button>
        )}
        {error && (
          <p role="alert" className="mt-2 text-rose-300">
            {error}
          </p>
        )}
        {note && !error && (
          <p role="status" className="mt-2 text-amber-300">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
