"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setAvatarUrl } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

const MAX_BYTES = 2 * 1024 * 1024;

export function AvatarUploader({ userId, name, url }: { userId: string; name: string; url: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Usá una foto JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La foto pesa más de 2 MB. Probá con una más liviana.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const ext = file.type.split("/")[1];
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) {
        setError("No pudimos subir la foto. Probá de nuevo.");
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await setAvatarUrl(data.publicUrl);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="relative rounded-full"
        aria-label="Cambiar foto de perfil"
      >
        <Avatar name={name} url={url} size={88} />
        <span className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-4 border-bg bg-accent text-accent-ink">
          {pending ? <Spinner /> : <Camera className="size-4" />}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
