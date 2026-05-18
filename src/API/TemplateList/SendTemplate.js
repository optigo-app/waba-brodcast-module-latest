import axios from "axios";
import { TEMPLATE_TESTSEND, getHeaders } from "../InitialApi/Config";

/**
 * Sends a WhatsApp template message to a phone number.
 * @param {Object} payload - The send payload
 * @param {string} payload.phoneNo - Phone number (without country code)
 * @param {string} payload.appuserid - User ID
 * @param {number} payload.customerId - Customer ID
 * @param {string} payload.type - Type (always "template")
 * @param {Object} payload.template - Template object
 * @param {string} payload.template.name - Template name
 * @param {Object} payload.template.language - Language object
 * @param {string} payload.template.language.code - Language code (e.g., "en")
 * @param {Array} payload.template.components - Array of components with parameters
 */
export const sendTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_TESTSEND, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("sendTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
