
const isLocal = ["localhost", "nzen"].includes(window.location.hostname);

export const APIURL = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";
export const MEDIAAPIURL = "https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/";
export const MESSAGEAPIURL = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/send" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/send";
export const MESSAGEAPIURLBULK = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/send-bulk" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/send-bulk";
export const GETCONVERSATIONURL = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";
export const UPLOADMEDIA = "https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/";
export const LOGOUTAPI = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/logout" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/logout";
export const SAVEPLAYERID = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";
export const EXCELIMPORT = isLocal ? "http://192.168.1.71:3001/api/whatsapp/brodcast/excel-import" : "https://nxtapi.optigoapps.com/api/whatsapp/brodcast/excel-import";
export const SENDBULK = isLocal ? "http://192.168.1.71:3001/api/whatsapp/brodcast/send-bulk" : "https://nxtapi.optigoapps.com/api/whatsapp/brodcast/send-bulk";


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
