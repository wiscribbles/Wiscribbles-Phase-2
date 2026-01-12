// ZegoCloud Configuration
// Replace these with your ZegoCloud credentials

export const ZEGO_CONFIG = {
  // Primary account (replace with your new credentials)
  appID: 0, // Placeholder - set your App ID in .env as NEXT_PUBLIC_ZEGOCLOUD_APP_ID
  serverSecret: '', // Placeholder - set your Server Secret in .env as NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET
  
  // Alternative configuration for testing
  // Uncomment and use if you create multiple accounts
  /*
  appID: 0000000000, // Your backup App ID
  serverSecret: 'your_backup_server_secret', // Your backup Server Secret
  */
};

// Environment-specific configuration
export const getZegoConfig = () => {
  // Always prioritize environment variables if available
  const envAppID = process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID;
  const envServerSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET;
  
  return {
    appID: envAppID ? parseInt(envAppID) : ZEGO_CONFIG.appID,
    serverSecret: envServerSecret || ZEGO_CONFIG.serverSecret,
  };
};

// Validation function
export const validateZegoConfig = (config) => {
  if (!config.appID || config.appID === 0) {
    console.error('ZegoCloud App ID is not configured');
    return false;
  }
  
  if (!config.serverSecret || config.serverSecret === '') {
    console.error('ZegoCloud Server Secret is not configured');
    return false;
  }
  
  return true;
};

export default ZEGO_CONFIG;
