const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  InvalidCredentials: "Enter a valid email and password.",
  Configuration:
    "Sign-in is misconfigured. Check AUTH_URL and OAuth callback URLs on the server.",
  AccessDenied: "Access was denied. You may have cancelled sign-in.",
  OAuthSignin: "Could not start OAuth sign-in. Try again.",
  OAuthCallback: "OAuth callback failed. Check your provider callback URL settings.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use that provider instead.",
  CallbackRouteError: "Sign-in callback failed. Try again.",
  Default: "Sign-in failed. Try again.",
};

export function getAuthErrorMessage(error?: string | null): string | null {
  if (!error) {
    return null;
  }

  const decoded = decodeURIComponent(error);
  return AUTH_ERROR_MESSAGES[decoded] ?? AUTH_ERROR_MESSAGES[error] ?? decoded;
}
