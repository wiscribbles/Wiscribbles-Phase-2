'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ZegoCloud to avoid SSR issues
const ZegoUIKitPrebuilt = dynamic(
  () => import('@zegocloud/zego-uikit-prebuilt').then(mod => mod.ZegoUIKitPrebuilt),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-light mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading video call...</p>
        </div>
      </div>
    )
  }
);

const SafeVideoCall = ({ 
  meetingId, 
  userName, 
  userId, 
  onJoinRoom, 
  onLeaveRoom,
  onError 
}) => {
  const [containerReady, setContainerReady] = useState(false);
  const containerId = `video-container-${meetingId}`;

  useEffect(() => {
    // Set container ready after mount
    setContainerReady(true);
  }, []);

  useEffect(() => {
    if (!containerReady || !meetingId || typeof window === 'undefined') return;

    const initCall = async () => {
      try {
        // Validate meeting ID format for ZegoCloud
        const zegoRoomIdRegex = /^[a-zA-Z0-9_-]{1,64}$/;
        if (!zegoRoomIdRegex.test(meetingId)) {
          console.error('❌ Invalid meeting ID format for ZegoCloud:', meetingId);
          if (onError) onError(`Invalid meeting ID format: ${meetingId}`);
          return;
        }
        
        console.log('✅ Meeting ID format is valid for ZegoCloud:', meetingId);
        
        // Dynamically import and get config
        const { getZegoConfig, validateZegoConfig } = await import('../config/zegoConfig');
        const zegoConfig = getZegoConfig();
        
        if (!validateZegoConfig(zegoConfig)) {
          if (onError) onError('Invalid ZegoCloud configuration');
          return;
        }

        // Wait for ZegoUIKitPrebuilt to be available
        const ZegoCloudSDK = (await import('@zegocloud/zego-uikit-prebuilt')).ZegoUIKitPrebuilt;
        
        const container = document.getElementById(containerId);
        if (!container) {
          console.error('Container not found');
          return;
        }

        const kitToken = ZegoCloudSDK.generateKitTokenForTest(
          zegoConfig.appID,
          zegoConfig.serverSecret,
          meetingId,
          userId,
          userName
        );

        const zp = ZegoCloudSDK.create(kitToken);
        
        console.log('🎥 Attempting to join ZegoCloud room:', meetingId);
        console.log('🎥 User details:', { userId, userName });
        console.log('🎥 ZegoCloud config valid:', zegoConfig);
        
        await zp.joinRoom({
          container: container,
          scenario: {
            mode: ZegoCloudSDK.OneONoneCall,
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
            console.log('🎉 Successfully joined ZegoCloud room!');
            if (onJoinRoom) onJoinRoom();
          },
          onLeaveRoom: () => {
            console.log('👋 Left ZegoCloud room');
            if (onLeaveRoom) onLeaveRoom();
          },
        });
        
        console.log('✅ ZegoCloud joinRoom call completed');

      } catch (error) {
        console.error('Error initializing video call:', error);
        if (onError) onError(error.message || 'Failed to initialize video call');
      }
    };

    // Delay to ensure everything is ready
    const timer = setTimeout(initCall, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [containerReady, meetingId, userId, userName]);

  return (
    <div 
      id={containerId}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        maxHeight: '600px',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
};

export default SafeVideoCall;
