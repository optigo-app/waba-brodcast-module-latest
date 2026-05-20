import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchWabaBilling = async (userId) => {
    try {
        const con = {
            id: "",
            mode: "waba_billing",
            appuserid: `${userId || ""}`,
        };

        const body = {
            con: JSON.stringify(con),
            p: "",
            f: "WABA ( waba_billing )",
        };

        const response = await CommonAPI(body);
        const row = response?.Data?.rd?.[0] || null;

        if (!row) {
            return {
                success: false,
                data: null,
            };
        }

        return {
            success: true,
            data: row,
        };
    } catch (error) {
        console.error("Error fetching WABA billing:", error);
        return {
            success: false,
            data: null,
        };
    }
};
