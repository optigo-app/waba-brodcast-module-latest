import React from 'react';
import { Paper, Typography, Button, TextField } from '@mui/material';
import { Plus, Image, Video, Paperclip } from 'lucide-react';
import { isOwnServerUrl } from '../../utils/mediaUtils';
import imagePlaceholder from '../../assets/imagePlaceholder.png';
import TemplateButtonSection from './TemplateButtonSection';
import TemplateBodyInput from './TemplateBodyInput';

const TemplateCarouselSection = ({
    styles,
    mediaConfig,
    carouselCards,
    activeCardIndex,
    saveError,
    isCardButtonMenuOpen,
    cardEmojiPickerOpen,
    getButtonMenuOptions,
    onSetActiveCardIndex,
    onAddCarouselCard,
    onRemoveCarouselCard,
    onCardHeaderTypeChange,
    onCardFileChange,
    onCardBodyChange,
    onToggleCardEmoji,
    onCardEmojiSelect,
    onToggleCardButtonMenu,
    onAddCardButton,
    onUpdateCardButton,
    onRemoveCardButton,
}) => {
    const activeCard = carouselCards[activeCardIndex];

    return (
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
                            onClick={() => onSetActiveCardIndex(idx)}
                        >
                            Card {idx + 1}
                        </button>
                    ))}
                    {carouselCards.length < 10 && (
                        <button type="button" className={styles.addCardTab} onClick={onAddCarouselCard}>
                            <Plus size={14} /> Add Card
                        </button>
                    )}
                </div>

                {activeCard && (
                    <div className={styles.cardEditorPanel}>
                        <div className={styles.cardEditorHeader}>
                            <Typography className={styles.cardTitle}>Card {activeCardIndex + 1} Settings</Typography>
                            <Button
                                size="small"
                                className={styles.cardDeleteBtn}
                                onClick={() => onRemoveCarouselCard(activeCardIndex)}
                                disabled={carouselCards.length <= 2}
                            >
                                Delete Card
                            </Button>
                        </div>

                        <div className={styles.mediaPickerWrap}>
                            <Typography className={styles.fieldLabel}>Card Header Media<span style={{ color: 'red' }}>*</span></Typography>
                            <div className={styles.mediaIconGrid}>
                                {[
                                    { type: 'image', Icon: Image, label: 'Image' },
                                    { type: 'video', Icon: Video, label: 'Video' },
                                ].map(({ type, Icon, label }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`${styles.mediaIconCard} ${activeCard.header.mediaType === type ? styles.mediaIconCardActive : ''}`}
                                        onClick={() => onCardHeaderTypeChange(activeCardIndex, type)}
                                    >
                                        <Icon size={24} className={styles.mediaIconSvg} />
                                        <span className={styles.mediaIconLabel}>{label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.mediaSampleBox}>
                                {!activeCard.header.file && activeCard.header.mediaUrl && isOwnServerUrl(activeCard.header.mediaUrl) && (
                                    <div className={styles.existingMediaRow}>
                                        {activeCard.header.mediaType === 'image' && (
                                            <img
                                                src={activeCard.header.mediaUrl}
                                                alt="Current card media"
                                                className={styles.existingMediaThumb}
                                            />
                                        )}
                                        {activeCard.header.mediaType === 'video' && (
                                            <video
                                                src={activeCard.header.mediaUrl}
                                                className={styles.existingMediaThumb}
                                                controls
                                                playsInline
                                                preload="metadata"
                                            />
                                        )}
                                        <Typography className={styles.existingMediaLabel}>
                                            Current media (from saved template)
                                        </Typography>
                                    </div>
                                )}
                                <div className={styles.mediaSampleActions}>
                                    <Button
                                        component="label"
                                        className={styles.mediaUploadBtn}
                                        startIcon={<Paperclip size={14} />}
                                    >
                                        {activeCard.header.mediaUrl && !activeCard.header.file ? 'Upload file' : `Choose ${activeCard.header.mediaType === 'image' ? 'JPG/PNG' : 'MP4'} file`}
                                        <input
                                            hidden
                                            type="file"
                                            accept={mediaConfig?.[activeCard.header.mediaType]?.mimes?.join(',')}
                                            onChange={(e) => onCardFileChange(activeCardIndex, e)}
                                        />
                                    </Button>
                                    {activeCard.header.file && (
                                        <Typography className={styles.mediaFileName}>{activeCard.header.file.name}</Typography>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardBodySection}>
                            <div className={styles.sectionHeaderRow}>
                                <Typography className={styles.variableTitle}>Card Body</Typography>
                            </div>
                            <TemplateBodyInput
                                value={activeCard.body}
                                onChange={(value) => onCardBodyChange(activeCardIndex, value)}
                                placeholder="Enter card description..."
                                minRows={2}
                                maxRows={4}
                                maxLength={160}
                                error={saveError === `Card ${activeCardIndex + 1} body is required.`}
                                helperText={saveError === `Card ${activeCardIndex + 1} body is required.` ? 'This field is required' : ''}
                                showCharCounter={true}
                                showFormatting={true}
                                showEmoji={true}
                                showVariableButton={false}
                                emojiPickerOpen={cardEmojiPickerOpen}
                                onToggleEmoji={onToggleCardEmoji}
                                onEmojiSelect={onCardEmojiSelect}
                                styles={styles}
                            />
                        </div>

                        <div className={styles.cardButtonsSection}>
                            <div className={styles.sectionHeaderRow}>
                                <Typography className={styles.variableTitle}>Card Buttons<span style={{ color: 'red' }}>*</span></Typography>
                            </div>
                            <Typography className={styles.sectionSubtitle} sx={{ mb: 1 }}>
                                Button type/order is synced across all cards. You can edit button text, URL and phone number per card.
                            </Typography>
                            <TemplateButtonSection
                                buttons={activeCard.buttons || []}
                                styles={styles}
                                isMenuOpen={isCardButtonMenuOpen}
                                menuOptions={getButtonMenuOptions(activeCard.buttons, 2, { maxQuickReply: 1, maxPhone: 1, maxUrl: 1 })}
                                buttonLimits={{ maxQuickReply: 1, maxPhone: 1, maxUrl: 1 }}
                                addButtonDisabled={activeCard.buttons.length >= 2}
                                addButtonFullWidth={true}
                                isCarouselContext={true}
                                onToggleMenu={onToggleCardButtonMenu}
                                onAddButton={(type) => onAddCardButton(activeCardIndex, type)}
                                onUpdateButton={(btn, idx, patch) => onUpdateCardButton(activeCardIndex, btn, idx, patch)}
                                onRemoveButton={(btn, idx) => onRemoveCardButton(activeCardIndex, btn, idx)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Paper>
    );
};

export default TemplateCarouselSection;
