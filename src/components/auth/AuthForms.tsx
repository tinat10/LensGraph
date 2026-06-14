import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GitHubIcon, GoogleIcon } from "@/components/auth/OAuthIcons";
import {
  signInWithCredentials,
  signInWithGitHub,
  signInWithGoogle,
  signUpWithCredentials,
} from "@/lib/auth/actions";

type AuthFormProps = {
  errorMessage?: string | null;
};

export function AuthDivider() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface px-3 text-xs tracking-wide text-subtle uppercase">
          Or continue with
        </span>
      </div>
    </div>
  );
}

export function OAuthButtons({ googleAuthEnabled = true }: { googleAuthEnabled?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <form action={signInWithGitHub}>
        <Button type="submit" variant="secondary" className="w-full gap-2.5">
          <GitHubIcon className="h-5 w-5" />
          Continue with GitHub
        </Button>
      </form>
      {googleAuthEnabled ? (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="secondary" className="w-full gap-2.5">
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </Button>
        </form>
      ) : (
        <Button type="button" variant="secondary" className="w-full gap-2.5" disabled>
          <GoogleIcon className="h-5 w-5 opacity-50" />
          Google unavailable
        </Button>
      )}
    </div>
  );
}

export function SignInForm({ errorMessage }: AuthFormProps) {
  return (
    <div>
      {errorMessage ? (
        <p className="mb-4 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-ink-secondary">
          {errorMessage}
        </p>
      ) : null}
      <form action={signInWithCredentials} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in with email
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm({ errorMessage }: AuthFormProps) {
  return (
    <div>
      {errorMessage ? (
        <p className="mb-4 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-ink-secondary">
          {errorMessage}
        </p>
      ) : null}
      <form action={signUpWithCredentials} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
            Name
          </label>
          <Input id="name" name="name" type="text" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-2 text-xs text-subtle">At least 8 characters</p>
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
    </div>
  );
}
