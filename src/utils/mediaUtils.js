/**
 * Utility functions for handling media files in template editing
 */

/**
 * Check if a URL is from the own server (not WhatsApp CDN)
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL is from own server
 */
export const isOwnServerUrl = (url) => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        // Check if it's NOT a WhatsApp CDN URL
        const isWhatsAppCdn = urlObj.hostname.includes('scontent.whatsapp.net') ||
                              urlObj.hostname.includes('whatsapp.net');
        return !isWhatsAppCdn;
    } catch (error) {
        return false;
    }
};

/**
 * Convert a URL to a File object by fetching the blob
 * @param {string} url - The URL of the media file
 * @param {string} filename - The filename to use for the File object
 * @returns {Promise<File>} - A promise that resolves to a File object
 */
export const urlToFile = async (url, filename) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Determine MIME type from blob or filename
        const mimeType = blob.type || getMimeTypeFromFilename(filename);
        
        return new File([blob], filename, { type: mimeType });
    } catch (error) {
        console.error('Error converting URL to File:', error);
        throw new Error(`Failed to convert URL to file: ${error.message}`);
    }
};

/**
 * Get MIME type from filename extension
 * @param {string} filename - The filename
 * @returns {string} - The MIME type
 */
const getMimeTypeFromFilename = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'pdf': 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Extract filename from URL
 * @param {string} url - The URL
 * @returns {string} - The filename
 */
export const getFilenameFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        return filename || `media_${Date.now()}`;
    } catch (error) {
        return `media_${Date.now()}`;
    }
};

/**
 * Convert an array of URLs to an array of File objects
 * Only converts URLs from own server, skips WhatsApp CDN URLs
 * @param {string[]} urls - Array of URLs
 * @returns {Promise<File[]>} - Promise resolving to array of File objects
 */
export const urlsToFiles = async (urls) => {
    const filePromises = urls.map((url, index) => {
        // Skip WhatsApp CDN URLs
        if (!isOwnServerUrl(url)) {
            return null;
        }
        const filename = getFilenameFromUrl(url);
        return urlToFile(url, filename);
    });
    
    const results = await Promise.all(filePromises);
    return results.filter(Boolean);
};
