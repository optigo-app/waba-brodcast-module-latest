import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { RefreshCw } from 'lucide-react';
import TemplateVariableInput from '../TemplateVariableInput/TemplateVariableInput';
import { sendTemplate } from '../../../API/TemplateList/SendTemplate';
import toast from 'react-hot-toast';
import styles from './SendTemplateDialog.module.scss';

const phoneInputStyles = {
    input: {
        width: '100%',
        height: '42px',
        fontSize: '0.9rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        '&:focus': {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
        },
    },
    button: {
        border: 'none',
        background: 'transparent',
        padding: '0 8px',
    },
    dropdown: {
        zIndex: 9999,
    },
    search: {
        width: '100%',
        marginBottom: '8px',
    },
    container: {
        width: '100%',
    },
};

const SendTemplateDialog = ({ open, onClose, template, userToken }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [templateVariables, setTemplateVariables] = useState({});
    const [variableErrors, setVariableErrors] = useState({});
    const [sendLoading, setSendLoading] = useState(false);

    const handlePhoneChange = (value) => {
        setPhoneNumber(value);
        setPhoneError('');
    };

    const extractTemplateVariables = (tmpl) => {
        if (!tmpl) return [];
        try {
            const components = JSON.parse(tmpl.Components || '[]');
            const bodyComponent = components.find(c => c.type === 'BODY');
            if (bodyComponent && bodyComponent.text) {
                const matches = bodyComponent.text.match(/\{\{\d+\}\}/g);
                if (matches) {
                    return matches.map(m => parseInt(m.match(/\d+/)[0]));
                }
            }
        } catch (error) {
            console.error('Error extracting variables:', error);
        }
        return [];
    };

    const isCarouselTemplate = (tmpl) => {
        if (!tmpl) return false;
        try {
            const components = JSON.parse(tmpl.Components || '[]');
            return components.some(c => c.type === 'CAROUSEL');
        } catch (error) {
            console.error('Error checking carousel:', error);
            return false;
        }
    };

    const getHeaderType = (tmpl) => {
        if (!tmpl) return 'None';
        try {
            const components = JSON.parse(tmpl.Components || '[]');
            const header = components.find(c => c.type === 'HEADER');
            return header?.format || 'None';
        } catch {
            return 'None';
        }
    };

    const getTemplateImageUrl = (tmpl) => {
        if (!tmpl) return null;
        try {
            const components = JSON.parse(tmpl.Components || '[]');
            const header = components.find(c => c.type === 'HEADER');
            if (header && header.example) {
                return header.example.header_handle?.[0] || null;
            }
        } catch {
            return null;
        }
        return null;
    };

    const getMediaUrls = (tmpl) => {
        if (!tmpl) return [];
        try {
            if (Array.isArray(tmpl.MediaData)) {
                return tmpl.MediaData.filter(Boolean);
            }
            if (typeof tmpl.MediaData === 'string' && tmpl.MediaData.trim()) {
                const parsed = JSON.parse(tmpl.MediaData);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            }
        } catch (error) {
            console.error('Error parsing media data:', error);
        }
        return [];
    };

    const handleClose = () => {
        onClose();
        setPhoneNumber('');
        setPhoneError('');
        setTemplateVariables({});
        setVariableErrors({});
    };

    const handleSend = async () => {
        // Validate mobile number
        if (!phoneNumber) {
            setPhoneError('Mobile number is required');
            return;
        }

        // Validate template variables (only for non-carousel templates)
        if (!isCarouselTemplate(template)) {
            const vars = extractTemplateVariables(template);
            const errors = {};
            vars.forEach(varNum => {
                if (!templateVariables[varNum] || templateVariables[varNum].trim() === '') {
                    errors[varNum] = `Variable {{${varNum}}} is required`;
                }
            });

            if (Object.keys(errors).length > 0) {
                setVariableErrors(errors);
                toast.error('Please fill in all required template variables');
                return;
            }
        }

        setVariableErrors({});
        setSendLoading(true);

        // Parse phone number - PhoneInput returns full number with country code
        const phoneNo = phoneNumber.replace(/\D/g, '');

        // Build components with parameters
        let components = [];
        try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }
        const mediaUrls = getMediaUrls(template);

        // Build components array for API
        const templateComponents = [];

        // Check if it's a carousel template
        if (isCarouselTemplate(template)) {
            const carouselComponent = components.find(c => c.type === 'CAROUSEL');
            if (carouselComponent && carouselComponent.cards) {
                const carouselCards = carouselComponent.cards.map((card, index) => {
                    const cardComponents = [];
                    const mediaUrlFromStore = mediaUrls[index];

                    // Extract header image from each card
                    const cardHeader = card.components?.find(c => c.type === 'HEADER');
                    const fallbackHeaderUrl = cardHeader?.example?.header_handle?.[0];
                    const resolvedHeaderUrl = mediaUrlFromStore || fallbackHeaderUrl;

                    if (resolvedHeaderUrl) {
                        cardComponents.push({
                            type: 'header',
                            parameters: [
                                {
                                    type: 'image',
                                    image: {
                                        link: resolvedHeaderUrl
                                    }
                                }
                            ]
                        });
                    }

                    return {
                        card_index: index,
                        components: cardComponents
                    };
                });

                templateComponents.push({
                    type: 'carousel',
                    cards: carouselCards
                });
            }
        } else {
            // Regular template handling
            const headerType = getHeaderType(template);
            const templateImageUrl = mediaUrls[0] || getTemplateImageUrl(template);

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
            const parameters = [];
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
        }

        // Build the API payload
        const payload = {
            phoneNo: phoneNo,
            appuserid: userToken?.userId || '',
            customerId: '',
            type: 'template',
            template: {
                name: template.TemplateName,
                language: {
                    code: template?.Language || 'en'
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
                    handleClose();
                    return 'Template sent successfully';
                } else {
                    throw new Error(result.error || 'Failed to send template');
                }
            }).finally(() => {
                setSendLoading(false);
            }),
            {
                loading: 'Sending template...',
                success: 'Template sent successfully',
                error: (err) => {
                    setSendLoading(false);
                    return err.message || 'Failed to send template';
                }
            }
        );
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    padding: '8px',
                    width: '100%',
                    maxWidth: '500px'
                }
            }}
        >
            <DialogTitle style={{ fontWeight: 700, color: '#0f172a', paddingBottom: '8px' }}>
                Send Template
            </DialogTitle>
            <DialogContent>
                <p style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', marginBottom: '1.5rem', marginTop: 0 }}>
                    Enter the recipient's mobile number to send the template <strong>{template?.TemplateName}</strong>.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>
                        Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <PhoneInput
                        country={'in'}
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        enableSearch={true}
                        countryCodeEditable={true}
                        disabled={sendLoading}
                        inputStyle={{
                            ...phoneInputStyles.input,
                            borderColor: phoneError ? '#ef4444' : '#e2e8f0',
                            boxShadow: phoneError ? '0 0 0 1px #ef4444' : 'none',
                            opacity: sendLoading ? 0.6 : 1
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
                {extractTemplateVariables(template).length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.75rem', display: 'block' }}>
                            Template Variables <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {extractTemplateVariables(template).map(varNum => (
                                <div key={varNum}>
                                    <TemplateVariableInput
                                        label={`Variable {{${varNum}}}`}
                                        value={templateVariables[varNum] || ''}
                                        onChange={(val) => {
                                            setTemplateVariables(prev => ({ ...prev, [varNum]: val }));
                                            if (variableErrors[varNum]) {
                                                setVariableErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next[varNum];
                                                    return next;
                                                });
                                            }
                                        }}
                                        showDynamic={false}
                                        error={!!variableErrors[varNum]}
                                        disabled={sendLoading}
                                    />
                                    {variableErrors[varNum] && (
                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                            {variableErrors[varNum]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>

            <DialogActions style={{ padding: '12px 24px 16px' }}>
                <Button
                    onClick={handleClose}
                    color="inherit"
                    className='secondaryBtnClassname'
                    disabled={sendLoading}
                >
                    Close
                </Button>
                <Button
                    onClick={handleSend}
                    variant="contained"
                    color="primary"
                    className='buttonClassname'
                    disabled={sendLoading}
                    startIcon={sendLoading ? <RefreshCw size={16} className={styles.spinning} /> : null}
                >
                    {sendLoading ? 'Sending...' : 'Send'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendTemplateDialog;
