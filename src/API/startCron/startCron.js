import axios from "axios";
import { CRON, getHeaders } from "../InitialApi/Config";

export const startCron = async (body, version) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(CRON, body, { headers: headers });
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

