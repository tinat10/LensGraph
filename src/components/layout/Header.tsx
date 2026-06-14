import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/Button";

const navLinkClass =
  "rounded-full px-4 py-2 text-sm text-muted transition hover:bg-paper-muted hover:text-ink";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="page-shell flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[10px] font-bold tracking-[0.2em] text-surface shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]">
            LG
          </span>
          <span className="font-display text-xl tracking-tight text-ink">
            LensGraph
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/stories" className={navLinkClass}>
            Explore
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className={navLinkClass}>
                My dashboard
              </Link>
              <Link href="/profile" className={navLinkClass}>
                Profile
              </Link>
              <div className="ml-1 border-l border-line pl-2 sm:ml-2 sm:pl-3">
                <UserMenu
                  name={session.user.name}
                  email={session.user.email}
                  image={session.user.image}
                />
              </div>
            </>
          ) : (
            <Link href="/signin" className="ml-1">
              <Button variant="secondary">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
