import { NextResponse } from 'next/server';
import { createCipheriv, randomBytes } from 'crypto';
import { requireUser } from '@/lib/serverAuth';

export const runtime = 'nodejs';

// ZEGOCLOUD "token04" generator (AES-GCM), so the Server Secret never reaches
// the browser. Env: ZEGOCLOUD_APP_ID (number) and ZEGOCLOUD_SERVER_SECRET
// (32 chars) - NOT NEXT_PUBLIC_*.
// NOTE: written from ZEGO's published token04 format and not yet verified
// against a live ZEGO project - test a call before relying on it, or swap in
// the official `zego-server-assistant` package.
function generateToken04(appId, userId, secret, effectiveSeconds, payload = '') {
  const ctime = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce: randomBytes(4).readInt32BE(0),
    ctime,
    expire: ctime + effectiveSeconds,
    payload,
  });

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(secret), iv);
  const encrypted = Buffer.concat([cipher.update(body, 'utf8'), cipher.final(), cipher.getAuthTag()]);

  const buf = Buffer.alloc(8 + 2 + iv.length + 2 + encrypted.length + 1);
  let o = 0;
  buf.writeBigInt64BE(BigInt(ctime + effectiveSeconds), o); o += 8;
  buf.writeUInt16BE(iv.length, o); o += 2;
  iv.copy(buf, o); o += iv.length;
  buf.writeUInt16BE(encrypted.length, o); o += 2;
  encrypted.copy(buf, o); o += encrypted.length;
  buf.writeUInt8(1, o); // 1 = AES-GCM
  return '04' + buf.toString('base64');
}

export async function POST(request) {
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError;

  const appId = Number(process.env.ZEGOCLOUD_APP_ID);
  const secret = process.env.ZEGOCLOUD_SERVER_SECRET;
  if (!appId || !secret || secret.length !== 32) {
    return NextResponse.json({ error: 'Video service is not configured' }, { status: 503 });
  }

  const { roomId } = await request.json();
  if (!roomId || !/^[A-Za-z0-9_\-]{1,64}$/.test(roomId)) {
    return NextResponse.json({ error: 'Invalid room id' }, { status: 400 });
  }

  const token = generateToken04(appId, user.uid, secret, 3600, JSON.stringify({ room_id: roomId }));
  return NextResponse.json({ token, appId, userId: user.uid });
}
