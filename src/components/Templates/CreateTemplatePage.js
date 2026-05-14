import React, { useMemo, useState, useEffect } from 'react';
import {
    X, ChevronLeft, Plus, ArrowLeft, Users, Phone,
    MoreVertical, Smile, Paperclip, Camera, Mic, CheckCheck, FileText,
    Image, Video, MapPin, Upload,
    ChevronRight, Megaphone, Bell, Key,
    MessageSquare, Layout, Clock, BookOpen, Package, Save, CheckCircle, Slash, Type, Code
} from 'lucide-react';
import { Box, Modal, Typography, Button, IconButton, TextField, CircularProgress, LinearProgress, Grid, Paper, Tooltip } from '@mui/material';
import { createTemplate } from '../../API/TemplateList/CreateTemplate';
import { editTemplate } from '../../API/TemplateList/EditTemplate';
import { uploadMetaMedia } from '../../API/InitialApi/UploadMetaMedia';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CreateTemplatePage.module.scss';
import { previewBg } from '../../utils/globalFunc';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import MessagePreview from '../MessagePreview/MessagePreview';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

// step 1 = Template Details, step 2 = Builder
const MEDIA_CONFIG = {
    image: {
        label: 'Image',
        mimes: ['image/jpeg', 'image/png'],
        extensions: '.jpg, .jpeg, .png',
        maxSize: 5 * 1024 * 1024,
        maxSizeLabel: '5MB'
    },
    video: {
        label: 'Video',
        mimes: ['video/mp4'],
        extensions: '.mp4',
        maxSize: 16 * 1024 * 1024,
        maxSizeLabel: '16MB',
        extraNote: 'GIFs (MP4) max 3.5MB'
    },
    document: {
        label: 'Document',
        mimes: ['application/pdf'],
        extensions: '.pdf',
        maxSize: 100 * 1024 * 1024,
        maxSizeLabel: '100MB'
    }
};

const CreateTemplatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);

    const [templateDetails, setTemplateDetails] = useState({
        templateName: '',
        templateLanguage: 'en_US',
        templateCategory: '',
    });

    const [builderData, setBuilderData] = useState({
        templateType: 'Interactive',
        headerType: 'None',
        headerText: '',
        headerTextExample: '',
        body: '',
        footer: '',
        buttons: [],
    });

    const [headerMedia, setHeaderMedia] = useState({
        mediaType: 'image', file: null, mediaUrl: '',
        locationName: '', latitude: '', longitude: '',
        existingHandle: null, // existing header_handle from edit data (reused if no new file picked)
    });

    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [variableValues, setVariableValues] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, mode: null });
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const editTemplateData = location.state?.template;
    const isClone = location.state?.isClone || false;
    const isEditMode = !!editTemplateData && !isClone;

    useEffect(() => {
        if (editTemplateData) {
            setTemplateDetails({
                templateName: isClone ? `${editTemplateData.TemplateName}_clone` : (editTemplateData.TemplateName || ''),
                templateLanguage: editTemplateData.Language || 'en_US',
                templateCategory: editTemplateData.TemplateType || '',
            });

            let components = [];
            try {
                components = typeof editTemplateData.Components === 'string'
                    ? JSON.parse(editTemplateData.Components)
                    : editTemplateData.Components || [];
            } catch (e) {
                console.error("Failed to parse components", e);
            }

            const header = components.find(c => c.type === 'HEADER');
            const body = components.find(c => c.type === 'BODY');
            const footer = components.find(c => c.type === 'FOOTER');
            const buttons = components.find(c => c.type === 'BUTTONS');

            setBuilderData({
                templateType: 'Interactive',
                headerType: header ? (header.format === 'TEXT' ? 'Text' : 'Media') : 'None',
                headerText: header?.text || '',
                headerTextExample: header?.example?.header_text?.[0] || '',
                body: body?.text || '',
                footer: footer?.text || '',
                buttons: buttons?.buttons?.map(b => ({ label: b.text || '' })) || [],
            });

            // Restore existing media handle + preview URL for edit mode
            if (header && header.format !== 'TEXT' && header.example?.header_handle?.[0]) {
                const existingHandle = header.example.header_handle[0];
                const fmt = header.format?.toLowerCase() || 'image'; // IMAGE → image
                setHeaderMedia((p) => ({
                    ...p,
                    mediaType: fmt,
                    existingHandle,
                    mediaUrl: existingHandle, // drives preview
                    file: null,
                }));
            }
        }
    }, [isEditMode, editTemplateData]);

    // Carousel state
    const [carouselCards, setCarouselCards] = useState([]);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [previewCardIndex, setPreviewCardIndex] = useState(0);

    useEffect(() => {
        if (step === 2) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step]);


    // Image preview URL
    useEffect(() => {
        if (builderData.headerType !== 'Media' || headerMedia.mediaType !== 'image') { setPreviewImageUrl(''); return; }
        if (headerMedia.file) {
            const url = URL.createObjectURL(headerMedia.file);
            setPreviewImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewImageUrl(headerMedia.mediaUrl?.trim() || '');
    }, [builderData.headerType, headerMedia.mediaType, headerMedia.file, headerMedia.mediaUrl]);

    // Video preview URL
    useEffect(() => {
        if (builderData.headerType !== 'Media' || headerMedia.mediaType !== 'video') { setPreviewVideoUrl(''); return; }
        if (headerMedia.file) {
            const url = URL.createObjectURL(headerMedia.file);
            setPreviewVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewVideoUrl(headerMedia.mediaUrl?.trim() || '');
    }, [builderData.headerType, headerMedia.mediaType, headerMedia.file, headerMedia.mediaUrl]);

    const handleClose = () => {
        navigate('/templates');
    };

    const handleDraftClick = () => {
        setConfirmationModal({ isOpen: true, mode: 'draft' });
    };

    const handleCreateClick = () => {
        setConfirmationModal({ isOpen: true, mode: 'create' });
    };

    const handleConfirmDraft = () => {
        setConfirmationModal({ isOpen: false, mode: null });
        handleSave(true);
    };

    const handleConfirmCreate = () => {
        setConfirmationModal({ isOpen: false, mode: null });
        handleSave(false);
    };

    const handleCloseConfirmation = () => {
        setConfirmationModal({ isOpen: false, mode: null });
    };

    const templateTypeOptions = [
        { key: 'Interactive', label: 'Interactive', icon: MessageSquare },
        { key: 'Carousel', label: 'Carousel', icon: Layout },
        { key: 'LTO', label: 'LTO (Limited Time Offer)', icon: Clock },
        { key: 'Catalog', label: 'Catalog', icon: BookOpen },
        { key: 'MPM', label: 'MPM (Multi Product Message)', icon: Package }
    ];
    const headerOptions = [
        { key: 'None', label: 'None', icon: Slash },
        { key: 'Text', label: 'Text', icon: Type },
        { key: 'Media', label: 'Media', icon: Image }
    ];
    const categoryCards = [
        { key: 'Marketing', description: 'Send promotions or information about your products, services or business.', Icon: Megaphone },
        { key: 'Utility', description: 'Send messages about an existing order or account.', Icon: Bell },
        { key: 'Authentication', description: 'Send codes to verify a transaction or login.', Icon: Key },
    ];

    const canProceedToBuilder =
        templateDetails.templateName.trim() &&
        templateDetails.templateLanguage.trim() &&
        templateDetails.templateCategory;

    // Button helpers
    const addActionButton = () =>
        setBuilderData((prev) => ({ ...prev, buttons: [...prev.buttons, { id: Date.now(), label: '' }] }));
    const updateActionButton = (id, label) =>
        setBuilderData((prev) => ({ ...prev, buttons: prev.buttons.map((b) => (b.id === id ? { ...b, label } : b)) }));
    const removeActionButton = (id) =>
        setBuilderData((prev) => ({ ...prev, buttons: prev.buttons.filter((b) => b.id !== id) }));

    // Carousel helpers
    const addCarouselCard = () => {
        if (carouselCards.length >= 10) {
            toast.error('Maximum 10 cards allowed');
            return;
        }
        const firstCardMediaType = carouselCards[0]?.header.mediaType || 'image';
        setCarouselCards((prev) => [
            ...prev,
            { id: Date.now(), header: { mediaType: firstCardMediaType, file: null, handle: '' }, body: '', buttons: [] }
        ]);
        setActiveCardIndex(carouselCards.length);
    };

    const removeCarouselCard = (index) => {
        if (carouselCards.length <= 2) {
            toast.error('Minimum 2 cards required');
            return;
        }
        setCarouselCards((prev) => {
            const filtered = prev.filter((_, i) => i !== index);
            return filtered;
        });
        if (activeCardIndex >= index && activeCardIndex > 0) {
            setActiveCardIndex(activeCardIndex - 1);
        }
    };

    const updateCardData = (index, data) => {
        setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, ...data } : c));
    };

    const bodyCharCount = useMemo(() => builderData.body.length, [builderData.body]);
    const footerCharCount = useMemo(() => builderData.footer.length, [builderData.footer]);

    const variableKeys = useMemo(() => {
        const matches = [...builderData.body.matchAll(/\{\{(\d+)\}\}/g)];
        return [...new Set(matches.map((m) => Number(m[1])))]
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
    }, [builderData.body]);

    const addVariablePlaceholder = () => {
        const currentCount = variableKeys.length + 1;
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + `{{${currentCount}}}`
        }));
    };

    // Emoji picker handlers
    const handleEmojiSelect = (emoji) => {
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + emoji.native
        }));
        setEmojiPickerOpen(false);
    };

    // Formatting handlers - Meta rules
    const handleBold = () => {
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + '**'
        }));
    };

    const handleItalic = () => {
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + '__'
        }));
    };

    const handleStrikethrough = () => {
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + '~~'
        }));
    };

    const handleCode = () => {
        setBuilderData((prev) => ({
            ...prev,
            body: prev.body + '``````'
        }));
    };

    const previewBody = useMemo(() =>
        (builderData.body || '').replace(/\{\{(\d+)\}\}/g, (_, k) =>
            variableValues[k]?.trim() ? variableValues[k] : `{{${k}}}`
        ), [builderData.body, variableValues]);

    const currentPreviewTime = useMemo(
        () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []
    );

    const previewDocumentLabel = useMemo(() => {
        if (builderData.headerType !== 'Media' || headerMedia.mediaType !== 'document') return '';
        if (headerMedia.file?.name) return headerMedia.file.name;
        if (headerMedia.mediaUrl?.trim()) {
            try {
                const u = new URL(headerMedia.mediaUrl.trim());
                return u.pathname.split('/').filter(Boolean).pop() || u.hostname;
            } catch { return headerMedia.mediaUrl.trim(); }
        }
        return '';
    }, [builderData.headerType, headerMedia.mediaType, headerMedia.file, headerMedia.mediaUrl]);

    const hasPreviewMessage =
        Boolean(previewImageUrl) || Boolean(previewVideoUrl) || Boolean(previewDocumentLabel) ||
        Boolean(builderData.headerType === 'Text' && builderData.headerText?.trim()) ||
        Boolean(previewBody.trim()) || Boolean(builderData.footer?.trim()) ||
        builderData.buttons.length > 0 ||
        (builderData.templateType === 'Carousel' && carouselCards.length > 0);

    const handleSave = async (isDraft = false) => {
        const userToken = JSON.parse(sessionStorage.getItem('userToken'));
        setSaveError('');

        // Meta rules
        const rawBody = (builderData.body || '').replace(/\\n/g, '\n').trim();

        if (/\{\{\d+\}\}\s*$/.test(rawBody)) {
            setSaveError('Body cannot end with a variable like {{1}}. Add text after it.');
            return;
        }

        if (!rawBody) {
            setSaveError('Template body is required.');
            return;
        }
        const missingVar = variableKeys.find((k) => !variableValues[k]?.trim());
        if (missingVar !== undefined) {
            setSaveError(`Provide a sample value for variable {{${missingVar}}}.`);
            return;
        }

        const safeName = templateDetails.templateName
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 512);

        const components = [];

        if (builderData.templateType === 'Carousel') {
            // Validation
            if (carouselCards.length < 2) {
                setSaveError('Minimum 2 cards required for a carousel.');
                return;
            }

            const firstType = carouselCards[0].header.mediaType;
            for (let i = 0; i < carouselCards.length; i++) {
                const c = carouselCards[i];
                if (c.header.mediaType !== firstType) {
                    setSaveError(`All cards must have the same media type. Card ${i + 1} is different.`);
                    return;
                }
                if (!c.header.file) {
                    setSaveError(`Card ${i + 1} is missing a media file.`);
                    return;
                }
                if (!c.body.trim()) {
                    setSaveError(`Card ${i + 1} body is required.`);
                    return;
                }
                if (c.buttons.length > 0 && c.buttons.some(b => !b.label.trim())) {
                    setSaveError(`Provide labels for all buttons in Card ${i + 1}.`);
                    return;
                }
            }

            // Button count consistency check
            const firstCardButtonCount = carouselCards[0].buttons.length;
            for (let i = 1; i < carouselCards.length; i++) {
                if (carouselCards[i].buttons.length !== firstCardButtonCount) {
                    setSaveError('All cards in a carousel must have the same number of buttons.');
                    return;
                }
            }

            // sequential uploads
            const cardComponents = [];
            try {
                setIsUploading(true);
                for (let i = 0; i < carouselCards.length; i++) {
                    const c = carouselCards[i];
                    setUploadProgress(0);
                    toast(`Uploading Card ${i + 1} media...`, { icon: '☁️' });
                    const handle = await uploadMetaMedia(c.header.file, setUploadProgress);

                    const cardComps = [
                        {
                            type: 'HEADER',
                            format: c.header.mediaType.toUpperCase(),
                            example: { header_handle: [handle] }
                        }
                    ];
                    if (c.body.trim()) {
                        cardComps.push({ type: 'BODY', text: c.body.trim() });
                    }
                    if (c.buttons.length > 0) {
                        cardComps.push({
                            type: 'BUTTONS',
                            buttons: c.buttons.map(b => ({ type: 'QUICK_REPLY', text: b.label.trim() }))
                        });
                    }
                    cardComponents.push({ components: cardComps });
                }
            } catch (err) {
                setIsUploading(false);
                const msg = err?.response?.data?.message || err.message || 'Media upload failed.';
                setSaveError(msg);
                toast.error(msg);
                return;
            }
            setIsUploading(false);

            // Add top-level body
            if (rawBody) {
                const bComp = { type: 'BODY', text: rawBody };
                if (variableKeys.length > 0) {
                    bComp.example = { body_text: [variableKeys.map((k) => String(variableValues[k].trim()))] };
                }
                components.push(bComp);
            }

            // Add carousel component
            components.push({
                type: 'CAROUSEL',
                cards: cardComponents
            });

        } else {
            // HEADER
            if (builderData.headerType === 'Text') {
                const hComp = { type: 'HEADER', format: 'TEXT', text: builderData.headerText || '' };
                if (/\{\{1\}\}/.test(builderData.headerText)) {
                    if (!builderData.headerTextExample?.trim()) {
                        setSaveError('Provide a sample value for the header variable {{1}}.');
                        return;
                    }
                    hComp.example = { header_text: [builderData.headerTextExample.trim()] };
                }
                components.push(hComp);
            } else if (builderData.headerType === 'Media') {
                const fmtMap = { image: 'IMAGE', video: 'VIDEO', document: 'DOCUMENT', location: 'LOCATION' };
                const fmt = fmtMap[headerMedia.mediaType] || 'IMAGE';

                if (fmt === 'LOCATION') {
                    components.push({ type: 'HEADER', format: 'LOCATION' });
                } else {
                    if (!headerMedia.file && !headerMedia.existingHandle) {
                        setSaveError(`Please upload a ${headerMedia.mediaType} file for the header.`);
                        return;
                    }

                    let mediaHandle;
                    if (headerMedia.file) {
                        // New file picked — upload to Meta
                        try {
                            setIsUploading(true);
                            setUploadProgress(0);
                            mediaHandle = await uploadMetaMedia(headerMedia.file, setUploadProgress);
                        } catch (err) {
                            setIsUploading(false);
                            const msg = err?.response?.data?.message || err.message || 'Media upload failed.';
                            setSaveError(msg);
                            toast.error(msg);
                            return;
                        }
                        setIsUploading(false);
                    } else {
                        // No new file — reuse existing handle from original template
                        mediaHandle = headerMedia.existingHandle;
                    }

                    components.push({
                        type: 'HEADER',
                        format: fmt,
                        example: { header_handle: [mediaHandle] },
                    });
                }
            }

            // BODY
            if (rawBody) {
                const bComp = { type: 'BODY', text: rawBody };
                if (variableKeys.length > 0) {
                    bComp.example = { body_text: [variableKeys.map((k) => String(variableValues[k].trim()))] };
                }
                components.push(bComp);
            }

            // FOOTER
            const rawFooter = builderData.footer?.trim();
            if (rawFooter) components.push({ type: 'FOOTER', text: rawFooter });

            // BUTTONS
            if (builderData.buttons.length > 0) {
                components.push({
                    type: 'BUTTONS',
                    buttons: builderData.buttons.map((b) => ({ type: 'QUICK_REPLY', text: b.label || '' })),
                });
            }
        }

        const payload = {
            TemplateName: safeName,
            TemplateType: templateDetails.templateCategory?.toUpperCase() || '',
            CreatedBy: userToken?.id || '',
            UserId: userToken?.userId || '',
            Language: templateDetails.templateLanguage,
            Components: components,
            IsDraft: isDraft ? 1 : 0,
        };

        if (isEditMode && editTemplateData?.Id) {
            payload.WabaTemplateId = editTemplateData.Id;
        }

        setIsSaving(true);
        const result = isEditMode ? await editTemplate(payload) : await createTemplate(payload);
        setIsSaving(false);

        if (!result.success) {
            const msg = result.error?.message || 'Failed to save template.';
            setSaveError(msg);
            toast.error(msg);
            return;
        }

        const rd = result.data?.data?.rd?.[0];
        const isSuccess = result.data?.success === true || rd?.stat === 1 || rd?.stat_code === 1000;

        if (isSuccess) {
            toast.success(isDraft ? 'Template saved as draft' : 'Template created successfully');
            handleClose();
        } else {
            const msg = rd?.stat_msg || result.data?.message || 'Failed to save template.';
            setSaveError(msg);
            toast.error(msg);
        }
    };



    return (
        <Box className={styles.pageRoot}>
            {/* ── Page Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <button className={styles.backBtn} onClick={handleClose}>
                        <ArrowLeft size={16} />
                    </button>
                    <div className={styles.headerIconWrap}>
                        <FileText size={18} />
                    </div>
                    <div>
                        <Typography className={styles.pageTitle}>
                            {isEditMode ? `Edit: ${editTemplateData?.TemplateName}` : isClone ? 'Clone Template' : 'New Template'}
                        </Typography>
                        <p className={styles.pageSubtitle}>
                            {isEditMode ? 'Update your template details' : 'Create a new WhatsApp template'}
                        </p>
                    </div>
                </div>

                {/* Step progress pills — same as Campaign / Templates */}
                <div className={styles.stepProgress}>
                    {[
                        { num: 1, label: 'Template Details' },
                        { num: 2, label: 'Build Template' },
                    ].map((s, i, arr) => {
                        const done = step > s.num;
                        const active = step === s.num;
                        return (
                            <React.Fragment key={s.num}>
                                <button
                                    className={`${styles.stepPill} ${active ? styles.stepPillActive : ''} ${done ? styles.stepPillDone : ''}`}
                                    onClick={() => s.num < step && setStep(s.num)}
                                    style={{ cursor: s.num < step ? 'pointer' : 'default' }}
                                >
                                    <span className={styles.stepPillNum}>{done ? '✓' : s.num}</span>
                                    <span className={styles.stepPillLabel}>{s.label}</span>
                                </button>
                                {i < arr.length - 1 && (
                                    <div className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <Box className={`${step === 2 ? styles.builderWrapper : styles.detailsWrapper}`}>

                {/* ── Step 1: Template Details ── */}
                {step === 1 && (
                    <Box className={styles.stepPanel}>
                        <div className={styles.inputSection}>
                            <Typography className={styles.fieldLabel}>Template Name</Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g. summer_sale_offer"
                                value={templateDetails.templateName}
                                onChange={(e) =>
                                    setTemplateDetails((p) => ({ ...p, templateName: e.target.value.replace(/ /g, '_') }))
                                }
                            />
                        </div>

                        <div className={styles.inputSection}>
                            <Typography className={styles.fieldLabel}>Template Language</Typography>
                            <TextField
                                select fullWidth
                                value={templateDetails.templateLanguage}
                                onChange={(e) => setTemplateDetails((p) => ({ ...p, templateLanguage: e.target.value }))}
                                SelectProps={{ native: true }}
                            >
                                <option value="en_US">English (US)</option>
                                <option value="en_GB">English (UK)</option>
                                <option value="hi">Hindi</option>
                                <option value="ar">Arabic</option>
                                <option value="es">Spanish</option>
                                <option value="pt_BR">Portuguese (BR)</option>
                            </TextField>
                        </div>

                        <div className={styles.inputSection}>
                            <Typography className={styles.fieldLabel}>Template Category</Typography>
                            <div className={styles.categoryList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {categoryCards.map((card) => {
                                    const { Icon } = card;
                                    return (
                                        <button
                                            key={card.key}
                                            type="button"
                                            className={`${styles.categoryCardFull} ${templateDetails.templateCategory === card.key ? styles.selectedCategoryFull : ''}`}
                                            onClick={() => setTemplateDetails((p) => ({ ...p, templateCategory: card.key }))}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '16px',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                backgroundColor: templateDetails.templateCategory === card.key ? 'rgba(115, 103, 240, 0.06)' : '#ffffff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s',
                                                width: '100%',
                                                borderColor: templateDetails.templateCategory === card.key ? '#7367f0' : '#e2e8f0'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: templateDetails.templateCategory === card.key ? 'rgba(115, 103, 240, 0.16)' : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: templateDetails.templateCategory === card.key ? '#7367f0' : '#64748b'
                                            }}>
                                                <Icon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>{card.key}</Typography>
                                                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>{card.description}</Typography>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.stepFooter}>
                            <Button variant="outlined" onClick={handleClose} className={styles.cancelBtn}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                className="buttonClassname"
                                onClick={() => setStep(2)}
                                disabled={!canProceedToBuilder}
                            >
                                Next
                            </Button>
                        </div>
                    </Box>
                )}

                {/* ── Step 2: Builder ── */}
                {step === 2 && (
                    <Box className={styles.builderRoot}>
                        {/* Sticky action bar */}
                        <div className={styles.builderTopActions}>
                            <Button
                                variant="outlined"
                                onClick={() => setStep(1)}
                                startIcon={<ChevronLeft size={16} />}
                                sx={{ color: '#1e293b', borderColor: '#e2e8f0', textTransform: 'none', fontWeight: 600 }}
                            >
                                Back
                            </Button>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {saveError && (
                                    <Typography className={styles.saveErrorText}>{saveError}</Typography>
                                )}
                                {!isEditMode && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleDraftClick}
                                        disabled={isSaving || isUploading}
                                        startIcon={<Save size={16} />}
                                        className='varientOutlinedBtn'
                                    >
                                        Save Template as Draft
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={handleCreateClick}
                                    disabled={isSaving || isUploading}
                                    className="buttonClassname"
                                    startIcon={(isSaving || isUploading) ? <CircularProgress size={14} color="inherit" /> : <Plus size={16} />}
                                >
                                    {isUploading ? `Uploading... ${uploadProgress}%` : isSaving ? 'Saving...' : (isEditMode ? 'Update Template' : 'Create Template')}
                                </Button>
                            </div>
                        </div>

                        <Grid container spacing={4} sx={{ pt: 2 }}>
                            {/* Left: form */}
                            <Grid size={{ lg: 8, md: 8, sm: 12, xs: 12 }}>
                                {/* Template Type */}
                                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography className={styles.sectionTitle}>Template Type</Typography>
                                    <div className={styles.chipRow}>
                                        {templateTypeOptions?.map((opt) => {
                                            const { icon: Icon, label, key } = opt;
                                            const isSelected = builderData.templateType === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    className={`${styles.choiceChip} ${isSelected ? styles.activeChip : ''}`}
                                                    onClick={() => {
                                                        if (['LTO', 'Catalog', 'MPM'].includes(key)) {
                                                            toast('Coming soon', { icon: '🚧' });
                                                            return;
                                                        }
                                                        setBuilderData((p) => ({ ...p, templateType: key }));
                                                        if (key === 'Carousel' && carouselCards.length === 0) {
                                                            setCarouselCards([
                                                                { id: Date.now(), header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
                                                                { id: Date.now() + 1, header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
                                                            ]);
                                                        }
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <Icon size={16} />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Paper>

                                {/* Header */}
                                {builderData.templateType !== 'Carousel' && (
                                    <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <Typography className={styles.sectionTitle}>Header</Typography>
                                        <Typography className={styles.sectionSubtitle}>Add a title or choose which type of media you'll use for this header.</Typography>
                                        {/* None / Text / Media chips */}
                                        <div className={styles.chipRow}>
                                            {headerOptions.map((opt) => {
                                                const { icon: Icon, label, key } = opt;
                                                const isSelected = builderData.headerType === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        className={`${styles.choiceChip} ${isSelected ? styles.activeChip : ''}`}
                                                        onClick={() => setBuilderData((p) => ({ ...p, headerType: key }))}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        <Icon size={16} />
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Text header */}
                                        {builderData.headerType === 'Text' && (
                                            <div className={styles.headerTextWrap}>
                                                <div className={styles.sectionHeaderRow}>
                                                    <Typography className={styles.variableTitle}>Header Text</Typography>
                                                    <Typography className={styles.charCounter}>{builderData.headerText.length}/60</Typography>
                                                </div>
                                                <TextField
                                                    fullWidth size="small"
                                                    placeholder="e.g. Our {{1}} is on!"
                                                    value={builderData.headerText}
                                                    onChange={(e) => setBuilderData((p) => ({ ...p, headerText: e.target.value.slice(0, 60) }))}
                                                />
                                                {/\{\{1\}\}/.test(builderData.headerText) && (
                                                    <TextField
                                                        fullWidth size="small"
                                                        label="Sample value for {{1}}"
                                                        value={builderData.headerTextExample}
                                                        onChange={(e) => setBuilderData((p) => ({ ...p, headerTextExample: e.target.value }))}
                                                        placeholder="e.g. Summer Sale"
                                                        style={{ marginTop: 8 }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Media header — icon card picker */}
                                        {builderData.headerType === 'Media' && (
                                            <div className={styles.mediaPickerWrap}>
                                                <div className={styles.mediaIconGrid}>
                                                    {[
                                                        { type: 'image', Icon: Image, label: 'Image' },
                                                        { type: 'video', Icon: Video, label: 'Video' },
                                                        { type: 'document', Icon: FileText, label: 'Document' },
                                                        { type: 'location', Icon: MapPin, label: 'Location' },
                                                    ].map(({ type, Icon, label }) => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            className={`${styles.mediaIconCard} ${headerMedia.mediaType === type ? styles.mediaIconCardActive : ''}`}
                                                            onClick={() => {
                                                                if (type === 'location') { toast('Location coming soon', { icon: '🚧' }); return; }
                                                                setHeaderMedia((p) => ({ ...p, mediaType: type, file: null, mediaUrl: '' }));
                                                            }}
                                                        >
                                                            {headerMedia.mediaType === type && (
                                                                <span className={styles.mediaIconCheck}>✓</span>
                                                            )}
                                                            <Icon size={28} className={styles.mediaIconSvg} />
                                                            <span className={styles.mediaIconLabel}>{label}</span>
                                                            {type === 'location' && <span className={styles.mediaIconSoon}>soon</span>}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Sample upload box */}
                                                {headerMedia.mediaType !== 'location' && (
                                                    <div className={styles.mediaSampleBox}>
                                                        <Typography className={styles.mediaSampleTitle}>Sample for header content</Typography>
                                                        <Typography className={styles.mediaSampleDesc}>
                                                            To help Meta review your content, provide examples of the variables or media in the header.
                                                            Do not include any customer information.
                                                        </Typography>

                                                        {/* Existing media preview (edit mode) */}
                                                        {!headerMedia.file && headerMedia.existingHandle && (
                                                            <div className={styles.existingMediaRow}>
                                                                {headerMedia.mediaType === 'image' && (
                                                                    <img
                                                                        src={headerMedia.existingHandle}
                                                                        alt="Current header"
                                                                        className={styles.existingMediaThumb}
                                                                    />
                                                                )}
                                                                {headerMedia.mediaType === 'video' && (
                                                                    <div className={styles.existingMediaVideo}>
                                                                        <Video size={18} />
                                                                        <span>Current video</span>
                                                                    </div>
                                                                )}
                                                                {headerMedia.mediaType === 'document' && (
                                                                    <div className={styles.existingMediaVideo}>
                                                                        <FileText size={18} />
                                                                        <span>Current document</span>
                                                                    </div>
                                                                )}
                                                                <Typography className={styles.existingMediaLabel}>
                                                                    Current file will be kept. Upload a new file to replace it.
                                                                </Typography>
                                                            </div>
                                                        )}

                                                        <div className={styles.mediaSampleActions}>
                                                            <Button
                                                                component="label"
                                                                className={styles.mediaUploadBtn}
                                                                startIcon={<Paperclip size={14} />}
                                                            >
                                                                {headerMedia.existingHandle && !headerMedia.file ? 'Replace file' : `Choose ${headerMedia.mediaType === 'image' ? 'JPG or PNG' : headerMedia.mediaType === 'video' ? 'MP4' : 'PDF'} file`}
                                                                <input
                                                                    hidden type="file"
                                                                    accept={MEDIA_CONFIG[headerMedia.mediaType]?.mimes.join(',')}
                                                                    onChange={(e) => {
                                                                        const f = e.target.files?.[0] || null;
                                                                        if (f) {
                                                                            const config = MEDIA_CONFIG[headerMedia.mediaType];
                                                                            if (config) {
                                                                                if (!config.mimes.includes(f.type)) {
                                                                                    toast.error(`Unsupported file type. Please upload a valid ${config.extensions}.`);
                                                                                    e.target.value = '';
                                                                                    return;
                                                                                }
                                                                                if (f.size > config.maxSize) {
                                                                                    toast.error(`File is too large. Max size is ${config.maxSizeLabel}.`);
                                                                                    e.target.value = '';
                                                                                    return;
                                                                                }
                                                                            }
                                                                        }
                                                                        setHeaderMedia((p) => ({ ...p, file: f, mediaUrl: f ? '' : p.existingHandle }));
                                                                    }}
                                                                />
                                                            </Button>
                                                            {headerMedia.file && (
                                                                <Typography className={styles.mediaFileName}>{headerMedia.file.name}</Typography>
                                                            )}
                                                        </div>
                                                        <div className={styles.mediaHint}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Supported: {MEDIA_CONFIG[headerMedia.mediaType]?.extensions} (Max {MEDIA_CONFIG[headerMedia.mediaType]?.maxSizeLabel})
                                                            </Typography>
                                                            {MEDIA_CONFIG[headerMedia.mediaType]?.extraNote && (
                                                                <Typography variant="caption" color="textSecondary" style={{ display: 'block', fontStyle: 'italic' }}>
                                                                    {MEDIA_CONFIG[headerMedia.mediaType].extraNote}
                                                                </Typography>
                                                            )}
                                                        </div>
                                                        {isUploading && (
                                                            <div className={styles.uploadProgressBox}>
                                                                <div className={styles.uploadProgressMeta}>
                                                                    <span>Uploading to Meta...</span>
                                                                    <span>{uploadProgress}%</span>
                                                                </div>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={uploadProgress}
                                                                    sx={{
                                                                        height: 6,
                                                                        borderRadius: 3,
                                                                        backgroundColor: 'rgba(115, 103, 240, 0.1)',
                                                                        '& .MuiLinearProgress-bar': {
                                                                            borderRadius: 3,
                                                                            backgroundColor: '#7367f0'
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Paper>
                                )}

                                {/* Body */}
                                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography className={styles.sectionTitle}>Body</Typography>
                                    <Typography className={styles.sectionSubtitle}>Enter the text for your message in the language that you've selected.</Typography>
                                    <TextField
                                        multiline minRows={6} fullWidth
                                        placeholder="Enter body text"
                                        value={builderData.body}
                                        onChange={(e) => {
                                            setBuilderData((p) => ({ ...p, body: e.target.value.slice(0, 1024) }));
                                            if (saveError === 'Template body is required.') setSaveError('');
                                        }}
                                        error={saveError === 'Template body is required.'}
                                        helperText={saveError === 'Template body is required.' ? 'This field is required' : (builderData.templateType === 'Carousel' ? 'Introductory text for the carousel.' : '')}
                                    />
                                    <div className={styles.bodyFooterRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', position: 'relative' }}>
                                        <Typography className={styles.charCounter} sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                            Characters: {bodyCharCount}/1024
                                        </Typography>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <Tooltip title="Add Emoji">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                                                >
                                                    <Smile size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Bold">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        fontWeight: 'bold',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={handleBold}
                                                >
                                                    B
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Italic">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        fontStyle: 'italic',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={handleItalic}
                                                >
                                                    I
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Strikethrough">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        textDecoration: 'line-through',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={handleStrikethrough}
                                                >
                                                    S
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Code">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={handleCode}
                                                >
                                                    <Code size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Add Variable Placeholder">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'var(--secondary-color)',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            background: 'rgba(115, 103, 240, 0.15)',
                                                            color: 'var(--primary-main)',
                                                            borderRadius: '8px'
                                                        }
                                                    }}
                                                    onClick={addVariablePlaceholder}
                                                >
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{`{ }`}</Typography>
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                        {emojiPickerOpen && (
                                            <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: '8px', zIndex: 9999 }}>
                                                <Picker
                                                    data={data}
                                                    onEmojiSelect={handleEmojiSelect}
                                                    theme="light"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {variableKeys.length > 0 && (
                                        <div className={styles.variableSection}>
                                            <Typography className={styles.variableTitle} style={{ marginBottom: 8 }}>Sample variable values</Typography>
                                            <div className={styles.variableInputList}>
                                                {variableKeys.map((key) => (
                                                    <TextField
                                                        key={key} fullWidth size="small"
                                                        label={`{{${key}}} sample`}
                                                        value={variableValues[key] || ''}
                                                        onChange={(e) => setVariableValues((p) => ({ ...p, [key]: e.target.value }))}
                                                        placeholder="e.g. John"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Paper>

                                {/* Carousel Cards Section */}
                                {builderData.templateType === 'Carousel' && (
                                    <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <div className={styles.sectionHeaderRow}>
                                            <Typography className={styles.sectionTitle}>Carousel Cards</Typography>
                                            <Typography className={styles.charCounter}>{carouselCards.length}/10 Cards</Typography>
                                        </div>
                                        <Typography className={styles.sectionSubtitle}>Add 2 to 10 cards. All cards must have the same media format and button structure.</Typography>

                                        <div className={styles.carouselCardsSection}>
                                            <div className={styles.cardNavWrap}>
                                                {carouselCards.map((card, idx) => (
                                                    <button
                                                        key={card.id}
                                                        type="button"
                                                        className={`${styles.cardTab} ${activeCardIndex === idx ? styles.cardTabActive : ''}`}
                                                        onClick={() => setActiveCardIndex(idx)}
                                                    >
                                                        Card {idx + 1}
                                                    </button>
                                                ))}
                                                {carouselCards.length < 10 && (
                                                    <button type="button" className={styles.addCardTab} onClick={addCarouselCard}>
                                                        <Plus size={14} /> Add Card
                                                    </button>
                                                )}
                                            </div>

                                            {carouselCards[activeCardIndex] && (
                                                <div className={styles.cardEditorPanel}>
                                                    <div className={styles.cardEditorHeader}>
                                                        <Typography className={styles.cardTitle}>Card {activeCardIndex + 1} Settings</Typography>
                                                        <Button
                                                            size="small"
                                                            className={styles.cardDeleteBtn}
                                                            onClick={() => removeCarouselCard(activeCardIndex)}
                                                            disabled={carouselCards.length <= 2}
                                                        >
                                                            Delete Card
                                                        </Button>
                                                    </div>

                                                    {/* Card Header Media */}
                                                    <div className={styles.mediaPickerWrap}>
                                                        <Typography className={styles.fieldLabel}>Card Header Media</Typography>
                                                        <div className={styles.mediaIconGrid}>
                                                            {[
                                                                { type: 'image', Icon: Image, label: 'Image' },
                                                                { type: 'video', Icon: Video, label: 'Video' },
                                                            ].map(({ type, Icon, label }) => (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    className={`${styles.mediaIconCard} ${carouselCards[activeCardIndex].header.mediaType === type ? styles.mediaIconCardActive : ''}`}
                                                                    onClick={() => {
                                                                        const current = carouselCards[activeCardIndex].header;
                                                                        // Only reset file if the type actually changed to avoid losing current card's data
                                                                        const newData = {
                                                                            header: {
                                                                                ...current,
                                                                                mediaType: type,
                                                                                file: current.mediaType === type ? current.file : null
                                                                            }
                                                                        };
                                                                        updateCardData(activeCardIndex, newData);
                                                                    }}
                                                                >
                                                                    <Icon size={24} className={styles.mediaIconSvg} />
                                                                    <span className={styles.mediaIconLabel}>{label}</span>
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className={styles.mediaSampleBox}>
                                                            <div className={styles.mediaSampleActions}>
                                                                <Button
                                                                    component="label"
                                                                    className={styles.mediaUploadBtn}
                                                                    startIcon={<Paperclip size={14} />}
                                                                >
                                                                    Choose {carouselCards[activeCardIndex].header.mediaType === 'image' ? 'JPG/PNG' : 'MP4'} file
                                                                    <input
                                                                        hidden type="file"
                                                                        accept={MEDIA_CONFIG[carouselCards[activeCardIndex].header.mediaType]?.mimes.join(',')}
                                                                        onChange={(e) => {
                                                                            const f = e.target.files?.[0] || null;
                                                                            if (f) {
                                                                                const config = MEDIA_CONFIG[carouselCards[activeCardIndex].header.mediaType];
                                                                                if (config) {
                                                                                    if (!config.mimes.includes(f.type)) {
                                                                                        toast.error(`Unsupported file type. Please upload a valid ${config.extensions}.`);
                                                                                        e.target.value = '';
                                                                                        return;
                                                                                    }
                                                                                    if (f.size > (carouselCards[activeCardIndex].header.mediaType === 'video' ? 16 * 1024 * 1024 : 5 * 1024 * 1024)) {
                                                                                        toast.error(`File is too large.`);
                                                                                        e.target.value = '';
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }
                                                                            updateCardData(activeCardIndex, {
                                                                                header: { ...carouselCards[activeCardIndex].header, file: f }
                                                                            });
                                                                        }}
                                                                    />
                                                                </Button>
                                                                {carouselCards[activeCardIndex].header.file && (
                                                                    <Typography className={styles.mediaFileName}>{carouselCards[activeCardIndex].header.file.name}</Typography>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Body */}
                                                    <div className={styles.cardBodySection}>
                                                        <div className={styles.sectionHeaderRow}>
                                                            <Typography className={styles.variableTitle}>Card Body</Typography>
                                                            <Typography className={styles.charCounter}>{carouselCards[activeCardIndex].body.length}/160</Typography>
                                                        </div>
                                                        <TextField
                                                            fullWidth multiline rows={2} size="small"
                                                            placeholder="Enter card description..."
                                                            value={carouselCards[activeCardIndex].body}
                                                            onChange={(e) => {
                                                                updateCardData(activeCardIndex, { body: e.target.value.slice(0, 160) });
                                                                if (saveError.includes('body is required')) setSaveError('');
                                                            }}
                                                            error={saveError === `Card ${activeCardIndex + 1} body is required.`}
                                                            helperText={saveError === `Card ${activeCardIndex + 1} body is required.` ? 'This field is required' : ''}
                                                        />
                                                    </div>

                                                    {/* Card Buttons */}
                                                    <div className={styles.cardButtonsSection}>
                                                        <div className={styles.sectionHeaderRow}>
                                                            <Typography className={styles.variableTitle}>Card Buttons (Max 2)</Typography>
                                                        </div>
                                                        <div className={styles.buttonList}>
                                                            {(carouselCards[activeCardIndex].buttons || []).map((btn, bIdx) => (
                                                                <div className={styles.buttonItem} key={btn.id || bIdx}>
                                                                    <TextField
                                                                        fullWidth size="small"
                                                                        value={btn.label}
                                                                        onChange={(e) => {
                                                                            const newButtons = [...carouselCards[activeCardIndex].buttons];
                                                                            newButtons[bIdx].label = e.target.value;
                                                                            updateCardData(activeCardIndex, { buttons: newButtons });
                                                                        }}
                                                                        placeholder="Button Label"
                                                                    />
                                                                    <Button
                                                                        className={styles.removeBtn}
                                                                        onClick={() => {
                                                                            const newButtons = carouselCards[activeCardIndex].buttons.filter((_, i) => i !== bIdx);
                                                                            updateCardData(activeCardIndex, { buttons: newButtons });
                                                                        }}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {carouselCards[activeCardIndex].buttons.length < 2 && (
                                                            <Button
                                                                className={styles.addBtn}
                                                                fullWidth
                                                                onClick={() => {
                                                                    const newButtons = [...(carouselCards[activeCardIndex].buttons || []), { id: Date.now(), label: '' }];
                                                                    updateCardData(activeCardIndex, { buttons: newButtons });
                                                                }}
                                                                startIcon={<Plus size={14} />}
                                                            >
                                                                Add Card Button
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Paper>
                                )}

                                {/* Footer */}
                                {builderData.templateType !== 'Carousel' && (
                                    <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <div className={styles.sectionHeaderRow}>
                                            <div>
                                                <Typography className={styles.sectionTitle}>
                                                    Footer <span className={styles.optionalBadge}>Optional</span>
                                                </Typography>
                                                <Typography className={styles.sectionSubtitle}>Add a short line of text to the bottom of your message template.</Typography>
                                            </div>
                                            <Typography className={styles.charCounter}>{footerCharCount}/60</Typography>
                                        </div>
                                        <TextField
                                            fullWidth size="small"
                                            placeholder="Enter Footer Text"
                                            value={builderData.footer}
                                            onChange={(e) => setBuilderData((p) => ({ ...p, footer: e.target.value.slice(0, 60) }))}
                                        />
                                    </Paper>
                                )}

                                {/* Buttons */}
                                {builderData.templateType !== 'Carousel' && (
                                    <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <Typography className={styles.sectionTitle}>
                                            Buttons <span className={styles.optionalBadge}>Optional</span>
                                        </Typography>
                                        <Typography className={styles.sectionSubtitle}>Create buttons that let customers respond to your message or take action.</Typography>
                                        <div className={styles.buttonList}>
                                            {builderData.buttons.map((btn) => (
                                                <div className={styles.buttonItem} key={btn.id}>
                                                    <TextField
                                                        fullWidth size="small"
                                                        value={btn.label}
                                                        onChange={(e) => updateActionButton(btn.id, e.target.value)}
                                                        placeholder="Button Label"
                                                    />
                                                    <Button className={styles.removeBtn} onClick={() => removeActionButton(btn.id)}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button className={styles.addBtn} onClick={addActionButton} startIcon={<Plus size={14} />}>
                                            Add Button
                                        </Button>
                                    </Paper>
                                )}
                            </Grid>

                            {/* Right: preview */}
                            <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
                                <MessagePreview
                                    headerType={builderData.headerType}
                                    headerText={builderData.headerText}
                                    headerTextExample={builderData.headerTextExample}
                                    headerMedia={headerMedia}
                                    body={builderData.body}
                                    footer={builderData.footer}
                                    buttons={builderData.buttons}
                                    templateType={builderData.templateType}
                                    carouselCards={carouselCards}
                                    variableValues={variableValues}
                                    showEmptyHint={true}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}

                <ConfirmationModal
                    isOpen={confirmationModal.isOpen}
                    onClose={handleCloseConfirmation}
                    onConfirm={confirmationModal.mode === 'draft' ? handleConfirmDraft : handleConfirmCreate}
                    title={confirmationModal.mode === 'draft' ? 'Save Template as Draft' : (isEditMode ? 'Update Template' : 'Create Template')}
                    description={
                        confirmationModal.mode === 'draft'
                            ? 'This will save your template as a draft. You can edit and submit it later.'
                            : (isEditMode ? 'This will update your template. Make sure all details are correct.' : 'This will create and submit your template to WhatsApp. Make sure all details are correct.')
                    }
                />
            </Box>
        </Box>
    );
};

export default CreateTemplatePage;
