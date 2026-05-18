import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchQuickReport = async (userId, campaignId) => {
    try {
        const con = {
            id: "",
            mode: "broadcast_camp_dashboard",
            appuserid: `${userId}`
        };

        const p = {
            CampaignId: campaignId
        };

        const body = {
            con: JSON.stringify(con),
            p: JSON.stringify(p),
            f: "Broadcast ( broadcast_camp_dashboard )"
        };

        const response = await CommonAPI(body);
        const data = response?.rd?.[0] || response?.Data || response;

        if (data) {
            return {
                success: true,
                data: data
            };
        } else {
            console.log('No data found in response');
            return {
                success: false,
                data: null
            };
        }
    } catch (error) {
        console.error('Error fetching quick report:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};
