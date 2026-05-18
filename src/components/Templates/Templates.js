import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, RefreshCw, FileText, CheckCircle, XCircle, Clock,
    AlertCircle, LayoutGrid, List, Eye, Send, Copy, Edit2,
    Trash2, Image, Video, FileType, FileQuestion, BookOpen,
    X, ArrowLeft
} from 'lucide-react';
import { Tooltip, Drawer, Dialog, DialogTitle, DialogContent, DialogActions, Button, ToggleButtonGroup, ToggleButton, Grid, CardContent, Stack, Skeleton, Card, Paper, Menu, ListItemText, ListItemIcon, Popover } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { fetchCrmTemplates } from '../../API/TemplateList/FetchCrmTemplates';
import { syncTemplates } from '../../API/TemplateList/SyncTemplates';
import { deleteTemplate } from '../../API/TemplateList/DeleteTemplate';
import { sendTemplate } from '../../API/TemplateList/SendTemplate';
import { publishTemplate } from '../../API/TemplateList/PublishTemplate';
import { useAuthToken } from '../../hooks/useAuthToken';
import TemplateGrid from './TemplateGrid';
import TemplateTable from './TemplateTable';
import TemplateVariableInput from '../Common/TemplateVariableInput/TemplateVariableInput';
import DynamicVariableMenu from '../Common/DynamicVariableMenu/DynamicVariableMenu';
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
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);

    const [openSendDialog, setOpenSendDialog] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneData, setPhoneData] = useState({});
    const [phoneError, setPhoneError] = useState('');
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [deleteTemplateData, setDeleteTemplateData] = useState(null);
    const [templateVariables, setTemplateVariables] = useState({});
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedVariableIndex, setSelectedVariableIndex] = useState(null);
    const [publishTemplateData, setPublishTemplateData] = useState(null);

    // Initialize template variables with sample values when a template is selected for sending
    useEffect(() => {
        if (!selectedTemplateForSend) {
            setTemplateVariables({});
            return;
        }
        try {
            const components = JSON.parse(selectedTemplateForSend.Components || '[]');
            const bodyComponent = components.find(c => c.type === 'BODY');
            const bodyExample = bodyComponent?.example?.body_text?.[0] || [];

            const vars = extractTemplateVariables(selectedTemplateForSend);
            const initialVars = {};
            vars.forEach((varNum, idx) => {
                initialVars[varNum] = bodyExample[idx] || '';
            });
            setTemplateVariables(initialVars);
        } catch (error) {
            console.error('Error initializing template variables:', error);
            setTemplateVariables({});
        }
    }, [selectedTemplateForSend]);

    const handleVariableMenuOpen = (event, index) => {
        setMenuAnchor(event.currentTarget);
        setSelectedVariableIndex(index);
    };

    const handleVariableMenuClose = () => {
        setMenuAnchor(null);
        setSelectedVariableIndex(null);
    };

    const handleVariableSelect = (variableValue) => {
        if (selectedVariableIndex !== null) {
            setTemplateVariables(prev => ({
                ...prev,
                [selectedVariableIndex]: variableValue
            }));
        }
        handleVariableMenuClose();
    };

    // Memoized phone input styles
    const phoneInputStyles = useMemo(() => ({
        input: {
            width: '100%',
            height: '40px',
            fontSize: '0.875rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            color: '#0f172a'
        },
        button: {
            border: '1px solid #e2e8f0',
            borderRadius: '8px 0 0 8px',
            backgroundColor: '#f8fafc'
        },
        dropdown: {
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            zIndex: 1
        },
        search: {
            margin: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem'
        },
        container: {
            marginBottom: '0.5rem'
        }
    }), []);

    // Memoized phone change handler
    const handlePhoneChange = useCallback((value, data) => {
        setPhoneNumber(value);
        setPhoneData(data);

        // Validation logic
        const dialCode = `+${data.dialCode}`;
        const rule = COUNTRY_RULES[dialCode];

        if (rule) {
            const pureNumber = value.slice(data.dialCode.length);
            if (pureNumber.length === 0) {
                setPhoneError('');
            } else if (pureNumber.length !== rule.length) {
                setPhoneError(`Number must be exactly ${rule.length} digits for ${data.name}`);
            } else if (!rule.pattern.test(pureNumber)) {
                setPhoneError(`Invalid format for ${data.name}. Example: ${rule.example}`);
            } else {
                setPhoneError('');
            }
        } else {
            // Fallback for countries without specific rules
            if (value.length < 7) {
                setPhoneError('Phone number is too short');
            } else {
                setPhoneError('');
            }
        }
    }, []);

    // Extract variables from template components
    const extractTemplateVariables = (template) => {
        if (!template) return [];
        let components = [];
        try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }

        const variables = [];
        components.forEach(comp => {
            if (comp.text && typeof comp.text === 'string') {
                const matches = comp.text.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                    const uniqueVars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
                    uniqueVars.forEach(varNum => {
                        if (!variables.includes(varNum)) {
                            variables.push(varNum);
                        }
                    });
                }
            }
            if (comp.example && typeof comp.example === 'string') {
                const matches = comp.example.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                    const uniqueVars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
                    uniqueVars.forEach(varNum => {
                        if (!variables.includes(varNum)) {
                            variables.push(varNum);
                        }
                    });
                }
            }
        });

        return variables.sort((a, b) => parseInt(a) - parseInt(b));
    };

    const handleEmojiPickerOpen = (event, index) => {
        setEmojiAnchorEl(event.currentTarget);
        setEmojiPickerOpen(index);
    };

    const handleEmojiPickerClose = () => {
        setEmojiPickerOpen(null);
        setEmojiAnchorEl(null);
    };

    const handleEmojiSelect = (emoji) => {
        if (emojiPickerOpen !== null) {
            const currentValue = templateVariables[emojiPickerOpen] || '';
            setTemplateVariables(prev => ({
                ...prev,
                [emojiPickerOpen]: currentValue + emoji.native
            }));
        }
        handleEmojiPickerClose();
    };

    // Extract header type from template components
    const getHeaderType = (template) => {
        if (!template) return null;
        let components = [];
        try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }

        const header = components.find(c => c.type === 'HEADER');
        return header ? header.format : null;
    };

    // Extract image URL from template components
    const getTemplateImageUrl = (template) => {
        if (!template) return null;
        let components = [];
        try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }

        const header = components.find(c => c.type === 'HEADER');
        if (header && header.example && header.example.header_handle && header.example.header_handle.length > 0) {
            return header.example.header_handle[0];
        }
        return null;
    };

    // Reset variables when template changes
    useEffect(() => {
        if (selectedTemplateForSend) {
            const vars = extractTemplateVariables(selectedTemplateForSend);
            const initialVars = {};
            vars.forEach(v => initialVars[v] = '');
            setTemplateVariables(initialVars);
        }
    }, [selectedTemplateForSend]);

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

    const handleConfirmPublish = async () => {
        if (!publishTemplateData) return;

        toast.promise(
            publishTemplate({
                TemplateId: publishTemplateData.Id,
                CreatedBy: userToken?.id || 4,
                UserId: userToken?.username || 'admin@orail.co.in'
            }).then((result) => {
                if (result.success) {
                    loadTemplates();
                    return 'Template published successfully';
                } else {
                    throw new Error(result.error?.message || 'Failed to publish template');
                }
            }),
            {
                loading: 'Publishing template...',
                success: (msg) => msg,
                error: (err) => err.message,
            }
        ).finally(() => {
            setPublishTemplateData(null);
        });
    };

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    const filtered = templates.filter((t) => {
        if (search.trim()) {
            const q = search.toLowerCase();
            const searchableFields = [
                t.TemplateName,
                t.WabaStatus,
                t.Category,
                t.Type,
                t.EntryDate,
                t.WabaTemplateId
            ].filter(Boolean).map(f => String(f).toLowerCase());

            const matchSearch = searchableFields.some(field => field.includes(q));
            if (!matchSearch) return false;
        }

        const matchStatus = filterStatus === 'ALL' || t.WabaStatus?.toUpperCase() === filterStatus;
        return matchStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.EntryDate) - new Date(a.EntryDate);
        if (sortBy === 'oldest') return new Date(a.EntryDate) - new Date(b.EntryDate);
        if (sortBy === 'name') return (a.TemplateName || '').localeCompare(b.TemplateName || '');
        return 0;
    });

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
        onPublish: (t) => setPublishTemplateData(t),
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
                onClose={() => {
                    setOpenSendDialog(false);
                    setPhoneNumber('');
                    setPhoneError('');
                    setTemplateVariables({});
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        padding: '8px',
                        width: '100%',
                        maxWidth: '500px'
                    }
                }}
            >
                <DialogTitle style={{ fontWeight: 700, color: '#0f172a', paddingBottom: '8px' }}>Send Template</DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', marginBottom: '1.5rem', marginTop: 0 }}>
                        Enter the recipient's mobile number to send the template <strong>{selectedTemplateForSend?.TemplateName}</strong>.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>
                            Mobile Number
                        </label>
                        <PhoneInput
                            country={'in'}
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            enableSearch={true}
                            countryCodeEditable={true}
                            inputStyle={{
                                ...phoneInputStyles.input,
                                borderColor: phoneError ? '#ef4444' : '#e2e8f0',
                                boxShadow: phoneError ? '0 0 0 1px #ef4444' : 'none'
                            }}
                            buttonStyle={phoneInputStyles.button}
                            dropdownStyle={phoneInputStyles.dropdown}
                            searchStyle={phoneInputStyles.search}
                            containerStyle={phoneInputStyles.container}
                        />
                        {phoneError && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                {phoneError}
                            </span>
                        )}
                    </div>

                    {/* Template Variables */}
                    {extractTemplateVariables(selectedTemplateForSend).length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.75rem', display: 'block' }}>
                                Template Variables
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {extractTemplateVariables(selectedTemplateForSend).map(varNum => (
                                    <TemplateVariableInput
                                        key={varNum}
                                        label={`Variable {{${varNum}}}`}
                                        value={templateVariables[varNum] || ''}
                                        onChange={(val) => setTemplateVariables(prev => ({ ...prev, [varNum]: val }))}
                                        onEmojiClick={(e) => handleEmojiPickerOpen(e, varNum)}
                                        onVariableClick={(e) => handleVariableMenuOpen(e, varNum)}
                                        showDynamic={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>

                {/* Dynamic Variables Menu */}
                <DynamicVariableMenu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={handleVariableMenuClose}
                    onSelect={handleVariableSelect}
                />

                <DialogActions style={{ padding: '12px 24px 16px' }}>
                    <Button
                        onClick={() => {
                            setOpenSendDialog(false);
                            setPhoneNumber('');
                            setPhoneError('');
                            setTemplateVariables({});
                        }}
                        color="inherit"
                        className='secondaryBtnClassname'
                    >
                        Close
                    </Button>
                    <Button
                        onClick={async () => {
                            if (!selectedTemplateForSend || !phoneNumber) return;

                            // Parse phone number - PhoneInput returns full number with country code
                            // Extract just the number without country code for the API
                            const phoneNo = phoneNumber.replace(/\D/g, '');

                            // Build components with parameters
                            let components = [];
                            try { components = JSON.parse(selectedTemplateForSend.Components || '[]'); } catch { components = []; }

                            // Build components array for API
                            const templateComponents = [];
                            const headerType = getHeaderType(selectedTemplateForSend);
                            const templateImageUrl = getTemplateImageUrl(selectedTemplateForSend);

                            // Add header component if it's an image template with existing image URL
                            if (headerType === 'IMAGE' && templateImageUrl) {
                                templateComponents.push({
                                    type: 'header',
                                    parameters: [
                                        {
                                            type: 'image',
                                            image: {
                                                link: templateImageUrl
                                            }
                                        }
                                    ]
                                });
                            }

                            // Build parameters from templateVariables
                            const bodyComponent = components.find(c => c.type === 'BODY');
                            const parameters = [];

                            // Get all variable numbers and sort them
                            const varNumbers = Object.keys(templateVariables).sort((a, b) => parseInt(a) - parseInt(b));
                            varNumbers.forEach(varNum => {
                                parameters.push({
                                    type: 'text',
                                    text: templateVariables[varNum] || ''
                                });
                            });

                            // Add body component if there are parameters
                            if (parameters.length > 0) {
                                templateComponents.push({
                                    type: 'body',
                                    parameters: parameters
                                });
                            }

                            // Build the API payload
                            const payload = {
                                phoneNo: phoneNo,
                                appuserid: userToken?.userId || '',
                                customerId: '',
                                type: 'template',
                                template: {
                                    name: selectedTemplateForSend.TemplateName,
                                    language: {
                                        code: selectedTemplateForSend?.Language || 'en'
                                    }
                                }
                            };

                            // Only add components if there are any
                            if (templateComponents.length > 0) {
                                payload.template.components = templateComponents;
                            }

                            // Call the API
                            toast.promise(
                                sendTemplate(payload).then((result) => {
                                    if (result.success) {
                                        setOpenSendDialog(false);
                                        setPhoneNumber('');
                                        setPhoneError('');
                                        setTemplateVariables({});
                                        return 'Template sent successfully';
                                    } else {
                                        throw new Error(result.error || 'Failed to send template');
                                    }
                                }),
                                {
                                    loading: 'Sending template...',
                                    success: 'Template sent successfully',
                                    error: (err) => err.message || 'Failed to send template'
                                }
                            );
                        }}
                        variant="contained"
                        color="primary"
                        disabled={!phoneNumber || !!phoneError || phoneNumber.length < 7}
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

            <ConfirmationModal
                isOpen={!!publishTemplateData}
                onClose={() => setPublishTemplateData(null)}
                onConfirm={handleConfirmPublish}
                title="Publish Template"
                description={`Are you sure you want to publish the template "${publishTemplateData?.TemplateName}"? This will submit it to WhatsApp for approval.`}
                isDanger={false}
            />

            {/* Emoji Picker Popover */}
            <Popover
                open={Boolean(emojiAnchorEl)}
                anchorEl={emojiAnchorEl}
                onClose={handleEmojiPickerClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        overflow: 'hidden'
                    }
                }}
            >
                <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                />
            </Popover>
        </div>
    );
};

export default Templates;
