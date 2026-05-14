import axios from "axios";
import { TEMPLATE_EDIT, getHeaders } from "../InitialApi/Config";

/**
 * Edits a WhatsApp template via the manage/edit API.
 * @param {Object} payload - The template payload
 * @param {number} payload.WabaTemplateId
 * @param {string} payload.TemplateName
 * @param {string} payload.TemplateType
 * @param {number} payload.CreatedBy
 * @param {string} payload.UserId
 * @param {string} payload.Language
 * @param {Array}  payload.Components
 */
export const editTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_EDIT, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("editTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
