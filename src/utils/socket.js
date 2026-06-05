import { io } from 'socket.io-client';

const isLocal = ['5dmjw0dg-2000.inc1.devtunnels.ms'].includes(window.location.hostname);
const isNxt = ['nxtwababroadcast.optigoapps.com'].includes(window.location.hostname);
const isLocalWeb = ['wabachat.web'].includes(window.location.hostname);

const getSocketURL = () => {
    const url = isLocal ?
        process.env.REACT_APP_API_DEVELOPMENT_URL :
        isLocalWeb ? process.env.REACT_APP_API_WEB_DEVELOPMENT_URL :
            isNxt ? process.env.REACT_APP_API_NXT_URL :
                process.env.REACT_APP_API_PRODUCTION_URL;
    return url;
};

const socket = io(getSocketURL(), {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('✅ Socket connected');
});

socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('templateUpdate', (data) => {
    console.log('📨 templateUpdate received:', data);
});

export default socket;
export { getSocketURL };
