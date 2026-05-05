import { SendBulkCampaign } from "../InitialApi/SendBulkCampaign";

export const sendBulk = async ({
    userId,
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
            userId,
            CampaignId: campaignId,
            Templates: normalizedTemplates,
            DataSource: dataSource,
            Customers: normalizedCustomers
        };

        const response = await SendBulkCampaign(body);

        if (response?.success) {
            return response;
        }

        return { success: false, data: [] };
    } catch (error) {
        console.error("Error in sendBulk:", error);
        return { data: [] };
    }
};
