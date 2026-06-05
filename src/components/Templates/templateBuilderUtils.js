export const MEDIA_CONFIG = {
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

export const normalizeTemplateName = (value = '') => value.replace(/ /g, '_');

export const validateMediaFile = ({
    file,
    mediaType,
    mediaConfig,
    includeMaxSizeLabel = false,
}) => {
    if (!file) {
        return { isValid: true, error: '' };
    }

    const config = mediaConfig?.[mediaType];
    if (!config) {
        return { isValid: true, error: '' };
    }

    if (!config.mimes.includes(file.type)) {
        return {
            isValid: false,
            error: `Unsupported file type. Please upload a valid ${config.extensions}.`
        };
    }

    if (file.size > config.maxSize) {
        return {
            isValid: false,
            error: includeMaxSizeLabel
                ? `File is too large. Max size is ${config.maxSizeLabel}.`
                : 'File is too large.'
        };
    }

    return { isValid: true, error: '' };
};
