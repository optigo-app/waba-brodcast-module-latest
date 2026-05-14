import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, RefreshCw, FileText, CheckCircle, XCircle, Clock,
    AlertCircle, LayoutGrid, List, Eye, Send, Copy, Edit2,
    Trash2, Image, Video, FileType, FileQuestion, BookOpen,
    ChevronLeft, ChevronRight, X, ArrowLeft
} from 'lucide-react';
import { Tooltip, Drawer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Button, ToggleButtonGroup, ToggleButton, Grid, CardContent, Stack, Skeleton, Card, Paper } from '@mui/material';
import { fetchCrmTemplates } from '../../API/TemplateList/FetchCrmTemplates';
import { syncTemplates } from '../../API/TemplateList/SyncTemplates';
import { deleteTemplate } from '../../API/TemplateList/DeleteTemplate';
import { useAuthToken } from '../../hooks/useAuthToken';
import TemplateGrid from './TemplateGrid';
import TemplateTable from './TemplateTable';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import FilterBar from '../Common/FilterBar/FilterBar';
import toast from 'react-hot-toast';
import styles from './Templates.module.scss';
import { previewBg } from '../../utils/globalFunc';
import TemplateSkelton from './TemplateSkelton';

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    APPROVED: { label: 'Approved', icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
    REJECTED: { label: 'Rejected', icon: XCircle, color: '#dc2626', bg: '#fee2e2' },
    PENDING: { label: 'Pending', icon: Clock, color: '#d97706', bg: '#fef3c7' },
    IN_APPEAL: { label: 'In Appeal', icon: AlertCircle, color: '#7c3aed', bg: '#ede9fe' },
    DRAFT: { label: 'Draft', icon: BookOpen, color: '#6b7280', bg: '#f3f4f6' },
};

const getStatusConfig = (status) =>
    STATUS_CONFIG[status?.toUpperCase()] || { label: status || 'Unknown', icon: Clock, color: '#6b7280', bg: '#f3f4f6' };

// ── Helper: detect media type from components ─────────────────────────────────
const getHeaderType = (components = []) => {
    const header = components.find((c) => c.type === 'HEADER');
    if (!header) return 'text';
    const fmt = header.format?.toLowerCase();
    if (fmt === 'image') return 'image';
    if (fmt === 'video') return 'video';
    if (fmt === 'document') return 'document';
    return 'text';
};

const COUNTRY_RULES = {
    '+91': { length: 10, pattern: /^[6-9]\d{9}$/, example: '9876543210' },
    '+1': { length: 10, pattern: /^\d{10}$/, example: '2025550123' },
    '+44': { length: 10, pattern: /^7\d{9}$/, example: '7123456789' },
    '+971': { length: 9, pattern: /^5\d{8}$/, example: '501234567' },
};

const HEADER_ICONS = {
    image: { Icon: Image, label: 'Image', color: '#7c3aed', bg: '#ede9fe' },
    video: { Icon: Video, label: 'Video', color: '#0369a1', bg: '#e0f2fe' },
    document: { Icon: FileType, label: 'Document', color: '#b45309', bg: '#fef3c7' },
    text: { Icon: FileQuestion, label: 'Text', color: '#374151', bg: '#f3f4f6' },
};

// ── Action Buttons (shared) ───────────────────────────────────────────────────
const ActionButtons = ({ template, status, onView, onSend, onClone, onEdit, onDelete }) => {
    const isApproved = status?.toUpperCase() === 'APPROVED';
    const isDraft = status?.toUpperCase() === 'DRAFT';

    return (
        <div className={styles.actionGroup}>
            <Tooltip title="View" arrow>
                <button className={styles.iconBtn} onClick={() => onView?.(template)}>
                    <Eye size={15} />
                </button>
            </Tooltip>

            {isApproved && (
                <Tooltip title="Send" arrow>
                    <button className={`${styles.iconBtn} ${styles.iconBtnSend}`} onClick={() => onSend?.(template)}>
                        <Send size={15} />
                    </button>
                </Tooltip>
            )}

            {isDraft && (
                <Tooltip title="Apply / Submit" arrow>
                    <button className={`${styles.iconBtn} ${styles.iconBtnApply}`} onClick={() => onSend?.(template)}>
                        <BookOpen size={15} />
                    </button>
                </Tooltip>
            )}

            <Tooltip title="Clone" arrow>
                <button className={styles.iconBtn} onClick={() => onClone?.(template)}>
                    <Copy size={15} />
                </button>
            </Tooltip>

            <Tooltip title="Edit" arrow>
                <button className={styles.iconBtn} onClick={() => onEdit?.(template)}>
                    <Edit2 size={15} />
                </button>
            </Tooltip>

            <Tooltip title="Delete" arrow>
                <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} onClick={() => onDelete?.(template)}>
                    <Trash2 size={15} />
                </button>
            </Tooltip>
        </div>
    );
};


// ── List Row ──────────────────────────────────────────────────────────────────

