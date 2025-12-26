import axios from "axios";
import { APIURL, getHeaders } from "./Config";

export const CommonAPI = async (body, version) => {
    try {
        const headers = getHeaders();

        const { data } = await axios.post(APIURL, body, { headers: headers });
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

