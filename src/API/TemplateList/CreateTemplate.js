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
 * @param {number} payload.IsDraft       - 1 for draft, 0 for create (optional, defaults to 0)
 */
export const createTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_CREATE, { ...payload, IsDraft: payload.IsDraft ?? 0 }, { headers });

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
