import Link from "next/link";
import { auth, signOut } from "@/lib/auth/auth";
import { Button } from "@/components/ui/Button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="page-shell flex h-[4.25rem] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[10px] font-bold tracking-[0.2em] text-surface shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]">
            LG
          </span>
          <span className="font-display text-xl tracking-tight text-ink">
            LensGraph
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/stories"
            className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-accent-soft hover:text-ink"
          >
            Explore
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-paper-muted hover:text-ink"
              >
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/signin">
              <Button variant="secondary">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
