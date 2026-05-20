import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Button,
    IconButton as MuiIconButton,
    Tooltip,
    Skeleton,
    Breadcrumbs,
    Link,
    Pagination as MuiPagination,
    Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    RefreshCw,
    Download,
    CheckCircle,
    Send,
    MessageSquare,
    Eye,
    MessageCircle,
    AlertCircle,
    LayoutDashboard,
    FileText,
    ChevronRight,
    ArrowLeft,
    Clock,
    UserCheck,
    Users,
    Hash,
    Play,
    Megaphone,
    Target,
    ChevronLeft
} from 'lucide-react';
import { fetchQuickReport } from '../../API/CampaignList/QuickReport';
import { fetchTemplateMessages } from '../../API/CampaignList/TemplateMessages';
import { fetchCampaignDetails } from '../../API/CampaignList/FetchCampaignDetails';
import { useAuthToken } from '../../hooks/useAuthToken';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import toast from 'react-hot-toast';
import styles from './CampaignReport.module.scss';
import { formatDate, getMessageStatus } from '../../utils/globalFunc';

const CampaignReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userToken } = useAuthToken();
    const [loading, setLoading] = useState(true);
    const [quickReportData, setQuickReportData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [statFilter, setStatFilter] = useState('Overall');
    const [showExportModal, setShowExportModal] = useState(false);
    const [templateMessages, setTemplateMessages] = useState([]);
    const [templateMessagesLoading, setTemplateMessagesLoading] = useState(false);
    const [templateStats, setTemplateStats] = useState(null);
    const [selectedTemplateRowSelectionModel, setSelectedTemplateRowSelectionModel] = useState({
        type: 'include',
        ids: new Set()
    });

    const normalizeSelectionModel = (selectionModel) => {
        if (!selectionModel) return { type: 'include', ids: new Set() };
        if (Array.isArray(selectionModel)) {
            return { type: 'include', ids: new Set(selectionModel) };
        }
        if (selectionModel?.ids instanceof Set) {
            return {
                type: selectionModel.type || 'include',
                ids: new Set(selectionModel.ids)
            };
        }
        if (Array.isArray(selectionModel?.ids)) {
            return {
                type: selectionModel.type || 'include',
                ids: new Set(selectionModel.ids)
            };
        }
        return { type: 'include', ids: new Set() };
    };

    const selectedTemplateCount = selectedTemplateRowSelectionModel.type === 'exclude'
        ? Math.max(0, templateMessages.length - selectedTemplateRowSelectionModel.ids.size)
        : selectedTemplateRowSelectionModel.ids.size;

    const isTemplateRowSelected = (rowId) => {
        if (selectedTemplateRowSelectionModel.type === 'exclude') {
            return !selectedTemplateRowSelectionModel.ids.has(rowId);
        }
        return selectedTemplateRowSelectionModel.ids.has(rowId);
    };

    const getChatMsgStatusFromFilter = (filter) => {
        if (filter === 'Sent') return 1;
        if (filter === 'Delivered') return 2;
        if (filter === 'Read') return 3;
        if (filter === 'Failed') return 4;
        if (filter === 'Replied') return 5;
        return '';
    };

    const loadReport = async () => {
        setLoading(true);
        try {
            const quickReportResult = await fetchQuickReport(userToken?.userId, id);
            if (quickReportResult.success && quickReportResult.data) {
                setQuickReportData(...quickReportResult.data?.rd);
                console.log('Quick Report Data set:', quickReportResult.data);
            } else {
                console.log('Quick Report failed or no data');
            }
        } catch (error) {
            console.error('Error loading report:', error);
            toast.error('Error loading report data');
        } finally {
            setLoading(false);
        }
    };

    const handleRetarget = async () => {
        try {
            toast.loading('Preparing retarget campaign...', { id: 'retarget-campaign' });

            const detailsResult = await fetchCampaignDetails(userToken?.userId, id);
            if (!detailsResult.success || !detailsResult.data?.rd?.length) {
                toast.error('Failed to load campaign details');
                return;
            }

            const templateName = detailsResult.data?.rd1?.[0]?.TemplateName || 'Template';
            const statusLabel = statFilter || 'Overall';
            const sourceCampaignName = quickReportData?.CampaignName || detailsResult.data.rd[0]?.CampaignName || detailsResult.data.rd[0]?.Name || `Campaign ${id}`;
            const chatMsgStatus = getChatMsgStatusFromFilter(statFilter);

            const campaignData = {
                ...detailsResult.data.rd[0],
                Name: `retarget-${sourceCampaignName}-${statusLabel}`,
                templateData: detailsResult.data.rd1?.[0],
                audienceData: [], // Will be fetched in AddCampaign Audience step
                isClone: true,
                isRetarget: true,
                RetargetSourceCampaignName: sourceCampaignName,
                RetargetStatusLabel: statusLabel,
                RetargetTemplateName: templateName,
                RetargetSourceCampaignId: id, // Pass original campaign ID for API call
                RetargetChatMsgStatus: chatMsgStatus, // Pass status for API filtering
            };

            navigate('/campaigns/add', { state: { campaign: campaignData } });
            toast.success('Retarget campaign flow started');
        } catch (error) {
            console.error('Error starting retarget flow:', error);
            toast.error('Failed to start retarget flow');
        } finally {
            toast.dismiss('retarget-campaign');
        }
    };

    const loadTemplateMessages = async () => {
        setTemplateMessagesLoading(true);
        try {
            const result = await fetchTemplateMessages(
                userToken?.userId,
                id,
                quickReportData?.TemplateId || 1,
                getChatMsgStatusFromFilter(statFilter)
            );

            if (result.success) {
                setTemplateStats(result.stats);
                setTemplateMessages(result.messages);
                setSelectedTemplateRowSelectionModel({ type: 'exclude', ids: new Set() });
            } else {
                setTemplateStats(null);
                setTemplateMessages([]);
                setSelectedTemplateRowSelectionModel({ type: 'include', ids: new Set() });
            }
        } catch (error) {
            console.error('Error loading template messages:', error);
            toast.error('Error loading template messages');
        } finally {
            setTemplateMessagesLoading(false);
        }
    };

    useEffect(() => {
        if (id && userToken?.userId) {
            loadReport();
        }
    }, [id, userToken?.userId]);

    useEffect(() => {
        if (activeTab === 'template' && quickReportData && userToken?.userId) {
            loadTemplateMessages();
        }
    }, [activeTab, statFilter, quickReportData?.TemplateId]);

    const handleExport = () => {
        toast('Export functionality will be available soon...', {
            icon: '⚠️',
        });
        return;
        setShowExportModal(true);
    };

    const handleExportConfirm = () => {
        try {
            toast.error('Export not available');
            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export report');
        } finally {
            setShowExportModal(false);
        }
    };

    if (loading) {
        return (
            <Box className={styles.page}>
                {/* ── Page Header Skeleton ── */}
                <div className={styles.topHeader}>
                    <div className={styles.headerLeft}>
                        <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                        <div className={styles.headerIconWrap}>
                            <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                        </div>
                        <div>
                            <Skeleton variant="text" width={150} height={28} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                            <Skeleton variant="text" width={200} height={16} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                    </div>
                </div>

                {/* ── Main Content Skeleton ── */}
                <div className={styles.mainContent}>
                    {/* Left Sidebar Skeleton */}
                    <div className={styles.leftSidebar}>
                        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: '12px', bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                    </div>

                    {/* Right Content Skeleton */}
                    <div className={styles.rightContent}>
                        <Box className={styles.scrollArea}>
                            {/* Quick Report Metrics Skeleton */}
                            <Box className={styles.section}>
                                <Skeleton variant="text" width={120} height={24} sx={{ mb: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                <Grid container spacing={2}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Grid size={{ xs: 12, sm: 4, md: 2 }} key={i}>
                                            <Box className={styles.metricCard}>
                                                <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                                <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                                <Skeleton variant="text" width={80} height={24} sx={{ mt: 0.5, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Campaign Overview Details Skeleton */}
                            <Box className={styles.section}>
                                <Skeleton variant="text" width={180} height={24} sx={{ mb: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                <Grid container spacing={2}>
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                                            <Box className={styles.detailCard}>
                                                <Skeleton variant="text" width={100} height={16} sx={{ mb: 1, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                                <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                                <Skeleton variant="circular" width={36} height={36} sx={{ position: 'absolute', right: 12, top: 12, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Segmented Progress Stats Skeleton */}
                            <Box className={styles.section}>
                                <Grid container spacing={2}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Grid size={{ xs: 12, sm: 4, md: 2 }} key={i}>
                                            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Data Grid Skeleton */}
                            <Box className={styles.section}>
                                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: '12px', bgcolor: 'rgba(0, 0, 0, 0.03)' }} />
                            </Box>
                        </Box>
                    </div>
                </div>
            </Box>
        );
    }

    // Use quick report data
    const metrics = [
        { label: 'All', value: quickReportData?.Audience || 0, count: quickReportData?.Audience || 0, icon: LayoutDashboard, color: '#7367f0', bg: 'rgba(115, 103, 240, 0.12)' },
        { label: 'Sent', value: quickReportData?.SentPercentage ? `${quickReportData?.SentPercentage}%` : '0%', count: quickReportData?.SentCount || 0, icon: Send, color: '#00cfe8', bg: 'rgba(0, 207, 232, 0.12)' },
        { label: 'Delivered', value: quickReportData?.DeliveredPercentage ? `${quickReportData?.DeliveredPercentage}%` : '0%', count: quickReportData?.DeliveredCount || 0, icon: MessageSquare, color: '#28c76f', bg: 'rgba(40, 199, 111, 0.12)' },
        { label: 'Read', value: quickReportData?.ReadPercentage ? `${quickReportData?.ReadPercentage}%` : '0%', count: quickReportData?.ReadCount || 0, icon: Eye, color: '#1d9051', bg: 'rgba(29, 144, 81, 0.12)' },
        { label: 'Replied', value: '0%', count: 0, icon: MessageCircle, color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.12)' },
        { label: 'Failed', value: quickReportData?.FailedPercentage ? `${quickReportData?.FailedPercentage}%` : '0%', count: quickReportData?.FailedCount || 0, icon: AlertCircle, color: '#ea5455', bg: 'rgba(234, 84, 85, 0.12)' },
    ];

    const configDetails = [
        { label: 'Campaign Status', value: quickReportData?.Status === 3 ? 'COMPLETED' : 'IN PROGRESS', icon: Play, color: '#28c76f', bg: 'rgba(40, 199, 111, 0.12)' },
        { label: 'Campaign Name', value: quickReportData?.CampaignName || '—', icon: FileText, color: '#7367f0', bg: 'rgba(115, 103, 240, 0.12)' },
        { label: 'Trigger Campaign', value: quickReportData?.Type === 1 ? 'Immediately' : quickReportData?.Type === 2 ? 'Scheduled' : 'Recurring', icon: Clock, color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.12)' },
        { label: 'Processed At', value: formatDate(quickReportData?.ProcessTime) || '—', icon: Clock, color: '#28c76f', bg: 'rgba(40, 199, 111, 0.12)', isStopwatch: true },
        { label: 'Audience Type', value: quickReportData?.Source || 'Segmented', icon: UserCheck, color: '#00cfe8', bg: 'rgba(0, 207, 232, 0.12)' },
        { label: 'Audience Size', value: quickReportData?.Audience || 0, icon: Users, color: '#ea5455', bg: 'rgba(234, 84, 85, 0.12)' },
        { label: 'Messages', value: quickReportData?.TotalMessage || 0, icon: Hash, color: '#7367f0', bg: 'rgba(115, 103, 240, 0.12)' },
    ];

    return (
        <Box className={styles.page}>
            {/* ── Page Header ── */}
            <div className={styles.topHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={() => navigate('/campaigns')}>
                        <ArrowLeft size={16} />
                    </button>
                    <div className={styles.headerIconWrap}>
                        <Megaphone size={18} />
                    </div>
                    <div>
                        <h1 className={styles.pageTitle}>Campaign Report</h1>
                        <p className={styles.pageSubtitle}>
                            {activeTab === 'template' ? (
                                <span className={styles.metaInfo}>
                                    Channel (Optigo Apps) <span className={styles.separator}>||</span> Template name ({quickReportData?.TemplateId || '—'})
                                </span>
                            ) : (
                                quickReportData?.CampaignName || 'Report'
                            )}
                        </p>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <Button
                        variant="outlined"
                        className='varientOutlinedBtn'
                        startIcon={<RefreshCw size={18} />}
                        onClick={loadReport}
                    >
                        Refresh Report
                    </Button>
                    {activeTab !== 'template' && (
                        <Button
                            variant="outlined"
                            className='secondaryBtnClassname'
                            startIcon={<Download size={18} />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className={styles.mainContent}>
                {/* Left Sidebar */}
                <div className={styles.leftSidebar}>
                    <div className={styles.stepperCard}>
                        <div className={styles.stepperMenu}>
                            <div
                                className={`${styles.menuItem} ${activeTab === 'overview' ? styles.active : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <div className={styles.menuStepBadge}>1</div>
                                <LayoutDashboard size={16} className={styles.menuIcon} />
                                <span className={styles.menuLabel}>Campaign Overview</span>
                            </div>
                            <div
                                className={`${styles.menuItem} ${activeTab === 'template' ? styles.active : ''}`}
                                onClick={() => setActiveTab('template')}
                            >
                                <div className={styles.menuStepBadge}>2</div>
                                <FileText size={16} className={styles.menuIcon} />
                                <span className={styles.menuLabel}>(#1) Template</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className={styles.rightContent}>
                    <Box className={styles.scrollArea}>
                        {activeTab === 'overview' ? (
                            <>
                                {/* Quick Report Metrics */}
                                <Box className={styles.section}>
                                    <Typography className={styles.sectionTitle}>Quick Report</Typography>
                                    <Grid container spacing={2}>
                                        {metrics.map((m, idx) => (
                                            <Grid size={{ xs: 12, sm: 4, md: 2 }} key={idx}>
                                                <Box className={styles.metricCard} style={{ color: m.color }}>
                                                    <Box className={styles.metricIconWrap} style={{ backgroundColor: m.bg, color: m.color }}>
                                                        <m.icon size={22} />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" className={styles.metricLabel}>{m.label}</Typography>
                                                        <Typography variant="h6" className={styles.metricValue}>
                                                            {m.value}
                                                            <span className={styles.metricCount}>({m.count})</span>
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                {/* Campaign Overview Details */}
                                <Box className={styles.section}>
                                    <Typography className={styles.sectionTitle}>Campaign Overview</Typography>
                                    <Grid container spacing={2}>
                                        {configDetails.map((d, idx) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                                                <Box className={styles.detailCard} style={{ color: d.color }}>
                                                    <Box className={styles.detailContent}>
                                                        <Typography variant="caption" className={styles.detailLabel}>{d.label}</Typography>
                                                        <Typography variant="subtitle1" className={styles.detailValue}>
                                                            {d.label === 'Campaign Status' && (
                                                                <Box component="span" className={styles.statusSignal} />
                                                            )}
                                                            {d.value}
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        className={styles.detailIconWrap}
                                                        style={{
                                                            backgroundColor: d.bg,
                                                            color: d.color
                                                        }}
                                                    >
                                                        <d.icon size={22} />
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </>
                        ) : (
                            <Box className={styles.templateView}>
                                {/* Segmented Progress Stats */}
                                <Box className={styles.segmentedStats}>
                                    {(() => {
                                        const overall = templateStats?.Overall || 0;
                                        const sent = templateStats?.Sent || 0;
                                        const delivered = templateStats?.Delivered || 0;
                                        const read = templateStats?.ReadCount || 0;
                                        const failed = templateStats?.Failed || 0;
                                        const replied = 0; // Not in API response yet

                                        const calculatePercentage = (value) => overall > 0 ? ((value / overall) * 100).toFixed(1) : '0';

                                        return [
                                            { label: 'Overall', value: '100%', count: overall },
                                            { label: 'Sent', value: `${calculatePercentage(sent)}%`, count: sent },
                                            { label: 'Delivered', value: `${calculatePercentage(delivered)}%`, count: delivered },
                                            { label: 'Read', value: `${calculatePercentage(read)}%`, count: read },
                                            { label: 'Replied', value: `${calculatePercentage(replied)}%`, count: replied },
                                            { label: 'Failed', value: `${calculatePercentage(failed)}%`, count: failed },
                                        ];
                                    })().map((stat, i) => (
                                        <Box
                                            key={i}
                                            className={`${styles.statBlock} ${statFilter === stat.label ? styles.statActive : ''}`}
                                            onClick={() => setStatFilter(stat.label)}
                                        >
                                            <Typography className={styles.statValue}>
                                                {stat.value} <span className={styles.statCount}>({stat.count})</span>
                                            </Typography>
                                            <Typography className={styles.statLabel}>{stat.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Audience Retargeting Section */}
                                <Box className={styles.retargetSection}>
                                    <Box className={styles.retargetHeader}>
                                        <Box className={styles.retargetInfo}>
                                            <Typography className={styles.retargetTitle}>Audience Retargeting</Typography>
                                            <Typography className={styles.totalCount}>
                                                Filter: {statFilter || 'Overall'}
                                            </Typography>
                                        </Box>
                                        <Box className={styles.retargetActions}>
                                            <Button
                                                variant="contained"
                                                className='buttonClassname'
                                                startIcon={<Target size={16} />}
                                                onClick={handleRetarget}
                                            >
                                                Retarget
                                            </Button>
                                            <Button
                                                variant="contained"
                                                className='secondaryBtnClassname'
                                                startIcon={<Download size={16} />}
                                                onClick={handleExport}
                                            >
                                                Export
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                <Paper className={styles.gridPaper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e4e8ee', overflow: 'hidden', backgroundColor: '#fff' }}>
                                        <DataGrid
                                            rows={templateMessages}
                                            columns={[
                                                {
                                                    field: 'TemplateName',
                                                    headerName: 'TEMPLATE NAME',
                                                    flex: 1,
                                                    renderCell: (params) => (
                                                        <Typography variant="body2">
                                                            {params.value || '—'}
                                                        </Typography>
                                                    )
                                                },
                                                {
                                                    field: 'CustomerName',
                                                    headerName: 'CUSTOMER NAME',
                                                    flex: 1,
                                                    renderCell: (params) => (
                                                        <Typography variant="body2">
                                                            {params.value || `${params.row.FirstName || ''} ${params.row.LastName || ''}`.trim() || '—'}
                                                        </Typography>
                                                    )
                                                },
                                                {
                                                    field: 'PhoneNo',
                                                    headerName: 'PHONE NO',
                                                    flex: 1,
                                                    renderCell: (params) => (
                                                        <Typography variant="body2" className={styles.userPhone}>
                                                            {params.value || '—'}
                                                        </Typography>
                                                    )
                                                },
                                                {
                                                    field: 'DateTime',
                                                    headerName: 'DATE TIME',
                                                    width: 180,
                                                    renderCell: (params) => (
                                                        <Typography variant="body2">
                                                            {formatDate(params.value) || '—'}
                                                        </Typography>
                                                    )
                                                },
                                                {
                                                    field: 'MessageType',
                                                    headerName: 'MESSAGE TYPE',
                                                    width: 120,
                                                    renderCell: (params) => (
                                                        <Typography variant="body2">
                                                            {params.value || '—'}
                                                        </Typography>
                                                    )
                                                },
                                                {
                                                    field: 'Status',
                                                    headerName: 'STATUS',
                                                    width: 120,
                                                    renderCell: (params) => {
                                                        const statusConfig = getMessageStatus(params.value);
                                                        return (
                                                            <Chip
                                                                label={statusConfig.label}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: `${statusConfig.color}20`,
                                                                    color: statusConfig.color,
                                                                    fontSize: '0.72rem',
                                                                    height: '22px',
                                                                    fontWeight: 600,
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            />
                                                        );
                                                    }
                                                },
                                            ]}
                                            getRowId={(row) => row.MessageId || row.PhoneNo}
                                            checkboxSelection
                                            disableRowSelectionOnClick
                                            rowSelectionModel={selectedTemplateRowSelectionModel}
                                            onRowSelectionModelChange={(newSelection) =>
                                                setSelectedTemplateRowSelectionModel(normalizeSelectionModel(newSelection))
                                            }
                                            rowHeight={60}
                                            initialState={{
                                                pagination: {
                                                    paginationModel: { pageSize: 10, page: 0 },
                                                },
                                            }}
                                            pageSizeOptions={[5, 10, 20, 50]}
                                            loading={templateMessagesLoading}
                                            sx={{
                                                border: 'none',
                                                minHeight: 520,
                                                '& .MuiDataGrid-columnHeaders': {
                                                    backgroundColor: '#f8fafc',
                                                    color: 'var(--secondary-color)',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                },
                                                '& .MuiDataGrid-columnHeaderTitle': {
                                                    fontWeight: 700,
                                                },
                                                '& .MuiDataGrid-cell': {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0 12px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                },
                                                '& .MuiDataGrid-footerContainer': {
                                                    borderTop: '1px solid var(--sidebar-borderColor)',
                                                },
                                                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                                                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
                                            }}
                                        />
                                    </Paper>
                            </Box>
                        )}
                    </Box>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onConfirm={handleExportConfirm}
                title="Export Campaign Report"
                description={`Are you sure you want to download the report for "${quickReportData?.CampaignName || 'this campaign'}"? The file will include audience details based on your current filter (${statFilter}).`}
                confirmLabel="Download"
                cancelLabel="Cancel"
                icon={Download}
            />
        </Box>
    );
};

export default CampaignReport;
