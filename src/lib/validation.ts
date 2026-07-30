export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_RE.test(value)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Password must include a letter and a number";
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Full name is required";
  if (value.length < 2) return "Name is too short";
  if (value.length > 80) return "Name is too long";
  return null;
}

/** Maps Supabase auth errors to friendly copy. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Confirm your email address first, then sign in.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("password")) return message;
  if (m.includes("failed to fetch")) return "Network problem — check your connection and retry.";
  return message;
}
