import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCrmTemplates = async (userId) => {
    try {
        const body = {
            "con": `{"id":"","mode":"broadcast_crm_temp_list","appuserid":"${userId}"}`,
            "p": "",
            "f": "Broadcast ( Template List )"
        };

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data?.rd || [],
            };
        } else {
            return {
                data: [],
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            data: [],
        };
    }
};
