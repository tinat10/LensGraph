"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ProfileFormProps = {
  initialName: string;
  email: string | null;
  image: string | null;
  providers: string[];
  memberSince: string;
};

function getInitials(name: string, email: string | null) {
  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.[0]?.toUpperCase() ?? "?";
}

function formatProvider(provider: string) {
  if (provider === "github") return "GitHub";
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email & password";
  return provider;
}

export function ProfileForm({
  initialName,
  email,
  image,
  providers,
  memberSince,
}: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const initials = getInitials(name, email);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }

      await update({ user: { name: data.user.name } });
      setSuccess("Profile updated");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-paper-muted">
          {image ? (
            <Image
              src={image}
              alt={name || "Profile photo"}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-lg font-medium text-ink">{initials}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{name || "Unnamed"}</p>
          <p className="text-sm text-muted">{email ?? "No email on file"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-medium text-ink-secondary">
          Display name
        </label>
        <Input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-email" className="text-sm font-medium text-ink-secondary">
          Email
        </label>
        <Input
          id="profile-email"
          value={email ?? ""}
          readOnly
          className="bg-paper-muted text-muted"
        />
        <p className="text-xs text-subtle">
          Email is managed by your sign-in provider and cannot be changed here.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-line bg-paper-muted/40 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">
            Member since
          </p>
          <p className="mt-1 text-sm text-ink">
            {new Date(memberSince).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">
            Sign-in methods
          </p>
          <p className="mt-1 text-sm text-ink">
            {providers.length > 0
              ? providers.map(formatProvider).join(", ")
              : "Email & password"}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
