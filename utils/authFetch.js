import { auth } from '@/firebase';

// fetch() wrapper that attaches the signed-in user's Firebase ID token.
export async function authFetch(input, init = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in');
  const token = await user.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
