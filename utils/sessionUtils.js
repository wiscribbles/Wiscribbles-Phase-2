// Session utility functions for managing user sessions and IDs

// Generate a unique session ID
export const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `sess_${timestamp}_${randomStr}`;
};

// Get user ID from authentication context
export const getUserId = () => {
  try {
    // Try to get from your auth system (if you're using any)
    // This is a placeholder - integrate with your actual auth system
    const userId = localStorage.getItem('wiscribble_user_id');
    return userId;
  } catch (error) {
    console.warn('Could not get user ID:', error);
    return null;
  }
};

// Set user ID in storage
export const setUserId = (userId) => {
  try {
    if (userId) {
      localStorage.setItem('wiscribble_user_id', userId);
    } else {
      localStorage.removeItem('wiscribble_user_id');
    }
    return true;
  } catch (error) {
    console.error('Could not set user ID:', error);
    return false;
  }
};

// Clear user session
export const clearUserSession = () => {
  try {
    localStorage.removeItem('wiscribble_user_id');
    localStorage.removeItem('wiscribble_session_id');
    return true;
  } catch (error) {
    console.error('Could not clear user session:', error);
    return false;
  }
};

// Get or create a session ID
export const getOrCreateSessionId = () => {
  try {
    let sessionId = localStorage.getItem('wiscribble_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('wiscribble_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error('Could not get or create session ID:', error);
    return generateSessionId(); // Fallback to temporary session ID
  }
};

// Check if user is authenticated
export const isUserAuthenticated = () => {
  const userId = getUserId();
  return Boolean(userId);
};

// Get current user context
export const getUserContext = () => {
  return {
    userId: getUserId(),
    sessionId: getOrCreateSessionId(),
    isAuthenticated: isUserAuthenticated()
  };
};