// ── Main Templates Component ──────────────────────────────────────────────────
const Templates = () => {
    const { userToken } = useAuthToken();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);

    const [openSendDialog, setOpenSendDialog] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState(null);
    const [deleteTemplateData, setDeleteTemplateData] = useState(null);

    const loadTemplates = async () => {
        if (!userToken?.username) return;
        setLoading(true);
        const result = await fetchCrmTemplates(userToken.username);
        setTemplates(result.data);
        setLoading(false);
    };

    useEffect(() => { loadTemplates(); /* eslint-disable-next-line */ }, [userToken?.username]);

    const handleSync = async () => {
        if (!userToken?.username) return;
        setLoading(true);
        const payload = {
            CreatedBy: userToken?.id || 4,
            UserId: userToken?.username || 'admin@orail.co.in'
        };

        toast.promise(
            syncTemplates(payload).then((result) => {
                if (result.success) {
                    loadTemplates();
                    return 'Templates synced successfully';
                } else {
                    throw new Error('Failed to sync templates');
                }
            }),
            {
                loading: 'Syncing templates...',
                success: (msg) => msg,
                error: (err) => err.message,
            }
        ).finally(() => {
            setLoading(false);
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTemplateData) return;

        toast.promise(
            deleteTemplate({ TemplateId: deleteTemplateData.Id }).then((result) => {
                if (result.success) {
                    loadTemplates();
                    return 'Template deleted successfully';
                } else {
                    throw new Error('Failed to delete template');
                }
            }),
            {
                loading: 'Deleting template...',
                success: (msg) => msg,
                error: (err) => err.message,
            }
        ).finally(() => {
            setDeleteTemplateData(null);
        });
    };

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    const filtered = templates.filter((t) => {
        const matchSearch = t.TemplateName?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || t.WabaStatus?.toUpperCase() === filterStatus;
        return matchSearch && matchStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.EntryDate) - new Date(a.EntryDate);
        if (sortBy === 'oldest') return new Date(a.EntryDate) - new Date(b.EntryDate);
        if (sortBy === 'name') return (a.TemplateName || '').localeCompare(b.TemplateName || '');
        return 0;
    });

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = sorted.slice(startIndex, startIndex + itemsPerPage);

    const statusCounts = templates.reduce((acc, t) => {
        const s = t.WabaStatus?.toUpperCase() || 'UNKNOWN';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    // Placeholder action handlers
    const handlers = {
        onView: (t) => {
            setPreviewTemplate(t);
            setOpenPreview(true);
        },
        onSend: (t) => {
            setSelectedTemplateForSend(t);
            setOpenSendDialog(true);
        },
        onClone: (t) => navigate('/templates/create', { state: { template: t, isClone: true } }),
        onEdit: (t) => navigate('/templates/create', { state: { template: t } }),
        onDelete: (t) => setDeleteTemplateData(t),
    };

    const renderPreviewContent = () => {
        if (!previewTemplate) return null;
        let components = [];
        try { components = JSON.parse(previewTemplate.Components || '[]'); } catch { components = []; }

        const body = components.find(c => c.type === 'BODY');
        const footer = components.find(c => c.type === 'FOOTER');
        const buttons = components.find(c => c.type === 'BUTTONS');

        const headerType = getHeaderType(components);

        return (
            <div className={styles.whatsappCard}>
                {/* Header */}
                {headerType === 'image' && (
                    <div className={styles.waHeaderImage}>
                        <Image size={40} color="#94a3b8" />
                        <span>Image Preview</span>
                    </div>
                )}
                {headerType === 'video' && (
                    <div className={styles.waHeaderVideo}>
                        <Video size={40} color="#94a3b8" />
                        <span>Video Preview</span>
                    </div>
                )}

                {/* Body */}
                {body?.text && (
                    <div className={styles.waBody}>
                        <p>{body.text}</p>
                    </div>
                )}

                {/* Footer */}
                {footer?.text && (
                    <div className={styles.waFooter}>
                        {footer.text}
                    </div>
                )}

                {/* Buttons */}
                {buttons?.buttons?.length > 0 && (
                    <div className={styles.waButtons}>
                        {buttons.buttons.map((btn, i) => (
                            <button key={i} className={styles.waBtn}>{btn.text}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.page}>
            {/* Top bar */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <button className={styles.backBtn} onClick={() => navigate('/')}>
                        <ArrowLeft size={16} />
                    </button>
                    <div className={styles.headerIconWrap}>
                        <FileText size={18} />
                    </div>
                    <div>
                        <h2 className={styles.pageTitle}>Templates</h2>
                        <p className={styles.pageSubtitle}>{templates.length} template{templates.length !== 1 ? 's' : ''} total</p>
                    </div>
                </div>
                <div className={styles.topActions}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(event, newView) => { if (newView !== null) setViewMode(newView); }}
                        className='toggle-button-group'
                        size="medium"
                    >
                        <Tooltip title="Grid View" arrow>
                            <ToggleButton value="grid"><LayoutGrid size={16} /></ToggleButton>
                        </Tooltip>
                        <Tooltip title="List View" arrow>
                            <ToggleButton value="list"><List size={16} /></ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>
                    <Button variant="outlined" className='varientOutlinedBtn' startIcon={<RefreshCw size={15} className={loading ? styles.spinning : ''} />} onClick={loadTemplates} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="outlined" className='secondaryBtnClassname' startIcon={<RefreshCw size={15} className={loading ? styles.spinning : ''} />} onClick={handleSync} disabled={loading}>
                        Sync
                    </Button>
                    <Button variant="contained" className='buttonClassname' startIcon={<Plus size={16} />} onClick={() => navigate('/templates/create')}>
                        Create Template
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search templates..."
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterChips={['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].map((s) => ({
                    value: s,
                    label: s === 'ALL' ? `All (${templates.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${statusCounts[s] || 0})`,
                }))}
                activeFilter={filterStatus}
                onFilterChange={setFilterStatus}
            />

            {/* Content */}
            <div className={styles.contentArea}>
                {loading ? (
                    <TemplateSkelton count={8} />
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileText size={40} className={styles.emptyIcon} />
                        <p>No templates found</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <TemplateGrid
                        items={paginatedItems}
                        {...handlers}
                        count={filtered.length}
                        page={currentPage - 1}
                        rowsPerPage={itemsPerPage}
                        onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
                        onRowsPerPageChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    />
                ) : (
                    <TemplateTable
                        items={paginatedItems}
                        {...handlers}
                        count={filtered.length}
                        page={currentPage - 1}
                        rowsPerPage={itemsPerPage}
                        onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
                        onRowsPerPageChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    />
                )}
            </div>



            {/* Preview Drawer */}
            <Drawer
                anchor="right"
                open={openPreview}
                onClose={() => setOpenPreview(false)}
                PaperProps={{ sx: { width: 420, background: '#f8fafc' } }}
            >
                <div className={styles.drawerRoot} style={previewBg}>
                    <div className={styles.drawerHeader}>
                        <h3 className={styles.drawerTitle}>{previewTemplate?.TemplateName}</h3>
                        <button className={styles.drawerClose} onClick={() => setOpenPreview(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.drawerContent}>
                        {renderPreviewContent()}
                    </div>
                </div>
            </Drawer>

            {/* Send Template Dialog */}
            <Dialog
                open={openSendDialog}
                onClose={() => setOpenSendDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        padding: '8px',
                        width: '100%',
                        maxWidth: '400px'
                    }
                }}
            >
                <DialogTitle style={{ fontWeight: 700, color: '#0f172a', paddingBottom: '8px' }}>Send Template</DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', marginTop: 0 }}>
                        Enter the recipient's mobile number to send the template <strong>{selectedTemplateForSend?.TemplateName}</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            size="small"
                            style={{ width: '110px', borderRadius: '8px' }}
                        >
                            <MenuItem value="+91">+91 (IN)</MenuItem>
                            <MenuItem value="+1">+1 (US)</MenuItem>
                            <MenuItem value="+44">+44 (UK)</MenuItem>
                            <MenuItem value="+971">+971 (UAE)</MenuItem>
                        </Select>
                        <TextField
                            label="Mobile Number"
                            value={mobileNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const rule = COUNTRY_RULES[countryCode];
                                if (rule && val.length <= rule.length) {
                                    setMobileNumber(val);
                                } else if (!rule) {
                                    setMobileNumber(val);
                                }
                            }}
                            size="small"
                            fullWidth
                            placeholder={COUNTRY_RULES[countryCode]?.example ? `E.g. ${COUNTRY_RULES[countryCode].example}` : "Enter mobile number"}
                            InputProps={{ style: { borderRadius: '8px' } }}
                            error={mobileNumber.length > 0 && !COUNTRY_RULES[countryCode]?.pattern.test(mobileNumber)}
                            helperText={mobileNumber.length > 0 && !COUNTRY_RULES[countryCode]?.pattern.test(mobileNumber) ? `Invalid number for ${countryCode}` : ''}
                        />
                    </div>
                </DialogContent>
                <DialogActions style={{ padding: '12px 24px 16px' }}>
                    <Button onClick={() => setOpenSendDialog(false)} color="inherit" className='secondaryBtnClassname'>Close</Button>
                    <Button
                        onClick={() => {
                            console.log('Sending template', selectedTemplateForSend, 'to', countryCode + mobileNumber);
                            setOpenSendDialog(false);
                            // API binding will be done afterwards as requested
                        }}
                        variant="contained"
                        color="primary"
                        disabled={!COUNTRY_RULES[countryCode]?.pattern.test(mobileNumber)}
                        className='buttonClassname'
                    >
                        Send
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationModal
                isOpen={!!deleteTemplateData}
                onClose={() => setDeleteTemplateData(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Template"
                description={`Are you sure you want to delete the template "${deleteTemplateData?.TemplateName}"? This action cannot be undone.`}
                isDanger={true}
            />
        </div>
    );
};

export default Templates;
