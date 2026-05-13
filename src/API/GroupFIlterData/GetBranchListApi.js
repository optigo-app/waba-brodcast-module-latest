import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchBranchListsApi = async (userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"getHoBranchlist\",\"appuserid\":\"${userId}\"}`,
            "p": ``,
            "f": "Broadcast ( broadcast_branch_list )"
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