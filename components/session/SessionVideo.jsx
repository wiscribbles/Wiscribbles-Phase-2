'use client';

/**
 * The video half of a session.
 *
 * ZEGOCLOUD's UIKit Prebuilt, mounted into a container we control rather than
 * taking over the screen. The document has to be visible at the same time as
 * the call — that is the whole point of a remote notarisation — so the UIKit
 * runs in a panel, with the sharing, whiteboard and layout controls it adds by
 * default turned off. They compete with the document for space and none of them
 * is wanted here.
 *
 * The token is fetched by SESSION id. There is no room id to pass: the server
 * derives it after proving the caller is a participant. See `config/zegoConfig`.
 */

import { useEffect, useRef, useState } from 'react';
import { COLORS, RADIUS } from '@/lib/theme';

export default function SessionVideo({ sessionId, userName, onJoined }) {
  const container = useRef(null);
  const started = useRef(false);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    // The UIKit mutates the DOM node it is given; joining twice in one node
    // leaves two overlapping calls. React 18's development double-effect makes
    // that the default behaviour without this guard.
    if (started.current || !container.current) return undefined;
    started.current = true;

    let instance = null;
    let cancelled = false;

    (async () => {
      try {
        const [{ ZegoUIKitPrebuilt }, { fetchZegoKitToken }] = await Promise.all([
          import('@zegocloud/zego-uikit-prebuilt'),
          import('@/config/zegoConfig'),
        ]);

        const kitToken = await fetchZegoKitToken(ZegoUIKitPrebuilt, sessionId, userName);
        if (cancelled) return;

        instance = ZegoUIKitPrebuilt.create(kitToken);

        instance.joinRoom({
          container: container.current,
          scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
          showPreJoinView: false,

          /* Everything that would fight the document for attention is off. */
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          showRoomDetailsButton: false,
          showLayoutButton: false,
          showPinButton: false,
          maxUsers: 2,

          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,

          onJoinRoom: () => {
            if (!cancelled) {
              setJoining(false);
              onJoined?.();
            }
          },
          onLeaveRoom: () => {
            if (!cancelled) setJoining(false);
          },
        });
      } catch (joinError) {
        if (!cancelled) {
          setError(joinError?.message ?? 'Could not join the call.');
          setJoining(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        instance?.destroy?.();
      } catch {
        /* Nothing useful to do if teardown fails. */
      }
    };
  }, [sessionId, userName, onJoined]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        background: COLORS.brandDark,
        minHeight: 320,
        height: '100%',
      }}
    >
      <div ref={container} style={{ width: '100%', height: '100%', minHeight: 320 }} />

      {(joining || error) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: COLORS.brandDark,
            color: COLORS.white,
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          {error ? (
            <div style={{ maxWidth: '38ch' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                The call could not start
              </p>
              <p style={{ fontSize: '0.86rem', opacity: 0.85, marginBottom: 0 }}>{error}</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: 0 }}>
              Connecting…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
