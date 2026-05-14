import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Wallet } from 'lucide-react';
import { Whatsapp } from '../../utils/svg';
import WalletDrawer from './WalletDrawer';
import styles from './ChannelCard.module.scss';

// ── Static data (replace with API later) ──────────────────────────────────────
const CHANNELS = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        appName: 'Meta Apps',
        description: 'Send messages via Template notification',
        balance: 1250,
        totalCredits: 5000,
        used: 3750,
    },
];

const ChannelCard = () => {
    const navigate = useNavigate();
    const [walletOpen, setWalletOpen] = useState(false);
    const [activeChannel, setActiveChannel] = useState(null);

    const handleWalletOpen = (channel) => {
        setActiveChannel(channel);
        setWalletOpen(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h2 className={styles.pageTitle}>Channels</h2>
                <p className={styles.pageSubtitle}>Select a channel to manage your campaigns</p>
            </div>

            <div className={styles.cardGrid}>
                {CHANNELS.map((channel) => (
                    <div key={channel.id} className={styles.card}>
                        {/* Top Row: Icon + Name | Balance */}
                        <div className={styles.cardTop}>
                            <div className={styles.channelInfo}>
                                <div className={styles.iconWrap}>
                                    <Whatsapp className={styles.waIcon} />
                                </div>
                                <div className={styles.nameBlock}>
                                    <span className={styles.channelName}>{channel.name}</span>
                                    <span className={styles.appName}>{channel.appName}</span>
                                </div>
                            </div>
                            <div className={styles.balanceBlock}>
                                <span className={styles.balanceLabel}>Available Balance</span>
                                <span className={styles.balanceAmount}>
                                    ₹{channel.balance.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className={styles.progressSection}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${(channel.used / channel.totalCredits) * 100}%` }}
                                />
                            </div>
                            <div className={styles.progressMeta}>
                                <span>Used: ₹{channel.used.toLocaleString('en-IN')}</span>
                                <span>Total: ₹{channel.totalCredits.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className={styles.divider} />

                        {/* Bottom Actions */}
                        <div className={styles.cardActions}>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/templates')}
                            >
                                <FileText size={16} />
                                Template Management
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.walletBtn}`}
                                onClick={() => handleWalletOpen(channel)}
                            >
                                <Wallet size={16} />
                                Wallet Log
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Wallet Drawer */}
            <WalletDrawer
                open={walletOpen}
                onClose={() => setWalletOpen(false)}
                channel={activeChannel}
            />
        </div>
    );
};

export default ChannelCard;
