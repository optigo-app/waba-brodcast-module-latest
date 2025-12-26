import { CommonAPI } from "../InitialApi/CommonApi";

export const addCampaign = async (userId, campaignName, templateId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_camp_bind_temp\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"CampaignName\": \"${campaignName}\", \"TemplateId\": ${templateId}}`,
            "f": "Broadcast ( Binding Template With Campaign )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data
            };
        } else {
            return {
                data: []
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            data: [],
        };
    }
};