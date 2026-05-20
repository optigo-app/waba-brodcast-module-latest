import React, { useMemo, useState, useEffect } from 'react';
import {
    X, ChevronLeft, Plus, ArrowLeft, Users, Phone,
    MoreVertical, Camera, Mic, CheckCheck, FileText,
    Image,
    ChevronRight, Megaphone, Bell, Key,
    MessageSquare, Layout, Clock, BookOpen, Package, Save, Slash, Type
} from 'lucide-react';
import { Box, Typography, Button, TextField, CircularProgress, Grid, Paper } from '@mui/material';
import { createTemplate } from '../../API/TemplateList/CreateTemplate';
import { editTemplate } from '../../API/TemplateList/EditTemplate';
import { uploadMetaMedia } from '../../API/InitialApi/UploadMetaMedia';
import { filesUploadApi } from '../../API/InitialApi/filesUploadApi';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CreateTemplatePage.module.scss';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import MessagePreview from '../MessagePreview/MessagePreview';
import TemplateButtonSection from './TemplateButtonSection';
import TemplateCarouselSection from './TemplateCarouselSection';
import TemplateBodySection from './TemplateBodySection';
import TemplateHeaderSection from './TemplateHeaderSection';
import TemplateDetailsStepSection from './TemplateDetailsStepSection';
import {
    createButtonConfig,
    getButtonMenuOptions,
    mapButtonToApi,
    mapExistingApiButtonToEditor,
} from './templateButtonUtils';
import { normalizeTemplateName, validateMediaFile } from './templateBuilderUtils';

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
        templateLanguage: 'en',
        templateCategory: 'Utility',
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
    const [saveProcess, setSaveProcess] = useState({ active: false, title: '', message: '', progress: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, mode: null });
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [templateNameError, setTemplateNameError] = useState('');
    const [isMainButtonMenuOpen, setIsMainButtonMenuOpen] = useState(false);
    const [isCardButtonMenuOpen, setIsCardButtonMenuOpen] = useState(false);

    const editTemplateData = location.state?.template;
    const isClone = location.state?.isClone || false;
    const isEditMode = !!editTemplateData && !isClone;

    const setProcessStep = (message, progress = null) => {
        setSaveProcess({
            active: true,
            title: isEditMode ? 'Updating Template' : 'Creating Template',
            message,
            progress,
        });
    };

    const getCategoryLabel = (value) => {
        const raw = String(value || '').trim();
        const normalized = raw.toUpperCase();
        if (normalized === 'MARKETING') return 'Marketing';
        if (normalized === 'UTILITY') return 'Utility';
        if (normalized === 'AUTHENTICATION') return 'Authentication';
        return raw;
    };

    useEffect(() => {
        if (editTemplateData) {
            setTemplateDetails({
                templateName: isClone ? `${editTemplateData.TemplateName}_clone` : (editTemplateData.TemplateName || ''),
                templateLanguage: editTemplateData.Language || 'en_US',
                templateCategory: getCategoryLabel(editTemplateData.TemplateType),
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
            const carouselComponent = components.find(c => String(c?.type || '').toUpperCase() === 'CAROUSEL');
            const isCarouselTemplate = Array.isArray(carouselComponent?.cards);

            const initialVars = {};
            if (body?.example?.body_text?.[0]) {
                body.example.body_text[0].forEach((val, idx) => {
                    initialVars[idx + 1] = val;
                });
            }
            setVariableValues(initialVars);

            if (isCarouselTemplate) {
                let mediaUrls = [];
                try {
                    if (Array.isArray(editTemplateData.MediaData)) {
                        mediaUrls = editTemplateData.MediaData.filter(Boolean);
                    } else if (typeof editTemplateData.MediaData === 'string' && editTemplateData.MediaData.trim()) {
                        const parsedMedia = JSON.parse(editTemplateData.MediaData);
                        mediaUrls = Array.isArray(parsedMedia) ? parsedMedia.filter(Boolean) : [];
                    }
                } catch (error) {
                    console.error('Error parsing carousel template media:', error);
                }

                const mappedCards = carouselComponent.cards.map((card, cardIndex) => {
                    const cardComponents = card?.components || [];
                    const cardHeader = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'HEADER');
                    const cardBody = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'BODY');
                    const cardButtons = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'BUTTONS');
                    const existingHandle = cardHeader?.example?.header_handle?.[0] || '';
                    const mediaUrl = mediaUrls[cardIndex] || existingHandle;

                    return {
                        id: Date.now() + cardIndex,
                        header: {
                            mediaType: (cardHeader?.format || 'IMAGE').toLowerCase(),
                            file: null,
                            handle: existingHandle,
                            existingHandle,
                            mediaUrl,
                        },
                        body: cardBody?.text || '',
                        buttons: (cardButtons?.buttons || []).map((b, idx) => mapExistingApiButtonToEditor(b, idx)),
                    };
                });

                setBuilderData({
                    templateType: 'Carousel',
                    headerType: 'Media',
                    headerText: '',
                    headerTextExample: '',
                    body: body?.text || '',
                    footer: '',
                    buttons: [],
                });
                setCarouselCards(mappedCards);
                setActiveCardIndex(0);
                setPreviewCardIndex(0);
            } else {
                setBuilderData({
                    templateType: 'Interactive',
                    headerType: header ? (header.format === 'TEXT' ? 'Text' : 'Media') : 'None',
                    headerText: header?.text || '',
                    headerTextExample: header?.example?.header_text?.[0] || '',
                    body: body?.text || '',
                    footer: footer?.text || '',
                    buttons: buttons?.buttons?.map((b, idx) => mapExistingApiButtonToEditor(b, idx)) || [],
                });
            }

            // Restore existing media handle + preview URL for interactive edit mode
            if (!isCarouselTemplate && header && header.format !== 'TEXT' && header.example?.header_handle?.[0]) {
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

    const validateTemplate = () => {
        const rawBody = (builderData.body || '').replace(/\\n/g, '\n').trim();

        if (/\{\{\d+\}\}\s*$/.test(rawBody)) {
            return 'Body cannot end with a variable like {{1}}. Add text after it.';
        }

        if (!rawBody) {
            return 'Template body is required.';
        }

        const missingVar = variableKeys.find((k) => !variableValues[k]?.trim());
        if (missingVar !== undefined) {
            return `Provide a sample value for variable {{${missingVar}}}.`;
        }

        if (builderData.templateType === 'Carousel') {
            if (carouselCards.length < 2 || carouselCards.length > 10) {
                return 'Carousel must contain between 2 and 10 cards.';
            }

            const firstType = carouselCards[0].header.mediaType;
            for (let i = 0; i < carouselCards.length; i++) {
                const c = carouselCards[i];
                if (c.header.mediaType !== firstType) {
                    return `All cards must have the same media type. Card ${i + 1} is different.`;
                }
                if (!c.header.file && !c.header.existingHandle) {
                    return `Card ${i + 1} is missing a media file.`;
                }
                if (!c.body?.trim()) {
                    return `Card ${i + 1} body is required.`;
                }

                const quickReplyCount = c.buttons.filter((b) => b.type === 'QUICK_REPLY').length;
                const ctaCount = c.buttons.filter((b) => b.type === 'PHONE_NUMBER' || b.type === 'URL').length;

                if (c.buttons.length !== 2) {
                    return `Card ${i + 1} requires exactly 2 buttons (1 Quick Reply and 1 Call-to-action).`;
                }
                if (quickReplyCount > 1) {
                    return `Card ${i + 1} requires at max 1 Quick Reply button.`;
                }
                if (ctaCount > 1) {
                    return `Card ${i + 1} requires at max 1 Call-to-action button (Call or Website).`;
                }
                if (c.buttons.some((b) => !(b.text || '').trim())) {
                    return `Provide button text for all buttons in Card ${i + 1}.`;
                }
                const cardButtonError = c.buttons
                    .map((button) => validateButtonFields(button, { cardIndex: i }))
                    .find(Boolean);
                if (cardButtonError) {
                    return cardButtonError;
                }
            }

            const firstCardButtonCount = carouselCards[0].buttons.length;
            for (let i = 1; i < carouselCards.length; i++) {
                if (carouselCards[i].buttons.length !== firstCardButtonCount) {
                    return 'All cards in a carousel must have the same number of buttons.';
                }
            }

            const getButtonSignature = (button = {}) => {
                if (button.type === 'URL') {
                    return `URL:${button.urlType || 'STATIC'}`;
                }
                return button.type || '';
            };
            const firstCardButtonStructure = carouselCards[0].buttons.map(getButtonSignature).join('|');
            for (let i = 1; i < carouselCards.length; i++) {
                const cardStructure = carouselCards[i].buttons.map(getButtonSignature).join('|');
                if (cardStructure !== firstCardButtonStructure) {
                    return 'All carousel cards must use the same button action types in the same order.';
                }
            }
        }

        if (builderData.headerType === 'Media' && headerMedia.mediaType !== 'location') {
            if (!headerMedia.file && !headerMedia.existingHandle) {
                return `Please upload a ${headerMedia.mediaType} file for the header.`;
            }
        }

        if (builderData.headerType === 'Text' && /\{\{1\}\}/.test(builderData.headerText)) {
            if (!builderData.headerTextExample?.trim()) {
                return 'Provide a sample value for the header variable {{1}}.';
            }
        }

        if (builderData.buttons.length > 0) {
            const mainButtonError = builderData.buttons
                .map((button) => validateButtonFields(button))
                .find(Boolean);
            if (mainButtonError) {
                return mainButtonError;
            }
        }

        return null;
    };

    const handleDraftClick = () => {
        setSaveError('');
        const validationError = validateTemplate();
        if (validationError) {
            setSaveError(validationError);
            return;
        }
        setConfirmationModal({ isOpen: true, mode: 'draft' });
    };

    const handleCreateClick = () => {
        setSaveError('');
        const validationError = validateTemplate();
        if (validationError) {
            setSaveError(validationError);
            return;
        }
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

    const handleNextFromDetails = () => {
        if (!templateDetails.templateName.trim()) {
            setTemplateNameError('Template name is required');
            return;
        }

        setTemplateNameError('');
        setStep(2);
    };

    // Button helpers
    const updateActionButton = (id, patch) => {
        setBuilderData((prev) => ({
            ...prev,
            buttons: prev.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b))
        }));
    };

    const removeActionButton = (id) => {
        setBuilderData((prev) => ({ ...prev, buttons: prev.buttons.filter((b) => b.id !== id) }));
    };

    const handleMainButtonUpdate = (btn, _idx, patch) => {
        updateActionButton(btn.id, patch);
    };

    const handleMainButtonRemove = (btn) => {
        removeActionButton(btn.id);
    };

    const addMainButton = (type) => {
        setBuilderData((prev) => ({
            ...prev,
            buttons: [...prev.buttons, createButtonConfig(type)]
        }));
        setIsMainButtonMenuOpen(false);
    };

    const addCardButton = (cardIndex, type) => {
        const sourceButtons = carouselCards[cardIndex]?.buttons || [];
        if (sourceButtons.length >= 2) {
            setIsCardButtonMenuOpen(false);
            return;
        }

        const nextSourceButtons = [...sourceButtons, createButtonConfig(type)];
        setCarouselCards((prev) => prev.map((card) => ({
            ...card,
            buttons: nextSourceButtons.map((sourceBtn, idx) => {
                const existing = card.buttons?.[idx];

                if (existing && existing.type === sourceBtn.type) {
                    if (sourceBtn.type === 'URL') {
                        return {
                            ...existing,
                            urlType: sourceBtn.urlType || existing.urlType || 'STATIC'
                        };
                    }
                    return existing;
                }

                const fresh = createButtonConfig(sourceBtn.type);
                if (sourceBtn.type === 'URL') {
                    fresh.urlType = sourceBtn.urlType || fresh.urlType || 'STATIC';
                }
                return fresh;
            })
        })));
        setIsCardButtonMenuOpen(false);
    };

    const handleCardButtonUpdate = (cardIndex, btn, _idx, patch) => {
        updateCardButton(cardIndex, btn.id, patch);
    };

    const handleCardButtonRemove = (cardIndex, _btn, idx) => {
        removeCardButton(cardIndex, idx);
    };

    const handleCardHeaderTypeChange = (cardIndex, type) => {
        const current = carouselCards[cardIndex].header;
        const newData = {
            header: {
                ...current,
                mediaType: type,
                file: current.mediaType === type ? current.file : null
            }
        };
        updateCardData(cardIndex, newData);
    };

    const handleCardFileChange = (cardIndex, e) => {
        const f = e.target.files?.[0] || null;
        const currentMediaType = carouselCards[cardIndex].header.mediaType;
        const validation = validateMediaFile({
            file: f,
            mediaType: currentMediaType,
            mediaConfig: MEDIA_CONFIG,
            includeMaxSizeLabel: false,
        });
        if (!validation.isValid) {
            toast.error(validation.error);
            e.target.value = '';
            return;
        }
        updateCardData(cardIndex, {
            header: { ...carouselCards[cardIndex].header, file: f }
        });
    };

    const handleCardBodyChange = (cardIndex, body) => {
        updateCardData(cardIndex, { body: body.slice(0, 160) });
        if (saveError.includes('body is required')) setSaveError('');
    };

    const handleHeaderMediaTypeChange = (type) => {
        if (type === 'location') {
            toast('Location coming soon', { icon: '🚧' });
            return;
        }
        setHeaderMedia((p) => ({ ...p, mediaType: type, file: null, mediaUrl: '' }));
    };

    const handleHeaderMediaFileChange = (e) => {
        const f = e.target.files?.[0] || null;
        const validation = validateMediaFile({
            file: f,
            mediaType: headerMedia.mediaType,
            mediaConfig: MEDIA_CONFIG,
            includeMaxSizeLabel: true,
        });
        if (!validation.isValid) {
            toast.error(validation.error);
            e.target.value = '';
            return;
        }
        setHeaderMedia((p) => ({ ...p, file: f, mediaUrl: f ? '' : p.existingHandle }));
    };

    const updateCardButton = (cardIndex, buttonId, patch) => {
        setCarouselCards((prev) => {
            const sourceButtons = prev[cardIndex]?.buttons || [];
            const buttonIndex = sourceButtons.findIndex((btn) => btn.id === buttonId);
            const shouldSyncStructure = buttonIndex >= 0 && Object.prototype.hasOwnProperty.call(patch, 'urlType');

            return prev.map((card, idx) => {
                const nextButtons = (card.buttons || []).map((btn, btnIdx) => {
                    if (idx === cardIndex && btn.id === buttonId) {
                        return { ...btn, ...patch };
                    }

                    if (shouldSyncStructure && btnIdx === buttonIndex && btn.type === 'URL') {
                        return { ...btn, urlType: patch.urlType };
                    }

                    return btn;
                });

                return { ...card, buttons: nextButtons };
            });
        });
    };

    const removeCardButton = (cardIndex, buttonIndex) => {
        setCarouselCards((prev) => prev.map((card) => ({
            ...card,
            buttons: (card.buttons || []).filter((_, idx) => idx !== buttonIndex)
        })));
    };

    // Carousel helpers
    const addCarouselCard = () => {
        if (carouselCards.length >= 10) {
            toast.error('Maximum 10 cards allowed');
            return;
        }
        const firstCardMediaType = carouselCards[0]?.header.mediaType || 'image';
        const firstCardButtons = carouselCards[0]?.buttons || [];
        setCarouselCards((prev) => [
            ...prev,
            {
                id: Date.now(),
                header: { mediaType: firstCardMediaType, file: null, handle: '' },
                body: '',
                buttons: firstCardButtons.map((btn) => {
                    const fresh = createButtonConfig(btn.type);
                    if (btn.type === 'URL') {
                        fresh.urlType = btn.urlType || fresh.urlType || 'STATIC';
                    }
                    return fresh;
                })
            }
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

    const validateButtonFields = (button, { cardIndex = null } = {}) => {
        const scopePrefix = cardIndex !== null ? `Card ${cardIndex + 1}: ` : '';

        if (!(button.text || '').trim()) {
            return `${scopePrefix}Provide button text.`;
        }

        if (button.type === 'PHONE_NUMBER') {
            const phoneValue = (button.phone_number || '').trim();
            if (!phoneValue) {
                return `${scopePrefix}Provide phone number for call button.`;
            }

            const digitsOnly = phoneValue.replace(/\D/g, '');
            if (digitsOnly.length < 8 || digitsOnly.length > 15) {
                return `${scopePrefix}Phone number should contain 8 to 15 digits.`;
            }
        }

        if (button.type === 'URL') {
            const urlValue = (button.url || '').trim();
            if (!urlValue) {
                return `${scopePrefix}Provide website URL for visit website button.`;
            }

            if (!/^https?:\/\//i.test(urlValue)) {
                return `${scopePrefix}Website URL must start with http:// or https://.`;
            }

            const hasVariable = /\{\{\d+\}\}/.test(urlValue);
            if (button.urlType === 'DYNAMIC') {
                if (!hasVariable) {
                    return `${scopePrefix}Dynamic URL must include a variable like {{1}}.`;
                }
                if (!(button.example || '').trim()) {
                    return `${scopePrefix}Provide example URL for dynamic website button.`;
                }
            }

            if ((button.urlType || 'STATIC') === 'STATIC' && hasVariable) {
                return `${scopePrefix}Static URL cannot contain variables like {{1}}.`;
            }
        }

        return '';
    };

    const handleSave = async (isDraft = false) => {
        setIsSaving(true);
        setProcessStep('Validating template details...', 5);

        const userToken = JSON.parse(sessionStorage.getItem('userToken'));
        setSaveError('');

        const backgroundUploadFiles = [];
        const uploadFolderName = `wababroadcast/${templateDetails.templateName
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 512)}`;
        const uploadUniqueNo = `${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

        // Meta rules
        const rawBody = (builderData.body || '').replace(/\\n/g, '\n').trim();

        const safeName = templateDetails.templateName
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 512);

        const components = [];

        try {
            setProcessStep('Preparing template components...', 15);

        if (builderData.templateType === 'Carousel') {
            for (let i = 0; i < carouselCards.length; i++) {
                const c = carouselCards[i];
                if (c.header.file) {
                    backgroundUploadFiles.push(c.header.file);
                }
            }

            // sequential uploads
            const cardComponents = [];
            try {
                setProcessStep('Uploading carousel media to WhatsApp...', 30);
                setIsUploading(true);
                for (let i = 0; i < carouselCards.length; i++) {
                    const c = carouselCards[i];
                    let handle = c.header.existingHandle || '';
                    if (c.header.file) {
                        setProcessStep(`Uploading card ${i + 1} media to WhatsApp...`, 30 + Math.round(((i + 1) / carouselCards.length) * 25));
                        setUploadProgress(0);
                        toast(`Uploading Card ${i + 1} media...`, { icon: '☁️' });
                        handle = await uploadMetaMedia(c.header.file, setUploadProgress);
                    }

                    if (!handle) {
                        setSaveError(`Card ${i + 1} is missing a media handle.`);
                        setIsUploading(false);
                        return;
                    }

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
                            buttons: c.buttons.map((b) => mapButtonToApi(b))
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
                    hComp.example = { header_text: [builderData.headerTextExample.trim()] };
                }
                components.push(hComp);
            } else if (builderData.headerType === 'Media') {
                const fmtMap = { image: 'IMAGE', video: 'VIDEO', document: 'DOCUMENT', location: 'LOCATION' };
                const fmt = fmtMap[headerMedia.mediaType] || 'IMAGE';

                if (fmt === 'LOCATION') {
                    components.push({ type: 'HEADER', format: 'LOCATION' });
                } else {
                    let mediaHandle;
                    if (headerMedia.file) {
                        backgroundUploadFiles.push(headerMedia.file);

                        // New file picked — upload to Meta
                        try {
                            setProcessStep('Uploading header media to WhatsApp...', 40);
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
                    buttons: builderData.buttons.map((b) => mapButtonToApi(b)),
                });
            }
        }

        let uploadedMediaUrls = [];
        if (backgroundUploadFiles.length > 0) {
            const attachments = backgroundUploadFiles.map((file) => ({ file }));
            try {
                setProcessStep('Uploading media files to server...', 70);
                const uploadResult = await filesUploadApi({
                    attachments,
                    folderName: uploadFolderName,
                    uniqueNo: uploadUniqueNo,
                });

                uploadedMediaUrls = (uploadResult?.files || [])
                    .map((fileObj) => fileObj?.url)
                    .filter(Boolean);

                if (!uploadResult?.success || uploadedMediaUrls.length === 0) {
                    const msg = uploadResult?.message || 'File upload failed before template save.';
                    setSaveError(msg);
                    toast.error(msg);
                    return;
                }
            } catch (error) {
                const msg = error?.response?.data?.message || error?.message || 'File upload failed before template save.';
                setSaveError(msg);
                toast.error(msg);
                return;
            }
        }

        const payload = {
            TemplateName: safeName,
            TemplateType: templateDetails.templateCategory?.toUpperCase() || '',
            CreatedBy: userToken?.id || '',
            UserId: userToken?.userId || '',
            Language: templateDetails.templateLanguage,
            Components: components,
            MediaData: JSON.stringify(uploadedMediaUrls),
            IsDraft: isDraft ? 1 : 0,
        };

        if (isEditMode && editTemplateData?.Id) {
            payload.TemplateId = editTemplateData.Id;
        }

        setProcessStep(isEditMode ? 'Updating template details...' : 'Creating template...', 90);
        const result = isEditMode ? await editTemplate(payload) : await createTemplate(payload);

        if (!result.success) {
            const msg = result.error?.message || 'Failed to save template.';
            setSaveError(msg);
            toast.error(msg);
            return;
        }

        const rd = result.data?.data?.rd?.[0];
        const isSuccess = result.data?.success === true || rd?.stat === 1 || rd?.stat_code === 1000;

        if (isSuccess) {
            setProcessStep(isEditMode ? 'Template updated successfully.' : 'Template created successfully.', 100);
            toast.success(isDraft ? 'Template saved as draft' : 'Template created successfully');
            handleClose();
        } else {
            const msg = rd?.stat_msg || result.data?.message || 'Failed to save template.';
            setSaveError(msg);
            toast.error(msg);
        }
        } finally {
            setIsUploading(false);
            setIsSaving(false);
            setSaveProcess({ active: false, title: '', message: '', progress: null });
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
                    <TemplateDetailsStepSection
                        styles={styles}
                        templateDetails={templateDetails}
                        templateNameError={templateNameError}
                        categoryCards={categoryCards}
                        onTemplateNameChange={(value) => {
                            const normalized = normalizeTemplateName(value);
                            setTemplateDetails((p) => ({ ...p, templateName: normalized }));
                            if (normalized.trim()) setTemplateNameError('');
                        }}
                        onTemplateLanguageChange={(value) => setTemplateDetails((p) => ({ ...p, templateLanguage: value }))}
                        onTemplateCategoryChange={(value) => setTemplateDetails((p) => ({ ...p, templateCategory: value }))}
                        onClose={handleClose}
                        onNext={handleNextFromDetails}
                    />
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
                                    <TemplateHeaderSection
                                        styles={styles}
                                        builderData={builderData}
                                        headerMedia={headerMedia}
                                        headerOptions={headerOptions}
                                        mediaConfig={MEDIA_CONFIG}
                                        isUploading={isUploading}
                                        uploadProgress={uploadProgress}
                                        onHeaderTypeChange={(key) => setBuilderData((p) => ({ ...p, headerType: key }))}
                                        onHeaderTextChange={(value) => setBuilderData((p) => ({ ...p, headerText: value }))}
                                        onHeaderTextExampleChange={(value) => setBuilderData((p) => ({ ...p, headerTextExample: value }))}
                                        onHeaderMediaTypeChange={handleHeaderMediaTypeChange}
                                        onHeaderMediaFileChange={handleHeaderMediaFileChange}
                                    />
                                )}

                                {/* Body */}
                                <TemplateBodySection
                                    styles={styles}
                                    body={builderData.body}
                                    templateType={builderData.templateType}
                                    saveError={saveError}
                                    bodyCharCount={bodyCharCount}
                                    emojiPickerOpen={emojiPickerOpen}
                                    variableKeys={variableKeys}
                                    variableValues={variableValues}
                                    onBodyChange={(value) => {
                                        setBuilderData((p) => ({ ...p, body: value.slice(0, 1024) }));
                                        if (saveError === 'Template body is required.') setSaveError('');
                                    }}
                                    onToggleEmoji={() => setEmojiPickerOpen(!emojiPickerOpen)}
                                    onEmojiSelect={handleEmojiSelect}
                                    onBold={handleBold}
                                    onItalic={handleItalic}
                                    onStrikethrough={handleStrikethrough}
                                    onCode={handleCode}
                                    onAddVariablePlaceholder={addVariablePlaceholder}
                                    onVariableValueChange={(key, value) => setVariableValues((p) => ({ ...p, [key]: value }))}
                                />

                                {/* Carousel Cards Section */}
                                {builderData.templateType === 'Carousel' && (
                                    <TemplateCarouselSection
                                        styles={styles}
                                        mediaConfig={MEDIA_CONFIG}
                                        carouselCards={carouselCards}
                                        activeCardIndex={activeCardIndex}
                                        saveError={saveError}
                                        isCardButtonMenuOpen={isCardButtonMenuOpen}
                                        getButtonMenuOptions={getButtonMenuOptions}
                                        onSetActiveCardIndex={setActiveCardIndex}
                                        onAddCarouselCard={addCarouselCard}
                                        onRemoveCarouselCard={removeCarouselCard}
                                        onCardHeaderTypeChange={handleCardHeaderTypeChange}
                                        onCardFileChange={handleCardFileChange}
                                        onCardBodyChange={handleCardBodyChange}
                                        onToggleCardButtonMenu={() => setIsCardButtonMenuOpen((prev) => !prev)}
                                        onAddCardButton={addCardButton}
                                        onUpdateCardButton={handleCardButtonUpdate}
                                        onRemoveCardButton={handleCardButtonRemove}
                                    />
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
                                        <TemplateButtonSection
                                            title={<>
                                                Buttons <span className={styles.optionalBadge}>Optional</span>
                                            </>}
                                            subtitle="Create buttons that let customers respond to your message or take action."
                                            buttons={builderData.buttons}
                                            styles={styles}
                                            isMenuOpen={isMainButtonMenuOpen}
                                            menuOptions={getButtonMenuOptions(builderData.buttons)}
                                            onToggleMenu={() => setIsMainButtonMenuOpen((prev) => !prev)}
                                            onAddButton={addMainButton}
                                            onUpdateButton={handleMainButtonUpdate}
                                            onRemoveButton={handleMainButtonRemove}
                                        />
                                    </Paper>
                                )}
                            </Grid>

                            {/* Right: preview */}
                            <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
                                <div className={styles.previewShell}>
                                    <MessagePreview
                                        headerType={builderData.headerType}
                                        headerText={builderData.headerText}
                                        headerTextExample={builderData.headerTextExample}
                                        headerMedia={headerMedia}
                                        previewImageUrl={previewImageUrl}
                                        previewVideoUrl={previewVideoUrl}
                                        body={builderData.body}
                                        footer={builderData.footer}
                                        buttons={builderData.buttons}
                                        templateType={builderData.templateType}
                                        carouselCards={carouselCards}
                                        variableValues={variableValues}
                                        showEmptyHint={true}
                                    />
                                </div>
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

                {saveProcess.active && (
                    <div className={styles.saveOverlay}>
                        <div className={styles.saveOverlayCard}>
                            <CircularProgress size={30} thickness={4.4} />
                            <Typography className={styles.saveOverlayTitle}>{saveProcess.title}</Typography>
                            <Typography className={styles.saveOverlayMessage}>{saveProcess.message || 'Please wait...'}</Typography>
                            {typeof saveProcess.progress === 'number' && (
                                <>
                                    <div className={styles.saveOverlayProgressTrack}>
                                        <div className={styles.saveOverlayProgressBar} style={{ width: `${Math.max(0, Math.min(100, saveProcess.progress))}%` }} />
                                    </div>
                                    <Typography className={styles.saveOverlayProgressText}>{Math.max(0, Math.min(100, saveProcess.progress))}% completed</Typography>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Box>
        </Box>
    );
};

export default CreateTemplatePage;
