/**
 * Reusable utility for extracting template preview data
 * Used by Templates.js and SendTemplateDialog.js
 */

export const extractTemplatePreviewData = (template) => {
    if (!template?.Components) return null;

    try {
        const components = typeof template.Components === 'string'
            ? JSON.parse(template.Components)
            : template.Components;

        let mediaUrls = [];
        try {
            if (Array.isArray(template.MediaData)) {
                mediaUrls = template.MediaData.filter(Boolean);
            } else if (typeof template.MediaData === 'string' && template.MediaData.trim()) {
                const parsedMedia = JSON.parse(template.MediaData);
                mediaUrls = Array.isArray(parsedMedia) ? parsedMedia.filter(Boolean) : [];
            }
        } catch (error) {
            console.error('Error parsing template media:', error);
        }

        const body = components.find((c) => String(c?.type || '').toUpperCase() === 'BODY');
        const footer = components.find((c) => String(c?.type || '').toUpperCase() === 'FOOTER');
        const buttons = components.find((c) => String(c?.type || '').toUpperCase() === 'BUTTONS');
        const header = components.find((c) => String(c?.type || '').toUpperCase() === 'HEADER');
        const carousel = components.find((c) => String(c?.type || '').toUpperCase() === 'CAROUSEL');

        if (Array.isArray(carousel?.cards)) {
            const carouselCards = carousel.cards.map((card, idx) => {
                const cardComponents = card?.components || [];
                const cardHeader = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'HEADER');
                const cardBody = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'BODY');
                const cardButtons = cardComponents.find((item) => String(item?.type || '').toUpperCase() === 'BUTTONS');
                const existingHandle = cardHeader?.example?.header_handle?.[0] || '';

                return {
                    id: idx,
                    header: {
                        mediaType: (cardHeader?.format || 'IMAGE').toLowerCase(),
                        file: null,
                        mediaUrl: mediaUrls[idx] || existingHandle,
                        existingHandle: existingHandle,
                    },
                    body: cardBody?.text || '',
                    buttons: (cardButtons?.buttons || []).map((btn, btnIdx) => ({
                        id: `${idx}-${btnIdx}`,
                        type: btn?.type,
                        text: btn?.text || '',
                    })),
                };
            });

            return {
                headerType: 'None',
                headerText: '',
                headerTextExample: '',
                headerMedia: null,
                footer: '',
                buttons: [],
                templateType: 'Carousel',
                carouselCards: carouselCards,
                body: body?.text || '',
                variableValues: {},
            };
        }

        const mediaType = (header?.format || '').toLowerCase();
        const existingHandle = header?.example?.header_handle?.[0] || '';
        const mediaUrl = mediaUrls[0] || existingHandle;

        const headerType = header
            ? (mediaType === 'text' ? 'Text' : 'Media')
            : 'None';

        return {
            headerType: headerType,
            headerText: header?.text || '',
            headerTextExample: header?.example?.header_text?.[0] || '',
            headerMedia: {
                mediaType: mediaType || 'image',
                file: null,
                mediaUrl,
                existingHandle,
            },
            body: body?.text || '',
            footer: footer?.text || '',
            buttons: (buttons?.buttons || []).map((btn, idx) => ({
                id: idx,
                type: btn?.type,
                text: btn?.text || '',
            })),
            templateType: 'Interactive',
            carouselCards: [],
            variableValues: {},
        };
    } catch (error) {
        console.error('Error extracting template preview data:', error);
        return null;
    }
};
