const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  InvalidCredentials: "Enter a valid email and password.",
};

export function getAuthErrorMessage(error?: string | null): string | null {
  if (!error) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[error] ?? decodeURIComponent(error);
}
