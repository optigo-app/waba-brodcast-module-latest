import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchFilterMasterList = async (userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_camp_masters\",\"appuserid\":\"${userId}\"}`,
            "p": "",
            "f": "Broadcast ( Masters )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data,
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