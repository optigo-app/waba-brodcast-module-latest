import { CommonAPI } from "../InitialApi/CommonApi";

export const deleteCampaign = async (userId, campaignId) => {
    try {
        const body = {
            "con": `{"id":"","mode":"broadcast_campaign_delete","appuserid":"${userId}","campaignid":"${campaignId}"}`,
            "p": ``,
            "f": "Broadcast ( Campaign Delete )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                success: true,
                data: response?.Data,
            };
        } else {
            return {
                success: false,
                data: null,
            };
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
