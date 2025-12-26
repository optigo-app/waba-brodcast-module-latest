import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCampaignLists = async (userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_camp_list\",\"appuserid\":\"${userId}\"}`,
            "p": ``,
            // "p": `{\"Page\": ${page}, \"PageSize\": ${pageSize} }`,
            "f": "Broadcast ( Campaign List )"
        }

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