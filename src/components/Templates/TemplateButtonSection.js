import React from 'react';
import { Button, TextField, Typography, InputAdornment, Menu, MenuItem, Divider, ListSubheader, IconButton, Tooltip } from '@mui/material';
import { Plus, X, MousePointerClick, Phone, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const phoneInputStyles = {
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
        marginBottom: '0.5rem',
        width: '100%'
    }
};

const TemplateButtonSection = ({
    title,
    subtitle,
    buttons = [],
    styles,
    isMenuOpen,
    menuOptions = [],
    addButtonDisabled = false,
    addButtonFullWidth = false,
    isCarouselContext = false,
    onToggleMenu,
    onAddButton,
    onUpdateButton,
    onRemoveButton,
}) => {
    const addButtonRef = React.useRef(null);
    const quickReplyButtons = buttons.filter((btn) => btn.type === 'QUICK_REPLY');
    const otherButtons = buttons.filter((btn) => btn.type !== 'QUICK_REPLY');

    const hasQuickReply = quickReplyButtons.length > 0;
    const hasPhone = buttons.some((btn) => btn.type === 'PHONE_NUMBER');
    const hasUrl = buttons.some((btn) => btn.type === 'URL');

    const handleCloseMenu = () => {
        if (isMenuOpen && onToggleMenu) {
            onToggleMenu();
        }
    };

    const handleAddButton = (type) => {
        onAddButton(type);
    };

    return (
        <>
            {(title || subtitle) && (
                <>
                    {title && <Typography className={styles.sectionTitle}>{title}</Typography>}
                    {subtitle && <Typography className={styles.sectionSubtitle}>{subtitle}</Typography>}
                </>
            )}

            <div className={styles.addButtonDropdownWrap}>
                <div className={styles.quickAddButtons}>
                    <Tooltip title={hasQuickReply ? "Quick Reply already added" : "Add Quick Reply Button"} arrow>
                        <Button
                            className={styles.quickAddBtn}
                            onClick={() => handleAddButton('QUICK_REPLY')}
                            disabled={addButtonDisabled || hasQuickReply}
                            startIcon={<MousePointerClick size={14} />}
                        >
                            Quick Reply
                        </Button>
                    </Tooltip>
                    <Tooltip title={hasPhone ? "Call button already added" : "Add Call Phone Number Button"} arrow>
                        <Button
                            className={styles.quickAddBtn}
                            onClick={() => handleAddButton('PHONE_NUMBER')}
                            disabled={addButtonDisabled || hasPhone}
                            startIcon={<Phone size={14} />}
                        >
                            Call
                        </Button>
                    </Tooltip>
                    <Tooltip title={hasUrl ? "Website button already added" : "Add Visit Website Button"} arrow>
                        <Button
                            className={styles.quickAddBtn}
                            onClick={() => handleAddButton('URL')}
                            disabled={addButtonDisabled || hasUrl}
                            startIcon={<Globe size={14} />}
                        >
                            Website
                        </Button>
                    </Tooltip>
                    <Tooltip title="More Button Options" arrow>
                        <Button
                            ref={addButtonRef}
                            className={`${styles.quickAddBtn} ${styles.moreBtn}`}
                            onClick={onToggleMenu}
                            disabled={addButtonDisabled}
                            startIcon={<Plus size={14} />}
                        >
                            More
                        </Button>
                    </Tooltip>
                </div>

                <Menu
                    anchorEl={addButtonRef.current}
                    open={Boolean(isMenuOpen)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            minWidth: 280,
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)'
                        }
                    }}
                >
                    {menuOptions.map((section, sectionIdx) => (
                        <div key={section.section}>
                            <ListSubheader sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', lineHeight: 1.8 }}>
                                {section.section}
                            </ListSubheader>
                            {section.items.map((item) => {
                                let itemDisabled = item.disabled;
                                if (item.key === 'QUICK_REPLY' && hasQuickReply) itemDisabled = true;
                                if (item.key === 'PHONE_NUMBER' && hasPhone) itemDisabled = true;
                                if (item.key === 'URL' && hasUrl) itemDisabled = true;
                                return (
                                    <MenuItem
                                        key={item.key}
                                        disabled={itemDisabled}
                                        onClick={() => handleAddButton(item.key)}
                                        sx={{ fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        {item.label}
                                    </MenuItem>
                                );
                            })}
                            {sectionIdx < menuOptions.length - 1 && <Divider sx={{ my: 0.5 }} />}
                        </div>
                    ))}
                </Menu>
            </div>

            <div className={styles.buttonList}>
                {quickReplyButtons.length > 0 && (
                    <div
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 12,
                            background: '#ffffff'
                        }}
                    >
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 1 }}>
                            Quick Reply
                        </Typography>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {quickReplyButtons.map((btn) => {
                                const idx = buttons.findIndex((b) => b.id === btn.id);
                                return (
                                    <div
                                        key={btn.id || idx}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'stretch',
                                            width: '100%'
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 10,
                                                padding: '10px 12px',
                                                position: 'relative'
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={() => onRemoveButton(btn, idx)}
                                                sx={{
                                                    position: 'absolute',
                                                    right: 8,
                                                    top: 6,
                                                    color: 'var(--color-text-secondary)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(249, 115, 22, 0.12)'
                                                    }
                                                }}
                                                title="Delete"
                                            >
                                                <X size={16} />
                                            </IconButton>

                                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', mb: 0.7 }}>
                                                Button Text
                                            </Typography>

                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={btn.text || ''}
                                                onChange={(e) => onUpdateButton(btn, idx, { text: e.target.value.slice(0, 25) })}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <span className={styles.inlineCounter}>{(btn.text || '').length}/25</span>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {otherButtons.length > 0 && (
                    <div
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 12,
                            background: '#ffffff'
                        }}
                    >
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 1, display: 'flex', alignItems: 'center', gap: 0.7 }}>
                            <MousePointerClick size={14} />
                            Call-to-action Buttons
                        </Typography>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {otherButtons.map((btn) => {
                                const idx = buttons.findIndex((b) => b.id === btn.id);
                                return (
                                    <div className={styles.buttonConfigCard} key={btn.id || idx}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveButton(btn, idx)}
                                            sx={{
                                                position: 'absolute',
                                                right: 8,
                                                top: 6,
                                                color: 'var(--color-text-secondary)',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(249, 115, 22, 0.12)'
                                                }
                                            }}
                                            title="Delete"
                                        >
                                            <X size={16} />
                                        </IconButton>

                                        <div className={styles.buttonConfigRow}>
                                <div>
                                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', mb: 0.7 }}>
                                        Button Text
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={btn.text || ''}
                                        placeholder={btn.type === 'URL' ? 'Visit Shop' : btn.type === 'PHONE_NUMBER' ? 'Call Now' : 'Custom'}
                                        onChange={(e) => onUpdateButton(btn, idx, { text: e.target.value.slice(0, 25) })}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <span className={styles.inlineCounter}>{(btn.text || '').length}/25</span>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </div>


                                {btn.type === 'PHONE_NUMBER' && (
                                    <div style={{ minWidth: '70%', flex: isCarouselContext ? 1 : 'unset' }}>
                                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', mb: 0.7 }}>
                                            Phone Number
                                        </Typography>
                                        <PhoneInput
                                            country={'in'}
                                            value={btn.phone_number || ''}
                                            onChange={(value) => onUpdateButton(btn, idx, { phone_number: value })}
                                            enableSearch={true}
                                            countryCodeEditable={true}
                                            inputStyle={phoneInputStyles.input}
                                            buttonStyle={phoneInputStyles.button}
                                            dropdownStyle={phoneInputStyles.dropdown}
                                            searchStyle={phoneInputStyles.search}
                                            containerStyle={phoneInputStyles.container}
                                        />
                                    </div>
                                )}

                                {btn.type === 'URL' && (
                                    <div style={{ minWidth: 380, width: '70%' }}>
                                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', mb: 0.7 }}>
                                            Website URL
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={btn.url || ''}
                                            onChange={(e) => onUpdateButton(btn, idx, { url: e.target.value.slice(0, 2000) })}
                                            placeholder="https://business.whatsapp.com/products/{{1}}"
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <span className={styles.inlineCounter}>{(btn.url || '').length}/2000</span>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </div>
                                )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default TemplateButtonSection;
