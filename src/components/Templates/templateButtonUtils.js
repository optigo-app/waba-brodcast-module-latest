export const createButtonConfig = (type) => {
    const base = { id: Date.now() + Math.floor(Math.random() * 1000), type, text: '' };

    if (type === 'PHONE_NUMBER') {
        return { ...base, text: 'Call Now', phone_number: '' };
    }

    if (type === 'URL') {
        return {
            ...base,
            text: 'Visit Website',
            urlType: 'STATIC',
            url: '',
            example: ''
        };
    }

    return { ...base, text: '' };
};

export const getButtonTypeCounts = (buttons = []) => {
    const safeButtons = Array.isArray(buttons) ? buttons : [];
    return {
        quickReply: safeButtons.filter((btn) => btn.type === 'QUICK_REPLY').length,
        phone: safeButtons.filter((btn) => btn.type === 'PHONE_NUMBER').length,
        url: safeButtons.filter((btn) => btn.type === 'URL').length,
        total: safeButtons.length,
    };
};

export const getButtonMenuOptions = (buttons = [], maxButtons = Infinity, limits = {}) => {
    const counts = getButtonTypeCounts(buttons);
    const hasReachedMax = counts.total >= maxButtons;
    const {
        maxQuickReply = 6,
        maxPhone = 1,
        maxUrl = 2,
    } = limits;

    return [
        {
            section: 'Quick reply buttons',
            items: [
                {
                    key: 'QUICK_REPLY',
                    label: 'Custom',
                    disabled: hasReachedMax || counts.quickReply >= maxQuickReply,
                },
            ],
        },
        {
            section: 'Call-to-action buttons',
            items: [
                {
                    key: 'PHONE_NUMBER',
                    label: 'Call Phone number',
                    disabled: hasReachedMax || counts.phone >= maxPhone,
                },
                {
                    key: 'URL',
                    label: 'Visit website',
                    disabled: hasReachedMax || counts.url >= maxUrl,
                },
            ],
        },
    ];
};

export const mapButtonToApi = (btn) => {
    if (btn.type === 'PHONE_NUMBER') {
        return {
            type: 'PHONE_NUMBER',
            text: (btn.text || '').trim(),
            phone_number: (btn.phone_number || '').trim(),
        };
    }

    if (btn.type === 'URL') {
        return {
            type: 'URL',
            text: (btn.text || '').trim(),
            url: (btn.url || '').trim(),
        };
    }

    return {
        type: 'QUICK_REPLY',
        text: (btn.text || '').trim(),
    };
};

export const mapExistingApiButtonToEditor = (button, index = 0) => ({
    id: Date.now() + index,
    type: button.type || 'QUICK_REPLY',
    text: button.text || '',
    phone_number: button.phone_number || '',
    urlType: button.type === 'URL' && /\{\{\d+\}\}/.test(button.url || '') ? 'DYNAMIC' : 'STATIC',
    url: button.url || '',
    example: '',
});
