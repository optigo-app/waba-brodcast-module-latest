import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchOutboundList = async (userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_outbound\",\"appuserid\":\"${userId}\"}`,
            "p": "",
            "f": "Broadcast ( OutBound )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data?.rd,
                total: response?.Data?.total || response?.Data?.rd?.length || 0
            };
        } else {
            return {
                data: [],
                total: 0,
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            data: [],
            total: 0,
        };
    }
};