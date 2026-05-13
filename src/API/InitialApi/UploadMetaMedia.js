import axios from "axios";
import { TEMPLATE_MD_UPLOAD, getHeaders1 } from "./Config";
import toast from 'react-hot-toast';

/**
 * Uploads a media file to the backend proxy, which then handles 
 * the Meta Resumable Upload to get a valid template handle.
 * 
 * @param {File}     file           - The file to upload
 * @param {Function} onProgress     - Optional progress callback (0-100)
 * @returns {Promise<string>}       - The Meta asset handle (h)
 */
export const uploadMetaMedia = async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const { data } = await axios.post(TEMPLATE_MD_UPLOAD, formData, {
            headers: {
                ...getHeaders1(),
                "Accept": "application/json, text/plain, */*",
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const total = progressEvent.total || file.size;
                    const percent = Math.round((progressEvent.loaded * 100) / total);
                    onProgress(Math.min(percent, 100));
                }
            }
        });

        // Extract handle based on your specific backend response structure
        const handle = data?.data?.handle?.h || data?.data?.id || data?.payload?.h || data?.id;

        if (data?.success && handle) {
            toast.success(data?.message || "Media uploaded successfully!");
        } else if (!handle) {
            console.error("Backend Response:", data);
            throw new Error(data?.message || "No media handle returned from server.");
        }

        if (onProgress) onProgress(100);
        return handle;

    } catch (err) {
        console.error("Upload Error:", err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || "Media upload failed");
    }
};