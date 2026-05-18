import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, LinearProgress, Divider } from '@mui/material';
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
        <Box sx={{ padding: '1.5rem', background: '#fdfdfd', minHeight: '100vh' }}>
            <Box sx={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--sidebar-borderColor)' }}>
                <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--title-color)', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                    Channels
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'var(--text-2nd-color)', margin: '0.25rem 0 0', fontFamily: 'Poppins, sans-serif' }}>
                    Select a channel to manage your campaigns
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {CHANNELS.map((channel) => (
                    <Paper
                        key={channel.id}
                        sx={{
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e4e8ee',
                            padding: '1.5rem',
                            boxShadow: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            overflow: 'hidden',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        {/* Top Row: Icon + Name | Balance */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                <Box
                                    sx={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Whatsapp width={42} height={42} fill="var(--title-color)" />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <Typography variant="body1" sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--title-color)', lineHeight: 1.2 }}>
                                        {channel.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.78rem', color: 'var(--text-2nd-color)', fontWeight: 500 }}>
                                        {channel.appName}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'var(--text-2nd-color)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Available Balance
                                </Typography>
                                <Typography variant="h5" sx={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--title-color)', letterSpacing: '-0.02em' }}>
                                    ₹{channel.balance.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Progress Bar */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <LinearProgress
                                variant="determinate"
                                value={(channel.used / channel.totalCredits) * 100}
                                sx={{
                                    width: '100%',
                                    height: '7px',
                                    borderRadius: '99px',
                                    backgroundColor: 'var(--sidebar-borderColor)',
                                    '& .MuiLinearProgress-bar': {
                                        background: 'var(--primary-gradient)',
                                        borderRadius: '99px',
                                    },
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-2nd-color)', fontWeight: 500 }}>
                                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'var(--text-2nd-color)', fontWeight: 500 }}>
                                    Used: ₹{channel.used.toLocaleString('en-IN')}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'var(--text-2nd-color)', fontWeight: 500 }}>
                                    Total: ₹{channel.totalCredits.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Divider */}
                        <Divider sx={{ borderColor: 'var(--sidebar-borderColor)' }} />

                        {/* Bottom Actions */}
                        <Box sx={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                            <Button
                                className='buttonClassname'
                                onClick={() => navigate('/templates')}
                                startIcon={<FileText size={16} />}
                                fullWidth
                            >
                                Template Management
                            </Button>
                            <Button
                                className='varientOutlinedBtn'
                                onClick={() => handleWalletOpen(channel)}
                                startIcon={<Wallet size={16} />}
                                fullWidth
                            >
                                Wallet Log
                            </Button>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Wallet Drawer */}
            <WalletDrawer
                open={walletOpen}
                onClose={() => setWalletOpen(false)}
                channel={activeChannel}
            />
        </Box>
    );
};

export default ChannelCard;
