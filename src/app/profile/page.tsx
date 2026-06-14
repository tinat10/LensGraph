import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/services/user.service";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect("/signin");
  }

  const providers = user.accounts.map((account) => account.provider);
  if (user.passwordHash && !providers.includes("credentials")) {
    providers.push("credentials");
  }

  return (
    <>
      <Header />
      <main className="page-shell py-10 lg:py-12">
        <div className="mb-8 space-y-3">
          <Link
            href="/dashboard"
            className="inline-block text-sm text-muted transition hover:text-ink"
          >
            ← Back to my dashboard
          </Link>
          <div>
            <p className="eyebrow mb-3">Profile</p>
            <h1 className="font-display text-4xl tracking-tight text-ink">
              Account settings
            </h1>
          </div>
        </div>

        <div className="surface-panel max-w-xl p-6 sm:p-8">
          <ProfileForm
            initialName={user.name ?? ""}
            email={user.email}
            image={user.image}
            providers={providers}
            memberSince={user.createdAt.toISOString()}
          />
        </div>
      </main>
    </>
  );
}
