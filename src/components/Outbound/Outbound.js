import React, { useEffect, useState } from 'react';
import './Outbound.scss';
import {
    Send,
    Clock,
    ChevronRight,
    PlusCircle,
    CheckCheck,
    Reply,
    Package,
    DollarSign,
    BarChart2,
    BadgeCheck,
    MessageSquare
} from 'lucide-react';
import { Box, Modal, Paper, Typography } from '@mui/material';
import { fetchOutboundList } from '../../API/getOutbound/GetOutbound';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthToken } from '../../hooks/useAuthToken';
import CampaignTreeTable from './CampaignTreeTable';
import CampaignDetailDialog from './CampaignDetailDialog';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    // border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const kpis = [
    { name: 'Delivered', value: 155, icon: <CheckCheck /> },
    { name: 'Replied', value: 10, icon: <Reply /> },
    { name: 'Orders', value: "-", icon: <Package /> },
    { name: 'Sales', value: 122, icon: <DollarSign /> },
    { name: 'Funnels', value: 10, icon: <BarChart2 /> }
];

const Outbound = () => {
    const [expandedMenu, setExpandedMenu] = useState('broadcast');
    const [activeMenu, setActiveMenu] = useState('Manual'); // Track active menu item
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 15,
        total: 0
    });
    const { userToken } = useAuthToken();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const handleRowClick = (row) => {
        setSelectedRow(row);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedRow(null);
    };

    const handleMenuClick = (e, item, isSubItem = false) => {
        e.preventDefault();
        if (item.subItems) {
            setExpandedMenu(expandedMenu === item.name.toLowerCase() ? '' : item.name.toLowerCase());
        } else {
            setActiveMenu(item.name);
        }
    };

    const sidebarItems = [
        {
            name: 'Broadcast',
            icon: <Send />,
            subItems: [
                { name: 'Manual', icon: <Clock />, active: true },
            ]
        },
    ];

    const fetchOutboundData = async (page = 0, pageSize = 15) => {
        setLoading(true);
        try {
            const response = await fetchOutboundList(userToken?.userId);
            const allData = response.data || [];

            const start = page * pageSize;
            const end = start + pageSize;
            const paginatedData = allData.slice(start, end);

            setMenus(paginatedData);
            setPagination(prev => ({
                ...prev,
                total: allData.length,
                page,
                pageSize
            }));
        } catch (error) {
            console.error('Error fetching outbound data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage, pageSize) => {
        fetchOutboundData(newPage, pageSize);
    };

    const handlePageSizeChange = (newPage, newPageSize) => {
        fetchOutboundData(newPage, newPageSize);
    };

    useEffect(() => {
        if (pathname === "/outbound") {
            fetchOutboundData();
        }
    }, [pathname])

    return (
        <Box className="outbound-dashboard">
            <Box className="outbound-layout">
                <Box component="main" className="outbound-main-content">
                    <Box component="header" className="outbound-main-header">
                        <Box className="outbound-header-left">
                            <Typography variant="h6" component="h1" className="outbound-title">
                                Sent manual messages ({menus.length})
                            </Typography>
                            <Typography variant="body2" className="outbound-subtitle">
                                View performance of your manual broadcast campaigns.
                            </Typography>
                        </Box>
                    </Box>

                    <CampaignTreeTable
                        data={menus}
                        loading={loading}
                        totalRows={pagination.total}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onRowClick={handleRowClick}
                        onReport={(row) => navigate(`/report/${row.campaignId}`)}
                    />

                    {/* Campaign Detail Dialog */}
                    <CampaignDetailDialog
                        open={dialogOpen}
                        onClose={handleDialogClose}
                        rowData={selectedRow}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Outbound;