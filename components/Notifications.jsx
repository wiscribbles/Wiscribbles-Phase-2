'use client';

import React from 'react';
import { useWorkflow } from '../contexts/WorkflowContext';

/**
 * Notifications - Component for displaying workflow notifications
 * Shows real-time updates, errors, and status messages
 */
const Notifications = ({ position = 'top-right', maxNotifications = 5 }) => {
  const { state, actions } = useWorkflow();

  if (!state.notifications || state.notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'info':
      default:
        return 'fa-info-circle';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return {
          background: '#F0FDF4',
          border: '#10B981',
          text: '#065F46',
          icon: '#10B981'
        };
      case 'error':
        return {
          background: '#FEF2F2',
          border: '#EF4444',
          text: '#991B1B',
          icon: '#EF4444'
        };
      case 'warning':
        return {
          background: '#FFFBEB',
          border: '#F59E0B',
          text: '#92400E',
          icon: '#F59E0B'
        };
      case 'info':
      default:
        return {
          background: '#EFF6FF',
          border: '#3B82F6',
          text: '#1E3A8A',
          icon: '#3B82F6'
        };
    }
  };

  const getPositionStyles = (position) => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px',
      width: 'auto'
    };

    switch (position) {
      case 'top-right':
        return {
          ...baseStyles,
          top: '20px',
          right: '20px'
        };
      case 'top-left':
        return {
          ...baseStyles,
          top: '20px',
          left: '20px'
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: '20px',
          right: '20px'
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '20px'
        };
      case 'top-center':
        return {
          ...baseStyles,
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      default:
        return {
          ...baseStyles,
          top: '20px',
          right: '20px'
        };
    }
  };

  const handleDismiss = (notificationId) => {
    actions.removeNotification(notificationId);
  };

  // Limit the number of notifications shown
  const visibleNotifications = state.notifications
    .slice(-maxNotifications)
    .reverse();

  return (
    <div style={getPositionStyles(position)}>
      {visibleNotifications.map((notification) => {
        const colors = getNotificationColor(notification.type);
        const iconClass = getNotificationIcon(notification.type);

        return (
          <div
            key={notification.id}
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              minWidth: '300px',
              animation: 'slideInRight 0.3s ease-out',
              position: 'relative'
            }}
          >
            {/* Icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              flexShrink: 0
            }}>
              <i 
                className={`fa ${iconClass}`}
                style={{
                  color: colors.icon,
                  fontSize: '16px'
                }}
              ></i>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {/* Message */}
              <div style={{
                color: colors.text,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.4',
                fontFamily: "'Jost', sans-serif"
              }}>
                {notification.message}
              </div>

              {/* Timestamp */}
              {notification.timestamp && (
                <div style={{
                  color: colors.text,
                  fontSize: '12px',
                  opacity: 0.7,
                  fontFamily: "'Jost', sans-serif"
                }}>
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => handleDismiss(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text,
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                opacity: 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              <i className="fa fa-times" style={{ fontSize: '12px' }}></i>
            </button>

            {/* Auto-dismiss progress bar */}
            {notification.duration > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                backgroundColor: colors.border,
                borderRadius: '0 0 8px 8px',
                animation: `shrinkWidth ${notification.duration}ms linear forwards`
              }}></div>
            )}
          </div>
        );
      })}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .notification-enter {
          transform: translateX(100%);
          opacity: 0;
        }

        .notification-enter-active {
          transform: translateX(0);
          opacity: 1;
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }

        .notification-exit {
          transform: translateX(0);
          opacity: 1;
        }

        .notification-exit-active {
          transform: translateX(100%);
          opacity: 0;
          transition: transform 0.3s ease-in, opacity 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};

export default Notifications;
