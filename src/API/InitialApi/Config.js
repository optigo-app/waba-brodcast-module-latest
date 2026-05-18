
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL;

const isLocal = ["localhost", '5dmjw0dg-2000.inc1.devtunnels.ms'].includes(window.location.hostname);
const isNxt = ['nxtwababroadcast.optigoapps.com'].includes(window.location.hostname);
const isLocalWeb = ["wababroadcast.web"].includes(window.location.hostname);

const API_BASE_URL = isLocal ?
    process.env.REACT_APP_API_DEVELOPMENT_URL :
    isLocalWeb ? process.env.REACT_APP_API_WEB_DEVELOPMENT_URL :
        isNxt ? process.env.REACT_APP_API_NXT_URL :
            process.env.REACT_APP_API_PRODUCTION_URL;

export const APIURL = `${API_BASE_URL}/report`;
export const MEDIAAPIURL = MEDIA_BASE_URL;
export const MESSAGEAPIURL = `${API_BASE_URL}/whatsapp/chat/send`;
export const MESSAGEAPIURLBULK = `${API_BASE_URL}/whatsapp/chat/send-bulk`;
export const GETCONVERSATIONURL = `${API_BASE_URL}/report`;
export const UPLOADMEDIA = MEDIA_BASE_URL;
export const LOGOUTAPI = `${API_BASE_URL}/whatsapp/chat/logout`;
export const SAVEPLAYERID = `${API_BASE_URL}/report`;
export const EXCELIMPORT = `${API_BASE_URL}/whatsapp/brodcast/excel-import`;
export const SENDBULK = `${API_BASE_URL}/whatsapp/brodcast/send-bulk`;
export const CRON = `${API_BASE_URL}/whatsapp/brodcast/scheduler/send`;
export const TEMPLATE_CREATE = `${API_BASE_URL}/whatsapp/templates/manage/create`;
export const TEMPLATE_EDIT = `${API_BASE_URL}/whatsapp/templates/manage/edit`;
export const TEMPLATE_SYNC = `${API_BASE_URL}/whatsapp/templates/manage/sync`;
export const TEMPLATE_TESTSEND = `${API_BASE_URL}/whatsapp/templates/send`;
export const TEMPLATE_DELETE = `${API_BASE_URL}/whatsapp/templates/manage/delete`;
export const TEMPLATE_PUBLISH = `${API_BASE_URL}/whatsapp/templates/manage/publish`;
export const TEMPLATE_MD_UPLOAD = `${API_BASE_URL}/whatsapp/media/upload`;
export const META_MEDIA_UPLOAD = `${API_BASE_URL}/meta/v19.0`;



export const getHeaders = (whatsappNumber) => {
    const userToken = JSON.parse(sessionStorage.getItem("userToken"));

    const version = "v2";
    const headers = {
        Yearcode: userToken?.yc || userToken?.yearcode,
        Version: version,
        sv: userToken?.svid || userToken?.sv,
        sp: "16",
    };

    const resolvedWhatsappNumber = whatsappNumber || userToken?.whatsappNumber;
    if (resolvedWhatsappNumber) {
        headers.whatsappNumber = resolvedWhatsappNumber;
    }

    return headers;
};

export const getHeaders1 = () => {
    const userToken = JSON.parse(sessionStorage.getItem("userToken"));
    return {
        Yearcode: userToken?.yc || userToken?.yearcode,
        sv: userToken?.svid || userToken?.sv,
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
