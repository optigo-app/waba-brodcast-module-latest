import { SendBulkCampaign } from "../InitialApi/SendBulkCampaign";

export const sendBulk = async ({
    appuserid,
    userId,
    whatsappNumber,
    campaignId = 1,
    templates = [],
    dataSource,
    customers = [],
} = {}) => {
    try {
        const normalizedTemplates = Array.isArray(templates)
            ? templates.map(t => (typeof t === "object" ? t.TemplateId || t.id || t : t))
            : [templates];

        const normalizedCustomers = Array.isArray(customers)
            ? customers.map(c => ({
                customerId: c?.customerId || c?.CustomerId || c?.id,
                phoneNo: c?.phoneNo || c?.CustomerPhone || ""
            }))
            : [];

        const body = {
            appuserid,
            userId,
            CampaignId: campaignId,
        };

        const response = await SendBulkCampaign(body, whatsappNumber);

        const isSuccess = response?.success || response?.stat === 1 || response?.stat_code === 1000;
        if (isSuccess) {
            return response;
        }

        return { success: false, data: [] };
    } catch (error) {
        console.error("Error in sendBulk:", error);
        return { data: [] };
    }
};
