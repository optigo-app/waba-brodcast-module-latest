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
