import { CommonAPI } from "../InitialApi/CommonApi";

export const SetScheduler = async (userId, CampaignId, templates, dataSource, customers, durationDateTime, distributeDays) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"wa_add_schedule\",\"appuserid\":\"${userId}\"}`,
            "p": JSON.stringify({
                "userId": userId,
                "CampaignId": CampaignId,
                "Templates": JSON.stringify(templates),
                "DataSource": dataSource,
                "CustomerJson": customers,
                "DurationDateTime": durationDateTime,
                "DistributeDays": distributeDays
            }),
            "f": "BroadCast ( Add schedule )"
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