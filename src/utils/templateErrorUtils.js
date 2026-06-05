/**
 * Template Error Handling Utility
 * Maps Meta/WhatsApp API errors to customer-friendly messages
 */

const TEMPLATE_ERRORS = {
  // Character limit errors
  CHARACTER_LIMIT_EXCEEDED: {
    subcode: 2388040,
    keywords: ['550 characters', 'character limit', 'exceeded'],
    title: 'Message is too long',
    message: 'Your message is too long. Please shorten it and try again.',
    details: 'Marketing templates have a 550 character limit. Utility templates allow up to 1024 characters. Your template may have been auto-classified as Marketing by WhatsApp due to promotional language.',
    action: 'Reduce your message to under 550 characters or ensure your template category is set to Marketing.'
  },
  
  // Media/Carousel category errors
  MEDIA_CAROUSEL_CATEGORY_MISMATCH: {
    keywords: ['media', 'carousel', 'category', 'utility', 'marketing'],
    title: 'Template type requires Marketing category',
    message: 'Templates with images, videos, or carousels must use the Marketing category.',
    details: 'Media and carousel templates are only allowed in the Marketing category according to WhatsApp policies.',
    action: 'Change the template category to Marketing to continue.'
  },
  
  // Invalid parameter errors
  INVALID_PARAMETER: {
    code: 100,
    title: 'Invalid template data',
    message: 'Some template information is incorrect or missing.',
    details: 'Please check all template fields and try again.',
    action: 'Review your template details and ensure all required fields are filled correctly.'
  },
  
  // Template name errors
  INVALID_TEMPLATE_NAME: {
    keywords: ['template name', 'name', 'invalid'],
    title: 'Template name is invalid',
    message: 'The template name contains invalid characters or format.',
    details: 'Template names must follow WhatsApp naming conventions (lowercase, alphanumeric, underscores only).',
    action: 'Use only lowercase letters, numbers, and underscores in the template name.'
  },
  
  // Authentication errors
  AUTHENTICATION_ERROR: {
    code: 190,
    title: 'Authentication failed',
    message: 'There was a problem verifying your account.',
    details: 'Your session may have expired or there is an issue with your account permissions.',
    action: 'Please log out and log in again, or contact support if the issue persists.'
  },
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: {
    code: 4,
    title: 'Too many requests',
    message: 'You have reached the limit for template operations.',
    details: 'WhatsApp limits how many templates you can create in a certain time period.',
    action: 'Please wait a few minutes and try again.'
  },
  
  // Permission errors
  PERMISSION_DENIED: {
    code: 200,
    title: 'Permission denied',
    message: 'You do not have permission to perform this action.',
    details: 'Your account may not have the required permissions for template management.',
    action: 'Contact your administrator or check your account permissions.'
  },
  
  // Generic errors
  GENERIC_ERROR: {
    title: 'Template creation failed',
    message: 'There was a problem creating your template.',
    details: 'An unexpected error occurred while processing your request.',
    action: 'Please try again. If the problem persists, contact support.'
  }
};

/**
 * Parse error from API response and return customer-friendly error info
 * @param {Object} error - Error object from API response
 * @returns {Object} - { title, message, details, action, isKnownError }
 */
export const parseTemplateError = (error) => {
  if (!error) {
    return {
      ...TEMPLATE_ERRORS.GENERIC_ERROR,
      isKnownError: false
    };
  }

  const errorCode = error.code;
  const errorSubcode = error.error_subcode;
  const errorMessage = (error.message || '').toLowerCase();
  const errorUserMsg = (error.error_user_msg || '').toLowerCase();

  // Check for character limit error (auto-classified as Marketing)
  if (errorSubcode === TEMPLATE_ERRORS.CHARACTER_LIMIT_EXCEEDED.subcode ||
      errorMessage.includes('550 characters') ||
      errorUserMsg.includes('550 characters')) {
    return {
      ...TEMPLATE_ERRORS.CHARACTER_LIMIT_EXCEEDED,
      isKnownError: true
    };
  }

  // Check for invalid parameter errors
  if (errorCode === TEMPLATE_ERRORS.INVALID_PARAMETER.code) {
    // Check if it's specifically about template name
    if (errorMessage.includes('name') || errorUserMsg.includes('name')) {
      return {
        ...TEMPLATE_ERRORS.INVALID_TEMPLATE_NAME,
        isKnownError: true
      };
    }
    return {
      ...TEMPLATE_ERRORS.INVALID_PARAMETER,
      isKnownError: true
    };
  }

  // Check for authentication errors
  if (errorCode === TEMPLATE_ERRORS.AUTHENTICATION_ERROR.code) {
    return {
      ...TEMPLATE_ERRORS.AUTHENTICATION_ERROR,
      isKnownError: true
    };
  }

  // Check for rate limit errors
  if (errorCode === TEMPLATE_ERRORS.RATE_LIMIT_EXCEEDED.code) {
    return {
      ...TEMPLATE_ERRORS.RATE_LIMIT_EXCEEDED,
      isKnownError: true
    };
  }

  // Check for permission errors
  if (errorCode === TEMPLATE_ERRORS.PERMISSION_DENIED.code) {
    return {
      ...TEMPLATE_ERRORS.PERMISSION_DENIED,
      isKnownError: true
    };
  }

  // Check for media/carousel category mismatch
  if (errorMessage.includes('media') || errorMessage.includes('carousel')) {
    if (errorMessage.includes('category') || errorMessage.includes('utility')) {
      return {
        ...TEMPLATE_ERRORS.MEDIA_CAROUSEL_CATEGORY_MISMATCH,
        isKnownError: true
      };
    }
  }

  // Default to generic error
  return {
    ...TEMPLATE_ERRORS.GENERIC_ERROR,
    isKnownError: false,
    originalError: error.message || 'Unknown error'
  };
};

/**
 * Get formatted error message for display
 * @param {Object} error - Error object from API response
 * @returns {string} - Formatted error message
 */
export const getTemplateErrorMessage = (error) => {
  const parsed = parseTemplateError(error);
  
  if (parsed.isKnownError) {
    return `${parsed.message}\n\n${parsed.details}\n\n${parsed.action}`;
  }
  
  return `${parsed.message}\n\n${parsed.action}`;
};

/**
 * Get short error message for toast notification
 * @param {Object} error - Error object from API response
 * @returns {string} - Short error message
 */
export const getTemplateErrorToastMessage = (error) => {
  const parsed = parseTemplateError(error);
  return parsed.message;
};

/**
 * Get error title for modal/header
 * @param {Object} error - Error object from API response
 * @returns {string} - Error title
 */
export const getTemplateErrorTitle = (error) => {
  const parsed = parseTemplateError(error);
  return parsed.title;
};
