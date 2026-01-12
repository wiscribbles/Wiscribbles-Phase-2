// Avatar Color Preservation Utility
// This utility helps maintain avatar colors when the color switcher is active

/**
 * Preserve avatar colors during color switches
 */
export function preserveAvatarColors() {
  // Store original avatar colors before any color switching
  const avatars = document.querySelectorAll('.avatar, [class*="avatar"], .profile-avatar, .user-avatar');
  
  avatars.forEach(avatar => {
    // Store original background color
    const computedStyle = window.getComputedStyle(avatar);
    const originalBgColor = computedStyle.backgroundColor;
    const originalColor = computedStyle.color;
    
    // Store as data attributes
    if (originalBgColor && originalBgColor !== 'rgba(0, 0, 0, 0)') {
      avatar.setAttribute('data-original-bg-color', originalBgColor);
    }
    if (originalColor && originalColor !== 'rgba(0, 0, 0, 0)') {
      avatar.setAttribute('data-original-color', originalColor);
    }
  });
}

/**
 * Restore avatar colors after color switching
 */
export function restoreAvatarColors() {
  const avatars = document.querySelectorAll('.avatar, [class*="avatar"], .profile-avatar, .user-avatar');
  
  avatars.forEach(avatar => {
    const originalBgColor = avatar.getAttribute('data-original-bg-color');
    const originalColor = avatar.getAttribute('data-original-color');
    
    if (originalBgColor) {
      avatar.style.backgroundColor = originalBgColor;
    }
    if (originalColor) {
      avatar.style.color = originalColor;
    }
  });
}

/**
 * Override the original setActiveStyleSheet function to preserve avatar colors
 */
export function setupAvatarColorPreservation() {
  // Store the original function if it exists
  if (typeof window.setActiveStyleSheet === 'function') {
    const originalSetActiveStyleSheet = window.setActiveStyleSheet;
    
    window.setActiveStyleSheet = function(title) {
      // Store avatar colors before changing
      preserveAvatarColors();
      
      // Apply the color change
      originalSetActiveStyleSheet.call(this, title);
      
      // Restore avatar colors after a short delay
      setTimeout(() => {
        restoreAvatarColors();
      }, 100);
    };
  }
}

/**
 * Initialize avatar color preservation on DOM ready
 */
export function initAvatarColorPreservation() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAvatarColorPreservation();
      preserveAvatarColors();
    });
  } else {
    setupAvatarColorPreservation();
    preserveAvatarColors();
  }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined') {
  initAvatarColorPreservation();
}
