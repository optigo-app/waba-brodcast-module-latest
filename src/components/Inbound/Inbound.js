import React, { useEffect, useState } from 'react';
import './Inbound.scss';

import {
    CheckCheck,
    Reply,
    Package,
    DollarSign,
    BarChart2,
} from 'lucide-react';
import {Typography } from '@mui/material';
import InboundDataGrid from './InboundDataGrid';
import { fetchInboundList } from '../../API/getInbound/GetInbound';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthToken } from '../../hooks/useAuthToken';

const kpis = [
    { name: 'Delivered', value: 155, icon: <CheckCheck /> },
    { name: 'Replied', value: 10, icon: <Reply /> },
    { name: 'Orders', value: "-", icon: <Package /> },
    { name: 'Sales', value: 122, icon: <DollarSign /> },
    { name: 'Funnels', value: 10, icon: <BarChart2 /> }
];

const Inbound = () => {
    const [open, setOpen] = useState(false);

    // Data State
    const [inboundMenus, setInboundMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);

    // Pagination State
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 15, // Changed from 25 to 15
    });

    const handleClose = () => setOpen(false);

    // Router & Auth
    const { pathname } = useLocation();
    const { userToken } = useAuthToken();

    const fetchInboundData = async (page = 0, pageSize = 15) => {
        setLoading(true);
        try {
            const response = await fetchInboundList(userToken?.userId);
            if (response?.data) {
                const mappedData = response.data.map((item, index) => ({
                    id: item.id || `item-${index}`,
                    CampaignName: item.CampaignName || 'N/A',
                    TemplateName: item.TemplateName || 'N/A',
                    CustomerName: item.CustomerName || 'Unknown',
                    MobileNumber: item.MobileNumber || '',
                    ReplyMessage: item.ReplyMessage || 'No message',
                    ReplyTime: item.ReplyTime ? new Date(item.ReplyTime).toLocaleString() : 'N/A',
                    Action: 'view'
                }));

                // Handle pagination on the client side
                const start = page * pageSize;
                const end = start + pageSize;
                const paginatedData = mappedData.slice(start, end);

                setInboundMenus(paginatedData);
                setTotalRows(mappedData.length);
            } else {
                console.error('No data received from API');
                setInboundMenus([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error('Error fetching inbound data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPaginationModel(prev => ({
            ...prev,
            page: newPage
        }));
        fetchInboundData(newPage, paginationModel.pageSize);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPaginationModel(prev => ({
            page: 0, // Reset to first page
            pageSize: newPageSize
        }));
        fetchInboundData(0, newPageSize);
    };

    useEffect(() => {
        if (pathname === "/inbound") {
            fetchInboundData(paginationModel.page, paginationModel.pageSize);
        }
    }, [pathname, paginationModel.page, paginationModel.pageSize])

    return (
        <div className="inbound-dashboard-container">
            <div style={{ display: "flex", justifyContent: "center" }}>
                <main className="inboundmain-content">
                    <header className="main-header">
                        <div className="header-left">
                            <Typography variant="h6" component="h1" className="inbound-title">
                                Recieved messages ({inboundMenus.length})
                            </Typography>
                            <Typography variant="body2" className="inbound-subtitle">
                                See all customer replies from your broadcast campaigns.
                            </Typography>
                        </div>
                    </header>

                    <InboundDataGrid
                        data={inboundMenus}
                        loading={loading}
                        totalRows={totalRows}
                        pageSize={paginationModel.pageSize}
                        rowsPerPageOptions={[10, 15, 25, 50]}
                        onPageChange={(newPage) => handlePageChange(newPage)}
                        onPageSizeChange={(newPageSize) => handlePageSizeChange(newPageSize)}
                    />
                </main>
            </div>
        </div>
    );
};

export default Inbound;