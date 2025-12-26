import { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';

const SECRET_KEY = "chat-broadcast-config";

export const useAuthToken = () => {
    const [userToken, setUserToken] = useState(() => {
        // Try to get token from sessionStorage on initial load
        return sessionStorage.getItem('userToken') || null;
    });
    const [tokenChecked, setTokenChecked] = useState(false);

    const decryptToken = (encryptedToken) => {
        try {
            const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedToken), SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (err) {
            console.error("Failed to decrypt token:", err);
            return null;
        }
    };

    useEffect(() => {
        // Only check token if it hasn't been checked before and doesn't exist
        if (tokenChecked || userToken) return;

        // Function to get URL parameters
        const getUrlParameter = (name) => {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(window.location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        // Get and process token from URL
        const tokenFromUrl = getUrlParameter('token');
        if (tokenFromUrl) {
            const decryptedToken = decryptToken(tokenFromUrl);
            if (decryptedToken) {
                setUserToken(decryptedToken);
                sessionStorage.setItem('userToken', decryptedToken);

                // Clean up URL
                const url = new URL(window.location);
                url.searchParams.delete('token');
                window.history.replaceState({}, document.title, url);
            }
        }

        setTokenChecked(true);
    }, [tokenChecked, userToken]);

    // Clear token from both state and sessionStorage
    const clearToken = () => {
        setUserToken(null);
        sessionStorage.removeItem('userToken');
    };

    return {
        userToken: JSON.parse(userToken),
        tokenChecked,
        setUserToken,
        clearToken
    };
};