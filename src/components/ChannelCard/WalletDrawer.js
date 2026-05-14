import React from 'react';
import { X, ArrowDownCircle, TrendingUp, Wallet } from 'lucide-react';
import { Drawer } from '@mui/material';
import styles from './ChannelCard.module.scss';

// ── Static transaction data (replace with API later) ─────────────────────────
const STATIC_WALLET = {
    totalAmount: 5000,
    deducted: 3750,
    remaining: 1250,
    transactions: [
        { id: 1, date: '13 May 2026', description: 'Admin Credit', type: 'credit',  amount: 5000, balance: 5000 },
        { id: 2, date: '10 May 2026', description: 'Bulk Campaign #1', type: 'debit', amount: -500, balance: 4500 },
        { id: 3, date: '09 May 2026', description: 'Bulk Campaign #2', type: 'debit', amount: -1200, balance: 3300 },
        { id: 4, date: '07 May 2026', description: 'Bulk Campaign #3', type: 'debit', amount: -750, balance: 2550 },
        { id: 5, date: '05 May 2026', description: 'Bulk Campaign #4', type: 'debit', amount: -800, balance: 1750 },
        { id: 6, date: '03 May 2026', description: 'Bulk Campaign #5', type: 'debit', amount: -500, balance: 1250 },
    ],
};

const WalletDrawer = ({ open, onClose, channel }) => {
    const wallet = STATIC_WALLET;
    const usedPercent = Math.round((wallet.deducted / wallet.totalAmount) * 100);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: 420, background: 'transparent', boxShadow: 'none' } }}
        >
            <div className={styles.drawerRoot}>
                {/* Drawer Header */}
                <div className={styles.drawerHeader}>
                    <div className={styles.drawerTitleRow}>
                        <Wallet size={20} className={styles.drawerIcon} />
                        <span className={styles.drawerTitle}>Wallet Log</span>
                    </div>
                    <button className={styles.drawerClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Balance Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={`${styles.summaryCard} ${styles.summaryTotal}`}>
                        <span className={styles.summaryLabel}>Total Credited</span>
                        <span className={styles.summaryValue}>₹{wallet.totalAmount.toLocaleString('en-IN')}</span>
                        <TrendingUp size={14} className={styles.summaryIcon} />
                    </div>
                    <div className={`${styles.summaryCard} ${styles.summaryDeducted}`}>
                        <span className={styles.summaryLabel}>Total Used</span>
                        <span className={styles.summaryValue}>₹{wallet.deducted.toLocaleString('en-IN')}</span>
                        <ArrowDownCircle size={14} className={styles.summaryIcon} />
                    </div>
                    <div className={`${styles.summaryCard} ${styles.summaryRemaining}`}>
                        <span className={styles.summaryLabel}>Remaining</span>
                        <span className={styles.summaryValue}>₹{wallet.remaining.toLocaleString('en-IN')}</span>
                        <Wallet size={14} className={styles.summaryIcon} />
                    </div>
                </div>

                {/* Usage Bar */}
                <div className={styles.drawerProgressSection}>
                    <div className={styles.drawerProgressLabel}>
                        <span>Usage</span>
                        <span>{usedPercent}% used</span>
                    </div>
                    <div className={styles.drawerProgressBar}>
                        <div className={styles.drawerProgressFill} style={{ width: `${usedPercent}%` }} />
                    </div>
                </div>

                {/* Transaction History */}
                <div className={styles.transactionSection}>
                    <h4 className={styles.transactionTitle}>Transaction History</h4>
                    <div className={styles.transactionList}>
                        {wallet.transactions.map((txn) => (
                            <div key={txn.id} className={styles.txnRow}>
                                <div className={styles.txnLeft}>
                                    <div className={`${styles.txnDot} ${txn.type === 'credit' ? styles.txnDotCredit : styles.txnDotDebit}`} />
                                    <div>
                                        <span className={styles.txnDesc}>{txn.description}</span>
                                        <span className={styles.txnDate}>{txn.date}</span>
                                    </div>
                                </div>
                                <div className={styles.txnRight}>
                                    <span className={`${styles.txnAmount} ${txn.type === 'credit' ? styles.txnCredit : styles.txnDebit}`}>
                                        {txn.type === 'credit' ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                                    </span>
                                    <span className={styles.txnBalance}>Bal: ₹{txn.balance.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default WalletDrawer;
