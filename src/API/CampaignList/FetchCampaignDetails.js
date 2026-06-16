import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCampaignDetails = async (userId, campaignId, chatMsgStatus = null, templateId = null) => {
    try {
        const con = {
            id: "",
            mode: "broadcast_camp_details",
            appuserid: `${userId}`
        };

        const p = {
            CampaignId: campaignId
        };

        // Add ChatMsgStatus to parameters if provided
        if (chatMsgStatus !== null && chatMsgStatus !== undefined && chatMsgStatus !== '') {
            p.ChatMsgStatus = chatMsgStatus;
        }

        // Add TemplateId to parameters if provided
        if (templateId !== null && templateId !== undefined && templateId !== '') {
            p.TemplateId = templateId;
        }

        const body = {
            con: JSON.stringify(con),
            p: JSON.stringify(p),
            f: "Broadcast ( campaign details )"
        };

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                success: true,
                data: response?.Data
            };
        } else {
            return {
                success: false,
                data: null
            };
        }
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};
