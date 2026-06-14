"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  if (email) {
    return email[0]?.toUpperCase() ?? "?";
  }

  return "?";
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(name, email);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-paper-muted transition hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10"
      >
        {image ? (
          <Image
            src={image}
            alt={name ?? "Profile"}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-sm font-medium text-ink">{initials}</span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 min-w-[14rem] overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-[0_16px_40px_rgb(28_25_23/0.12)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">
              {name ?? "Your account"}
            </p>
            {email ? (
              <p className="truncate text-xs text-muted">{email}</p>
            ) : null}
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink transition hover:bg-paper-muted"
          >
            Profile
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-paper-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
