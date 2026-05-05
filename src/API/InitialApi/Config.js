
const BASE_URL = process.env.REACT_APP_BASE_URL;
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL;

export const APIURL = `${BASE_URL}/report`;
export const MEDIAAPIURL = MEDIA_BASE_URL;
export const MESSAGEAPIURL = `${BASE_URL}/whatsapp/chat/send`;
export const MESSAGEAPIURLBULK = `${BASE_URL}/whatsapp/chat/send-bulk`;
export const GETCONVERSATIONURL = `${BASE_URL}/report`;
export const UPLOADMEDIA = MEDIA_BASE_URL;
export const LOGOUTAPI = `${BASE_URL}/whatsapp/chat/logout`;
export const SAVEPLAYERID = `${BASE_URL}/report`;
export const EXCELIMPORT = `${BASE_URL}/whatsapp/brodcast/excel-import`;
export const SENDBULK = `${BASE_URL}/whatsapp/brodcast/send-bulk`;
export const CRON = `${BASE_URL}/whatsapp/brodcast/scheduler/send`;



export const getHeaders = () => {
    const userToken = JSON.parse(sessionStorage.getItem("userToken"));

    const version = "v2";
    return {
        Yearcode: userToken?.yc,
        Version: version,
        sv: userToken?.sv,
        sp: "16",
    };
};

export const getLoginHeaders = (init = {}) => {

    const { version = "v2" } = init;

    return {
        // Authorization: `Bearer ${token}`,
        Yearcode: "",
        Version: version,
        sv: "",
        sp: "16",
    };
};
