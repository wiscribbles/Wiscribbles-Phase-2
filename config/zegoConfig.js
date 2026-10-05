import { authFetch } from '@/utils/authFetch';

// ZEGOCLOUD credentials are NOT kept in the browser. The server route
// /api/zego-token signs a short-lived token for the signed-in user; the
// server secret stays in ZEGOCLOUD_SERVER_SECRET (never NEXT_PUBLIC_*).
export async function fetchZegoKitToken(ZegoUIKitPrebuilt, roomId, userName) {
  const res = await authFetch('/api/zego-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not get video token');
  return ZegoUIKitPrebuilt.generateKitTokenForProduction(
    data.appId,
    data.token,
    roomId,
    data.userId,
    userName
  );
}
