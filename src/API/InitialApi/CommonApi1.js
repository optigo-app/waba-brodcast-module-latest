import axios from "axios";
import { APIURL, getLoginHeaders } from "./Config";

export const CommonAPI1 = async (body, version) => {
    try {
        const loginHeader = getLoginHeaders();

        const { data } = await axios.post(APIURL, body, { headers: loginHeader });
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

