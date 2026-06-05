import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { fetchWabaBilling } from '../API/ChannelBilling/WabaBilling';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [billingData, setBillingData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastAppUserId, setLastAppUserId] = useState(null);

    const loadWalletData = useCallback(async (appUserId) => {
        if (!appUserId) {
            setBillingData(null);
            setLastAppUserId(null);
            setIsLoading(false);
            return;
        }

        // Only call API if no data exists or user changed
        if (billingData && lastAppUserId === appUserId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetchWabaBilling(appUserId);
            if (response?.success) {
                setBillingData(response.data);
                setLastAppUserId(appUserId);
            } else {
                setBillingData(null);
                setLastAppUserId(null);
                setError('Failed to load wallet data');
            }
        } catch (err) {
            console.error('Error fetching wallet data:', err);
            setBillingData(null);
            setLastAppUserId(null);
            setError(err.message || 'Failed to load wallet data');
        } finally {
            setIsLoading(false);
        }
    }, [billingData, lastAppUserId]);

    const walletInfo = useMemo(() => {
        if (!billingData) return null;

        const totalCredits = Number(billingData.totalBalance || 0);
        const availableBalance = Number(billingData.availableBalance || 0);
        const used = Math.max(0, totalCredits - availableBalance);
        const progressPercent = totalCredits > 0 ? Math.min(100, (used / totalCredits) * 100) : 0;

        return {
            ...billingData,
            totalCredits,
            availableBalance,
            used,
            progressPercent,
            refundBalance: Number(billingData.refundBalance || 0),
        };
    }, [billingData]);

    const hasSufficientBalance = useMemo(() => {
        return walletInfo && walletInfo.availableBalance > 1;
    }, [walletInfo]);

    const value = {
        billingData,
        walletInfo,
        isLoading,
        error,
        hasSufficientBalance,
        loadWalletData,
        refreshWallet: () => loadWalletData(lastAppUserId),
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export default WalletContext;
