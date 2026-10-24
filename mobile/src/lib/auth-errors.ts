export function authMessage(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') return 'Choose a password with at least 6 characters.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a little and try again.';
  if (code === 'auth/network-request-failed') return 'Check your connection and try again.';
  if (code === 'auth/email-already-in-use') return 'This email already has an account. Try signing in or resetting your password.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'We could not sign you in. Check your email and password.';
  return 'That didn’t go through. Please try again.';
}
