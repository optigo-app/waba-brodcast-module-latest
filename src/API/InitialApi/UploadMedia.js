import axios from "axios";
import { EXCELIMPORT, getHeaders } from "./Config";

export const ExcelImport = async (file, userid, CampaignId) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userid", userid);
    formData.append("CampaignId", CampaignId);

    const headers = {
      ...getHeaders(),
      "Content-Type": "multipart/form-data",
    };

    const { data } = await axios.post(EXCELIMPORT, formData, {
      headers,
    });

    return data;
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error;
  }
}
