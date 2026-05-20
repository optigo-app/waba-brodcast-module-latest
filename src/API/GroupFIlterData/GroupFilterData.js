import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchGroupFilterList = async (
    userId,
    {
        groupFilter = "",
        branchFilter = "",
        customerName = "",
        companyType = "",
        state = "",
        city = "",
        country = "",
        searchTerm = "",
    } = {}
) => {
    try {
        const payload = {
            GroupFilter: groupFilter,
            Branch: branchFilter,
        };

        const body = {
            "con": `{"id":"","mode":"broadcast_cust_list","appuserid":"${userId}"}`,
            "p": JSON.stringify(payload),
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