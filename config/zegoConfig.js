import { authFetch } from '@/utils/authFetch';

/**
 * Get a ZEGOCLOUD kit token for a session.
 *
 * CHANGED IN PHASE 2, AND THE CHANGE IS THE POINT.
 *
 * This used to take an arbitrary `roomId` and post it to `/api/zego-token`,
 * which minted a token for whatever room was named, for any signed-in user.
 * Nothing checked that the caller belonged in that room — so an account holder
 * with a room id could join a live call between a notary and a stranger, with
 * that stranger's identity documents on screen.
 *
 * It now takes a SESSION id. The server proves the caller is a participant of
 * that session, that the session is still open, and that its recorded
 * jurisdiction check passed, and then derives the room id itself. There is no
 * caller-supplied room id in the path any more.
 *
 * CONSEQUENCE FOR THE PHASE 1 PAGES: `components/SafeVideoCall.jsx` and
 * `components/ContainedVideoCall.jsx` pass whatever their `meetingId` prop
 * holds. Where that is not a real session id this now FAILS, with "No such
 * session". That is the correct outcome — those call sites were the ones
 * joining unverified rooms — and it fails closed rather than quietly
 * continuing to work.
 */
export async function fetchZegoKitToken(ZegoUIKitPrebuilt, sessionId, userName) {
  const response = await authFetch('/api/sessions/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Could not join the session.');
  }

  return ZegoUIKitPrebuilt.generateKitTokenForProduction(
    data.appId,
    data.token,
    // The room id the SERVER derived, never one chosen here.
    data.roomId,
    data.userId,
    userName,
  );
}
