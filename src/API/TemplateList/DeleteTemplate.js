import axios from "axios";
import { TEMPLATE_DELETE, getHeaders } from "../InitialApi/Config";

/**
 * Deletes a WhatsApp template via the manage/delete API.
 * @param {Object} payload - The delete payload
 * @param {number} payload.TemplateId
 */
export const deleteTemplate = async (payload) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(TEMPLATE_DELETE, payload, { headers });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("deleteTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
