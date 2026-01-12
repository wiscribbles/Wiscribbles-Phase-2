'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { getZegoConfig, validateZegoConfig } from '../config/zegoConfig';

const ContainedVideoCall = ({ 
  meetingId, 
  userName, 
  userId, 
  onJoinRoom, 
  onLeaveRoom,
  onError 
}) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!meetingId || !containerRef.current) return;
    if (zpRef.current) return; // Already initialized
    
    const initializeCall = async () => {
      try {
        // Get ZegoCloud configuration
        const zegoConfig = getZegoConfig();
        
        // Validate configuration
        if (!validateZegoConfig(zegoConfig)) {
          if (onError) onError('ZegoCloud configuration is invalid.');
          setIsLoading(false);
          return;
        }
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          zegoConfig.appID,
          zegoConfig.serverSecret,
          meetingId,
          userId,
          userName
        );
        
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;
        
        // Ensure container still exists
        if (!containerRef.current) {
          console.warn('Container disappeared before initialization');
          return;
        }
        
        await zp.joinRoom({
          container: containerRef.current,
            scenario: {
              mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showPreJoinView: false,
            showLayoutButton: false,
            showScreenSharingButton: false,
            turnOnCameraWhenJoining: true,
            turnOnMicrophoneWhenJoining: true,
            showUserList: false,
            maxUsers: 2,
            layout: 'Auto',
            showTextChat: false,
            showRoomTimer: false,
            onJoinRoom: () => {
              setIsLoading(false);
              if (onJoinRoom) onJoinRoom();
            },
            onLeaveRoom: () => {
              if (onLeaveRoom) onLeaveRoom();
            },
            onUserJoin: (users) => {
              console.log('User joined:', users);
            },
            onUserLeave: (users) => {
              console.log('User left:', users);
            },
        });
        
      } catch (error) {
        console.error('Error initializing ZegoCloud:', error);
        setIsLoading(false);
        if (onError) {
          onError(error.message || 'Failed to initialize video call');
        }
      }
    };
    
    // Initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeCall();
    }, 500);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      // Don't try to clean up DOM, just clear the reference
      zpRef.current = null;
    };
  }, [meetingId]); // Only re-run if meetingId changes

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        maxHeight: '600px',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {isLoading && (
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="spinner-border text-light mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Initializing video call...</p>
        </div>
      )}
    </div>
  );
};

export default ContainedVideoCall;
