import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus, RefreshCw, FileText, CheckCircle, XCircle, Clock,
    AlertCircle, LayoutGrid, List, Eye, Send, Copy, Edit2,
    Trash2, Image, Video, FileType, FileQuestion, BookOpen,
    X, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { Tooltip, Drawer, Button, ToggleButtonGroup, ToggleButton, Grid, CardContent, Stack, Skeleton, Card, Paper, Menu, ListItemText, ListItemIcon, Popover } from '@mui/material';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { fetchCrmTemplates } from '../../API/TemplateList/FetchCrmTemplates';
import { syncTemplates } from '../../API/TemplateList/SyncTemplates';
import { deleteTemplate } from '../../API/TemplateList/DeleteTemplate';
import { removeFileApi } from '../../API/InitialApi/filesRemoveApi';
import { publishTemplate } from '../../API/TemplateList/PublishTemplate';
import { useAuthToken } from '../../hooks/useAuthToken';
import { useWallet } from '../../contexts/WalletContext';
import TemplateGrid from './TemplateGrid';
import TemplateTable from './TemplateTable';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import FilterBar from '../Common/FilterBar/FilterBar';
import SendTemplateDialog from '../Common/SendTemplateDialog/SendTemplateDialog';
import toast from 'react-hot-toast';
import styles from './Templates.module.scss';
import TemplateSkelton from './TemplateSkelton';
import socket from '../../utils/socket';
import MessagePreview from '../MessagePreview/MessagePreview';
import { extractTemplatePreviewData } from '../../utils/templatePreviewUtils';
import { checkImageUrlValid, checkVideoUrlValid } from '../../utils/globalFunc';
import imagePlaceholder from '../../assets/imagePlaceholder.png';

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
    const isPending = status?.toUpperCase() === 'PENDING';

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

            {!isPending && (
                <Tooltip title="Clone" arrow>
                    <button className={styles.iconBtn} onClick={() => onClone?.(template)}>
                        <Copy size={15} />
                    </button>
                </Tooltip>
            )}

            {!isPending && (
                <Tooltip title="Edit" arrow>
                    <button className={styles.iconBtn} onClick={() => onEdit?.(template)}>
                        <Edit2 size={15} />
                    </button>
                </Tooltip>
            )}

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
    const [searchParams] = useSearchParams();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [validatedPreviewData, setValidatedPreviewData] = useState(null);

    // Validate image URLs in preview data and set fallback for invalid ones
    useEffect(() => {
        const validatePreviewImages = async () => {
            if (!previewTemplate) {
                setValidatedPreviewData(null);
                return;
            }

            const previewData = extractTemplatePreviewData(previewTemplate);
            if (!previewData) {
                setValidatedPreviewData(null);
                return;
            }

            const validated = { ...previewData };

            // Validate header media URL (images and videos)
            if (validated.headerMedia?.mediaUrl) {
                if (validated.headerMedia?.mediaType === 'image') {
                    const isValid = await checkImageUrlValid(validated.headerMedia.mediaUrl);
                    if (!isValid) {
                        validated.headerMedia = { ...validated.headerMedia, mediaUrl: imagePlaceholder };
                    }
                } else if (validated.headerMedia?.mediaType === 'video') {
                    const isValid = await checkVideoUrlValid(validated.headerMedia.mediaUrl);
                    if (!isValid) {
                        validated.headerMedia = { ...validated.headerMedia, mediaUrl: '', isInvalid: true };
                    }
                }
            }

            // Validate carousel card media URLs (images and videos)
            if (validated.carouselCards && Array.isArray(validated.carouselCards)) {
                validated.carouselCards = await Promise.all(
                    validated.carouselCards.map(async (card) => {
                        if (card.header?.mediaUrl) {
                            if (card.header?.mediaType === 'image') {
                                const isValid = await checkImageUrlValid(card.header.mediaUrl);
                                if (!isValid) {
                                    return {
                                        ...card,
                                        header: { ...card.header, mediaUrl: imagePlaceholder }
                                    };
                                }
                            } else if (card.header?.mediaType === 'video') {
                                const isValid = await checkVideoUrlValid(card.header.mediaUrl);
                                if (!isValid) {
                                    return {
                                        ...card,
                                        header: { ...card.header, mediaUrl: '', isInvalid: true }
                                    };
                                }
                            }
                        }
                        return card;
                    })
                );
            }

            setValidatedPreviewData(validated);
        };

        validatePreviewImages();
    }, [previewTemplate]);

    const [openSendDialog, setOpenSendDialog] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Apply search filter from URL parameter
    useEffect(() => {
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearch(decodeURIComponent(searchParam));
        }
    }, [searchParams]);
    const [phoneData, setPhoneData] = useState({});
    const [phoneError, setPhoneError] = useState('');
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [deleteTemplateData, setDeleteTemplateData] = useState(null);
    const [templateVariables, setTemplateVariables] = useState({});
    const [variableErrors, setVariableErrors] = useState({});
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedVariableIndex, setSelectedVariableIndex] = useState(null);
    const [publishTemplateData, setPublishTemplateData] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] = useState(false);
    
    const { hasSufficientBalance, walletInfo } = useWallet();

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

    const loadTemplates = async (showLoader = true) => {
        if (!userToken?.username) return;
        if (showLoader) setLoading(true);
        try {
            const result = await fetchCrmTemplates(userToken.username);
            setTemplates(result.data || []);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => { loadTemplates(); /* eslint-disable-next-line */ }, [userToken?.username]);

    useEffect(() => {
        const onTemplateUpdate = (eventData) => {
            const updateData = Array.isArray(eventData) ? eventData[1] : eventData;
            if (!updateData || typeof updateData !== 'object' || !updateData.Id) return;

            setTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    Number(template?.Id) === Number(updateData.Id)
                        ? {
                            ...template,
                            TemplateType: updateData.TemplateType ?? template.TemplateType,
                            WabaStatus: updateData.WabaStatus ?? template.WabaStatus,
                            TemplateJson: updateData.TemplateJson ?? template.TemplateJson,
                        }
                        : template
                )
            );

            setPreviewTemplate((prevTemplate) => {
                if (!prevTemplate || Number(prevTemplate?.Id) !== Number(updateData.Id)) return prevTemplate;
                return {
                    ...prevTemplate,
                    TemplateType: updateData.TemplateType ?? prevTemplate.TemplateType,
                    WabaStatus: updateData.WabaStatus ?? prevTemplate.WabaStatus,
                    TemplateJson: updateData.TemplateJson ?? prevTemplate.TemplateJson,
                };
            });

            setSelectedTemplateForSend((prevTemplate) => {
                if (!prevTemplate || Number(prevTemplate?.Id) !== Number(updateData.Id)) return prevTemplate;
                return {
                    ...prevTemplate,
                    TemplateType: updateData.TemplateType ?? prevTemplate.TemplateType,
                    WabaStatus: updateData.WabaStatus ?? prevTemplate.WabaStatus,
                    TemplateJson: updateData.TemplateJson ?? prevTemplate.TemplateJson,
                };
            });
        };

        socket.on('templateUpdate', onTemplateUpdate);

        return () => {
            socket.off('templateUpdate', onTemplateUpdate);
        };
    }, []);

    const handleSync = async () => {
        if (!userToken?.username) return;
        setSyncLoading(true);
        const payload = {
            CreatedBy: userToken?.id || 4,
            UserId: userToken?.userId || ''
        };

        toast.promise(
            syncTemplates(payload).then(async (result) => {
                if (result.success) {
                    await loadTemplates(false);
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
            setSyncLoading(false);
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTemplateData) return;

        toast.promise(
            deleteTemplate({ TemplateId: deleteTemplateData.Id }).then(async (result) => {
                if (result.success) {
                    const mediaUrls = (() => {
                        try {
                            if (Array.isArray(deleteTemplateData.MediaData)) {
                                return deleteTemplateData.MediaData.filter(Boolean);
                            }
                            if (typeof deleteTemplateData.MediaData === 'string' && deleteTemplateData.MediaData.trim()) {
                                const parsed = JSON.parse(deleteTemplateData.MediaData);
                                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
                            }
                        } catch (error) {
                            console.error('Error parsing template media data for delete:', error);
                        }
                        return [];
                    })();

                    if (mediaUrls.length > 0) {
                        try {
                            await removeFileApi({ attachments: mediaUrls });
                        } catch (error) {
                            console.error('Error removing template files:', error);
                        }
                    }

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

        setIsPublishing(true);
        try {
            const result = await publishTemplate({
                TemplateId: publishTemplateData.Id,
                CreatedBy: userToken?.id || 4,
                UserId: userToken?.userId || ''
            });

            if (result.success) {
                toast.success('Template published successfully');
                loadTemplates();
            } else {
                toast.error(result.error?.message || 'Failed to publish template');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to publish template');
        } finally {
            setIsPublishing(false);
            setPublishTemplateData(null);
        }
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

        const matchStatus = filterStatus === 'ALL'
            || (filterStatus === 'OTHERS' ? !t.WabaStatus : t.WabaStatus?.toUpperCase() === filterStatus);
        return matchStatus;
    });

    const getSortTime = (item) => {
        const updatedAtMs = new Date(item?.UpdatedAt).getTime();
        if (Number.isFinite(updatedAtMs)) return updatedAtMs;

        const entryDateMs = new Date(item?.EntryDate).getTime();
        if (Number.isFinite(entryDateMs)) return entryDateMs;

        return 0;
    };

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return getSortTime(b) - getSortTime(a);
        if (sortBy === 'oldest') return getSortTime(a) - getSortTime(b);
        if (sortBy === 'name') return (a.TemplateName || '').localeCompare(b.TemplateName || '');
        return 0;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = sorted.slice(startIndex, startIndex + itemsPerPage);

    const statusCounts = templates.reduce((acc, t) => {
        const s = t.WabaStatus?.toUpperCase() || 'OTHERS';
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
            // Check balance first
            if (!hasSufficientBalance) {
                setShowInsufficientBalanceDialog(true);
                return;
            }
            
            setSelectedTemplateForSend(t);
            setOpenSendDialog(true);
        },
        onClone: (t) => navigate('/templates/create', { state: { template: t, isClone: true } }),
        onEdit: (t) => navigate('/templates/create', { state: { template: t } }),
        onDelete: (t) => setDeleteTemplateData(t),
        onPublish: (t) => setPublishTemplateData(t),
    };

    const renderPreviewContent = () => {
        if (!validatedPreviewData) return null;

        return (
            <MessagePreview
                headerType={validatedPreviewData.headerType}
                headerText={validatedPreviewData.headerText}
                headerTextExample={validatedPreviewData.headerTextExample}
                headerMedia={validatedPreviewData.headerMedia}
                body={validatedPreviewData.body}
                footer={validatedPreviewData.footer}
                buttons={validatedPreviewData.buttons}
                templateType={validatedPreviewData.templateType}
                carouselCards={validatedPreviewData.carouselCards}
                variableValues={validatedPreviewData.variableValues}
                showEmptyHint={false}
            />
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
                    <Button variant="outlined" className='varientOutlinedBtn' startIcon={<RefreshCw size={15} className={loading ? styles.spinning : ''} />} onClick={() => loadTemplates(true)} disabled={loading || syncLoading}>
                        Refresh
                    </Button>
                    <Button variant="outlined" className='secondaryBtnClassname' startIcon={<RefreshCw size={15} className={syncLoading ? styles.spinning : ''} />} onClick={handleSync} disabled={loading || syncLoading}>
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
                filterChips={['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT', 'OTHERS'].map((s) => ({
                    value: s,
                    label: s === 'ALL'
                        ? `All (${templates.length})`
                        : s === 'OTHERS'
                            ? `Others (${statusCounts[s] || 0})`
                            : `${s.charAt(0) + s.slice(1).toLowerCase()} (${statusCounts[s] || 0})`,
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
                <div className={styles.drawerRoot}>
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
            <SendTemplateDialog
                open={openSendDialog}
                onClose={() => setOpenSendDialog(false)}
                template={selectedTemplateForSend}
                userToken={userToken}
            />

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
                isLoading={isPublishing}
            />

            {/* Insufficient Balance Dialog */}
            <ConfirmationModal
                isOpen={showInsufficientBalanceDialog}
                onClose={() => setShowInsufficientBalanceDialog(false)}
                onConfirm={() => setShowInsufficientBalanceDialog(false)}
                title="Insufficient Balance"
                description={`Your available balance is ₹${walletInfo?.availableBalance?.toLocaleString('en-IN') || 0}. You need at least ₹1 to send templates. Please recharge your wallet to continue.`}
                icon={AlertTriangle}
                isDanger={false}
                confirmLabel="OK"
                hideCancel={true}
                maxWidth="400px"
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
