import axios from "axios";
import { TEMPLATE_PUBLISH, getHeaders } from "../InitialApi/Config";

/**
 * Publishes a WhatsApp template via the manage/publish API.
 * @param {Object} payload - The publish payload
 * @param {number} payload.TemplateId
 * @param {number} payload.CreatedBy
 * @param {string} payload.UserId
 */
export const publishTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_PUBLISH, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("publishTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
