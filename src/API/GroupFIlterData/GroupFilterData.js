import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchGroupFilterList = async (userId, groupFilter = "") => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_cust_list\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"GroupFilter\":\"${groupFilter}\"}`,
            "f": "Broadcast ( Customer Group List )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data?.rd,
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