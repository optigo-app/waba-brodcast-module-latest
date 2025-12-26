import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchExcelList = async (userId, fetchCampignId, groupFilter, filters, searchTerm) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_excel_cust_list\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"CampaignId\": ${fetchCampignId},\"GroupFilter\": \"${groupFilter}\",\"CompanyName\":\"${filters?.companyName ?? ""}\",\"CompanyType\":\"${filters?.companyType ?? ""}\",\"State\": \"${filters?.state ?? ""}\",\"City\": \"${filters?.city ?? ""}\",\"Country\": \"${filters?.country ?? ""}\",\"SearchTerm\": \"${searchTerm}\"}`,
            "f": "Broadcast ( Customer Group List )"
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