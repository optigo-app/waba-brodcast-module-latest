import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchInboundList = async (userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_inbound\",\"appuserid\":\"${userId}\"}`,
            "p": "",
            "f": "Broadcast ( InBound )"
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