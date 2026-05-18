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

export const createCampaign = async (campaignData) => {
    try {
        const {
            campaignName,
            wabaNumber,
            templateJson,
            broadcastCampType,
            scheduleTime,
            userId,
            customerJson,
            customerFilters,
            campaignId
        } = campaignData;

        const p = {
            CampaignName: campaignName,
            WabaNumber: wabaNumber,
            TemplateJson: JSON.stringify(templateJson),
            BroadCastCampType: broadcastCampType,
            ScheduleTime: scheduleTime || "",
            UserId: userId,
            CustomerJson: JSON.stringify(customerJson),
            CustomerFilters: customerFilters ? JSON.stringify(customerFilters) : null,
            ExcelId: campaignId
        };

        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_camp_create\",\"appuserid\":\"${userId}\"}`,
            p: JSON.stringify(p),
            f: "Broadcast ( campaign create )"
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
                data: []
            };
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        return {
            success: false,
            data: [],
            error: error.message
        };
    }
};