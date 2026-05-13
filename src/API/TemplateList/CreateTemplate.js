import axios from "axios";
import { TEMPLATE_CREATE, getHeaders } from "../InitialApi/Config";

/**
 * Creates a WhatsApp template via the manage/create API.
 * @param {Object} payload - The template payload
 * @param {string} payload.TemplateName
 * @param {string} payload.TemplateType  - e.g. "MARKETING"
 * @param {number} payload.CreatedBy
 * @param {string} payload.UserId
 * @param {string} payload.Language      - e.g. "en_US"
 * @param {Array}  payload.Components    - WhatsApp template components array
 */
export const createTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_CREATE, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("createTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
