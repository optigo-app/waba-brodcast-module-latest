import axios from "axios";
import { SENDBULK, getHeaders } from "./Config";

export const SendBulkCampaign = async (body, whatsappNumber) => {
    try {
        const headers = getHeaders(whatsappNumber);

        const { data } = await axios.post(SENDBULK, body, { headers: headers });
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

