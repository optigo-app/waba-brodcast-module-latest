import React, { useMemo, useState, useEffect } from 'react';
import {
    X, ChevronLeft, Plus, ArrowLeft, Users, Phone,
    MoreVertical, Smile, Paperclip, Camera, Mic, CheckCheck, FileText,
    Image, Video, MapPin, Upload,
    ChevronRight
} from 'lucide-react';
import { Box, Modal, Typography, Button, IconButton, TextField, CircularProgress, LinearProgress } from '@mui/material';
import { createTemplate } from '../../API/TemplateList/CreateTemplate';
import { uploadMetaMedia } from '../../API/InitialApi/UploadMetaMedia';
import toast from 'react-hot-toast';
import styles from './CreateTemplateModal.module.scss';

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

const CreateTemplateModal = ({ open, onClose, onSave }) => {
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
    });

    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [variableValues, setVariableValues] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Carousel state
    const [carouselCards, setCarouselCards] = useState([]);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [previewCardIndex, setPreviewCardIndex] = useState(0);

    // Reset on open
    useEffect(() => {
        if (open) {
            setStep(1);
            setTemplateDetails({ templateName: '', templateLanguage: 'en_US', templateCategory: '' });
            setBuilderData({ templateType: 'Interactive', headerType: 'None', headerText: '', headerTextExample: '', body: '', footer: '', buttons: [] });
            setHeaderMedia({ mediaType: 'image', file: null, mediaUrl: '', locationName: '', latitude: '', longitude: '' });
            setVariableValues({});
            setIsSaving(false);
            setSaveError('');
            setUploadProgress(0);
            setIsUploading(false);
            setCarouselCards([
                { id: Date.now(), header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
                { id: Date.now() + 1, header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
            ]);
            setActiveCardIndex(0);
        }
    }, [open]);

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
        onClose?.();
    };

    const templateTypeOptions = ['Interactive', 'Carousel', 'LTO', 'Catalog', 'MPM'];
    const headerOptions = ['None', 'Text', 'Media'];
    const categoryCards = [
        { key: 'Marketing', description: 'Send promotions or information about your products, services or business.' },
        { key: 'Utility', description: 'Send messages about an existing order or account.' },
        { key: 'Authentication', description: 'Send codes to verify a transaction or login.' },
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
        const next = variableKeys.length ? Math.max(...variableKeys) + 1 : 1;
        setBuilderData((prev) => {
            const sep = prev.body && !prev.body.endsWith(' ') ? ' ' : '';
            return { ...prev, body: `${prev.body}${sep}{{${next}}}` };
        });
        setVariableValues((prev) => ({ ...prev, [next]: prev[next] || '' }));
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

    const handleSave = async () => {
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
                if (c.buttons.length > 0 && c.buttons.some(b => !b.label.trim())) {
                    setSaveError(`Provide labels for all buttons in Card ${i + 1}.`);
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
                    if (!headerMedia.file) {
                        setSaveError(`Please upload a ${headerMedia.mediaType} file for the header.`);
                        return;
                    }
                    // Step 1: Upload file to Meta → get handle
                    let mediaHandle;
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

                    // Step 2: Use handle in header component
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
        };

        setIsSaving(true);
        const result = await createTemplate(payload);
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
            toast.success('Template created successfully');
            onSave?.({ safeName, ...payload, apiResponse: result.data });
            handleClose();
        } else {
            const msg = rd?.stat_msg || result.data?.message || 'Failed to save template.';
            setSaveError(msg);
            toast.error(msg);
        }
    };

    const previewBg = {
        backgroundImage: `linear-gradient(rgba(249,250,251,0.30),rgba(249,250,251,0.80)),url(${process.env.PUBLIC_URL}/bg-3.jpg)`,
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(10,12,16,0.45)', backdropFilter: 'blur(2px)' } } }}
        >
            <Box className={`${styles.modalBox} ${step === 2 ? styles.modalWide : styles.modalMedium}`}>
                {/* Header */}
                <Box className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {step === 2 && (
                            <IconButton onClick={() => setStep(1)} size="small" sx={{ ml: -1 }}>
                                <ChevronLeft size={22} />
                            </IconButton>
                        )}
                        <Typography className={styles.title} variant="h5">
                            {step === 1 ? 'Create Template' : 'WhatsApp Template Builder'}
                        </Typography>
                    </div>
                    <IconButton onClick={handleClose} size="small" className={styles.closeBtn}>
                        <X size={22} />
                    </IconButton>
                </Box>

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
                            <div className={styles.categoryGrid}>
                                {categoryCards.map((card) => (
                                    <button
                                        key={card.key}
                                        type="button"
                                        className={`${styles.categoryCard} ${templateDetails.templateCategory === card.key ? styles.selectedCategory : ''}`}
                                        onClick={() => setTemplateDetails((p) => ({ ...p, templateCategory: card.key }))}
                                    >
                                        <span className={styles.categoryTitle}>{card.key}</span>
                                        <span className={styles.categoryDesc}>{card.description}</span>
                                    </button>
                                ))}
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
                            <Button className={styles.ghostBtn} onClick={() => setStep(1)} startIcon={<ChevronLeft size={16} />}>
                                Back
                            </Button>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                {saveError && (
                                    <Typography className={styles.saveErrorText}>{saveError}</Typography>
                                )}
                                <Button
                                    className="buttonClassname"
                                    onClick={handleSave}
                                    disabled={isSaving || isUploading}
                                    startIcon={(isSaving || isUploading) ? <CircularProgress size={14} color="inherit" /> : null}
                                >
                                    {isUploading ? `Uploading... ${uploadProgress}%` : isSaving ? 'Saving...' : 'Save Template'}
                                </Button>
                            </div>
                        </div>

                        <div className={styles.builderLayout}>
                            {/* Left: form */}
                            <div className={styles.builderFormColumn}>
                                {/* Template Type */}
                                <section className={styles.builderSection}>
                                    <Typography className={styles.sectionTitle}>Template Type</Typography>
                                    <div className={styles.chipRow}>
                                        {templateTypeOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                className={`${styles.choiceChip} ${builderData.templateType === opt ? styles.activeChip : ''}`}
                                                onClick={() => {
                                                    if (['LTO', 'Catalog', 'MPM'].includes(opt)) {
                                                        toast('Coming soon', { icon: '🚧' });
                                                        return;
                                                    }
                                                    setBuilderData((p) => ({ ...p, templateType: opt }));
                                                    if (opt === 'Carousel' && carouselCards.length === 0) {
                                                        setCarouselCards([
                                                            { id: Date.now(), header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
                                                            { id: Date.now() + 1, header: { mediaType: 'image', file: null, handle: '' }, body: '', buttons: [] },
                                                        ]);
                                                    }
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Header */}
                                {builderData.templateType !== 'Carousel' && (
                                    <section className={styles.builderSection}>
                                        <Typography className={styles.sectionTitle}>Header</Typography>
                                        <Typography className={styles.sectionSubtitle}>Add a title or choose which type of media you'll use for this header.</Typography>
                                        {/* None / Text / Media chips */}
                                        <div className={styles.chipRow}>
                                            {headerOptions.map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className={`${styles.choiceChip} ${builderData.headerType === opt ? styles.activeChip : ''}`}
                                                    onClick={() => setBuilderData((p) => ({ ...p, headerType: opt }))}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
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
                                                        <div className={styles.mediaSampleActions}>
                                                            <Button
                                                                component="label"
                                                                className={styles.mediaUploadBtn}
                                                                startIcon={<Paperclip size={14} />}
                                                            >
                                                                Choose {headerMedia.mediaType === 'image' ? 'JPG or PNG' : headerMedia.mediaType === 'video' ? 'MP4' : 'PDF'} file
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
                                                                        setHeaderMedia((p) => ({ ...p, file: f, mediaUrl: '' }));
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
                                    </section>
                                )}

                                {/* Body */}
                                <section className={styles.builderSection}>
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
                                    <div className={styles.bodyFooterRow}>
                                        <Typography className={styles.charCounter}>Characters: {bodyCharCount}/1024</Typography>
                                        <Button className={styles.variableAddBtn} onClick={addVariablePlaceholder} startIcon={<Plus size={13} />}>
                                            Add Variable
                                        </Button>
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
                                </section>

                                {/* Carousel Cards Section */}
                                {builderData.templateType === 'Carousel' && (
                                    <section className={styles.builderSection}>
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
                                                            <Typography className={styles.variableTitle}>Card Body (Optional)</Typography>
                                                            <Typography className={styles.charCounter}>{carouselCards[activeCardIndex].body.length}/160</Typography>
                                                        </div>
                                                        <TextField
                                                            fullWidth multiline rows={2} size="small"
                                                            placeholder="Enter card description..."
                                                            value={carouselCards[activeCardIndex].body}
                                                            onChange={(e) => updateCardData(activeCardIndex, { body: e.target.value.slice(0, 160) })}
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
                                    </section>
                                )}

                                {/* Footer */}
                                {builderData.templateType !== 'Carousel' && (
                                    <section className={styles.builderSection}>
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
                                    </section>
                                )}

                                {/* Buttons */}
                                {builderData.templateType !== 'Carousel' && (
                                    <section className={styles.builderSection}>
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
                                    </section>
                                )}
                            </div>

                            {/* Right: preview */}
                            <div className={styles.previewColumn}>
                                <div className={styles.previewShell}>
                                    <div className={styles.previewPhone}>
                                        <div className={styles.previewChatHeader}>
                                            <ArrowLeft size={16} className={styles.headerIcon} />
                                            <div className={styles.chatAvatar}><Users size={14} /></div>
                                            <div className={styles.chatMeta}>
                                                <span className={styles.chatName}>Business</span>
                                                <span className={styles.chatStatus}>online</span>
                                            </div>
                                            <div className={styles.headerActions}>
                                                <Phone size={15} className={styles.headerIcon} />
                                                <MoreVertical size={15} className={styles.headerIcon} />
                                            </div>
                                        </div>
                                        <div className={styles.previewChatBg} style={previewBg}>
                                            {hasPreviewMessage ? (
                                                <div className={styles.previewBubbleWrap}>
                                                    <div className={styles.previewBubbleAccent} />
                                                    {builderData.templateType === 'Carousel' ? (
                                                        <div className={styles.previewCarouselWrap}>
                                                            {/* Top level body for carousel */}
                                                            {previewBody.trim() && (
                                                                <div className={styles.previewBubble}>
                                                                    <Typography className={styles.previewBodyText}>{previewBody}</Typography>
                                                                    <div className={styles.previewMeta}>
                                                                        <Typography className={styles.previewTime}>{currentPreviewTime}</Typography>
                                                                        <CheckCheck size={12} className={styles.previewTick} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Horizontal Cards */}
                                                            <div className={styles.previewCarouselContainer}>
                                                                {previewCardIndex > 0 && (
                                                                    <button
                                                                        className={styles.carouselNavBtnLeft}
                                                                        onClick={() => setPreviewCardIndex(p => Math.max(0, p - 1))}
                                                                    >
                                                                        <ChevronLeft size={16} />
                                                                    </button>
                                                                )}

                                                                <div className={styles.previewCardSlider} style={{ transform: `translateX(-${previewCardIndex * 100}%)` }}>
                                                                    {carouselCards.map((card, idx) => (
                                                                        <div key={card.id || idx} className={styles.previewCardUnit}>
                                                                            <div className={styles.previewCard}>
                                                                                {card.header.file ? (
                                                                                    card.header.mediaType === 'image' ? (
                                                                                        <img src={URL.createObjectURL(card.header.file)} alt="card" className={styles.previewCardMedia} />
                                                                                    ) : (
                                                                                        <div className={styles.previewCardMedia} style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                            <Video size={24} color="#fff" />
                                                                                        </div>
                                                                                    )
                                                                                ) : (
                                                                                    <div className={styles.previewCardMedia} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                                                        {card.header.mediaType === 'image' ? <Image size={24} /> : <Video size={24} />}
                                                                                    </div>
                                                                                )}

                                                                                <div className={styles.previewCardContent}>
                                                                                    {card.body && <Typography className={styles.previewCardBody}>{card.body}</Typography>}
                                                                                </div>

                                                                                <div className={styles.previewCardButtons}>
                                                                                    {card.buttons.map((btn, bIdx) => (
                                                                                        <div key={btn.id || bIdx} className={styles.previewCardBtn}>{btn.label || 'Button'}</div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {previewCardIndex < carouselCards.length - 1 && (
                                                                    <button
                                                                        className={styles.carouselNavBtnRight}
                                                                        onClick={() => setPreviewCardIndex(p => Math.min(carouselCards.length - 1, p + 1))}
                                                                    >
                                                                        <ChevronRight size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className={styles.carouselDotRow}>
                                                                {carouselCards.map((_, dotIdx) => (
                                                                    <div
                                                                        key={dotIdx}
                                                                        className={`${styles.carouselDot} ${previewCardIndex === dotIdx ? styles.carouselDotActive : ''}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={styles.previewBubble}>
                                                            {builderData.headerType === 'Text' && builderData.headerText && (
                                                                <Typography className={styles.previewHeaderText}>
                                                                    {builderData.headerText.replace(/\{\{1\}\}/g, builderData.headerTextExample || '{{1}}')}
                                                                </Typography>
                                                            )}
                                                            {previewImageUrl && (
                                                                <img src={previewImageUrl} alt="Header" className={styles.previewHeaderImage} />
                                                            )}
                                                            {previewVideoUrl && (
                                                                <video className={styles.previewHeaderVideo} controls playsInline preload="metadata">
                                                                    <source src={previewVideoUrl} />
                                                                </video>
                                                            )}
                                                            {previewDocumentLabel && (
                                                                <div className={styles.previewHeaderDocument}>
                                                                    <div className={styles.previewDocIconWrap}>
                                                                        <FileText size={18} className={styles.previewDocIcon} />
                                                                    </div>
                                                                    <div className={styles.previewDocMeta}>
                                                                        <span className={styles.previewDocTitle}>Document</span>
                                                                        <span className={styles.previewDocSub}>{previewDocumentLabel}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {previewBody.trim() && (
                                                                <Typography className={styles.previewBodyText}>{previewBody}</Typography>
                                                            )}
                                                            {builderData.footer && (
                                                                <Typography className={styles.previewFooterText}>{builderData.footer}</Typography>
                                                            )}
                                                            {builderData.buttons.length > 0 && (
                                                                <div className={styles.previewButtons}>
                                                                    {builderData.buttons.map((btn) => (
                                                                        <button key={btn.id} type="button" className={styles.previewActionBtn}>
                                                                            {btn.label || 'Button'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className={styles.previewMeta}>
                                                                <Typography className={styles.previewTime}>{currentPreviewTime}</Typography>
                                                                <CheckCheck size={12} className={styles.previewTick} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={styles.previewEmptyHint}>
                                                    Preview will appear here
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

export default CreateTemplateModal;
