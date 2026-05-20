import axios from 'axios';
import { UPLOADFILE } from './Config';

export const filesUploadApi = async ({ attachments, folderName, uniqueNo }) => {
  const { ukey } = JSON.parse(sessionStorage.getItem('userToken'));
  const formData = new FormData();

  attachments?.forEach((item) => {
    if (item.file) {
      formData.append('fileType', item.file); // File
    } else if (item.url) {
      formData.append('urls', item.url); // Optional: URL
    }
  });

  formData.append('folderName', folderName);
  formData.append('uKey', ukey);
  formData.append('uniqueNo', uniqueNo);

  try {
    const response = await axios.post(UPLOADFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',  
      },
    });

    return response.data;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
