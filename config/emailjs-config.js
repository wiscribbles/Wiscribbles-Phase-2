// EmailJS Configuration
// Centralized configuration for all EmailJS templates and services

export const EMAILJS_CONFIG = {
  // EmailJS Public Key (User ID)
  PUBLIC_KEY: 'nWH88iJVBzhSqWLzz',
  
  // EmailJS Service ID (same for all templates)
  SERVICE_ID: 'service_9wu43ho',
  
  // Template IDs for different purposes
  TEMPLATES: {
    // Authentication emails (OTP, verification codes, etc.)
    AUTHENTICATION: {
      id: 'template_bu0fm8i',
      name: 'Authentication Template',
      description: 'Used for sending reference numbers and authentication codes',
      requiredFields: ['email', 'reference_number'],
      usage: 'Authentication, OTP, Verification codes'
    },
    
    // Document delivery emails
    DOCUMENT_DELIVERY: {
      id: 'template_ib55ck2',
      name: 'Document Delivery Template',
      description: 'Used for sending document download links',
      requiredFields: ['email', 'user_name', 'document_type', 'document_url', 'reference_number', 'document_status'],
      usage: 'Document downloads, Notarized documents, E-signed documents'
    },
    
    // Future templates can be added here
    // NOTIFICATION: {
    //   id: 'template_xxxxx',
    //   name: 'Notification Template',
    //   description: 'General notifications',
    //   requiredFields: ['email', 'message'],
    //   usage: 'System notifications, Updates'
    // }
  }
};

// Helper function to get template by purpose
export const getTemplate = (purpose) => {
  switch(purpose.toLowerCase()) {
    case 'authentication':
    case 'auth':
    case 'otp':
    case 'verification':
      return EMAILJS_CONFIG.TEMPLATES.AUTHENTICATION;
      
    case 'document':
    case 'document_delivery':
    case 'download':
    case 'notarized':
    case 'esign':
      return EMAILJS_CONFIG.TEMPLATES.DOCUMENT_DELIVERY;
      
    default:
      console.warn(`Unknown email purpose: ${purpose}, using document delivery template`);
      return EMAILJS_CONFIG.TEMPLATES.DOCUMENT_DELIVERY;
  }
};

// Helper function to send email with appropriate template
export const sendEmail = async (purpose, params) => {
  try {
    const template = getTemplate(purpose);
    console.log(`Sending email using ${template.name} (${template.id})`);
    
    // Validate required fields
    const missingFields = template.requiredFields.filter(field => !params[field]);
    if (missingFields.length > 0) {
      console.warn(`Missing required fields for ${template.name}:`, missingFields);
    }
    
    // Import emailjs dynamically
    const emailjs = (await import('@emailjs/browser')).default;
    
    // Initialize EmailJS
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    
    // Send email
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      template.id,
      params
    );
    
    return {
      success: true,
      response,
      template: template.name
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
      template: getTemplate(purpose).name
    };
  }
};

export default EMAILJS_CONFIG;
