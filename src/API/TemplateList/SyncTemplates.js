import axios from "axios";
import { TEMPLATE_SYNC, getHeaders } from "../InitialApi/Config";

/**
 * Syncs WhatsApp templates via the manage/sync API.
 * @param {Object} payload - The sync payload
 * @param {number} payload.CreatedBy
 * @param {string} payload.UserId
 */
export const syncTemplates = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_SYNC, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("syncTemplates Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
