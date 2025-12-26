import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCustomerList = async (userId, compName, compType, State, City, Country, Searchterm) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"broadcast_cust_list\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"CompanyName\":\"${compName}\",\"CompanyType\":\"${compType}\",\"State\": \"${State}\",\"City\": \"${City}\",\"Country\": \"${Country}\",\"SearchTerm\": \"${Searchterm}\"}`,
            "f": "Broadcast ( Customer List )"
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