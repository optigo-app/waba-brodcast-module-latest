import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { ArrowLeft, Users, Phone, MoreVertical, CheckCheck, ChevronLeft, ChevronRight, FileText, Image, Video } from 'lucide-react';
import styles from './MessagePreview.module.scss';
import { previewBg } from '../../utils/globalFunc';

const MessagePreview = ({
    headerType = 'None',
    headerText = '',
    headerTextExample = '',
    headerMedia = null,
    previewImageUrl = '',
    previewVideoUrl = '',
    body = '',
    footer = '',
    buttons = [],
    templateType = 'Interactive',
    carouselCards = [],
    variableValues = {},
    showEmptyHint = true
}) => {
    const currentPreviewTime = useMemo(
        () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        []
    );

    const [previewCardIndex, setPreviewCardIndex] = React.useState(0);

    const previewBody = useMemo(() =>
        (body || '').replace(/\{\{(\d+)\}\}/g, (_, k) =>
            variableValues[k]?.trim() ? variableValues[k] : `{{${k}}}`
        ), [body, variableValues]);

    const finalPreviewImageUrl = previewImageUrl || (headerMedia?.mediaType === 'image' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : headerMedia.mediaUrl) : '');
    const finalPreviewVideoUrl = previewVideoUrl || (headerMedia?.mediaType === 'video' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : headerMedia.mediaUrl) : '');
    const previewDocumentLabel = useMemo(() => {
        if (headerType !== 'Media' || headerMedia?.mediaType !== 'document') return '';
        if (headerMedia?.file?.name) return headerMedia.file.name;
        if (headerMedia?.mediaUrl?.trim()) {
            try {
                const u = new URL(headerMedia.mediaUrl.trim());
                return u.pathname.split('/').filter(Boolean).pop() || u.hostname;
            } catch { return headerMedia.mediaUrl.trim(); }
        }
        return '';
    }, [headerType, headerMedia]);

    const hasPreviewMessage =
        Boolean(previewImageUrl) || Boolean(previewVideoUrl) || Boolean(previewDocumentLabel) ||
        Boolean(headerType === 'Text' && headerText?.trim()) ||
        Boolean(previewBody.trim()) || Boolean(footer?.trim()) ||
        buttons.length > 0 ||
        (templateType === 'Carousel' && carouselCards.length > 0);

    return (
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
                            {templateType === 'Carousel' ? (
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
                                    {headerType === 'Text' && headerText && (
                                        <Typography className={styles.previewHeaderText}>
                                            {headerText.replace(/\{\{1\}\}/g, headerTextExample || '{{1}}')}
                                        </Typography>
                                    )}
                                    {finalPreviewImageUrl && (
                                        <img src={finalPreviewImageUrl} alt="Header" className={styles.previewHeaderImage} />
                                    )}
                                    {finalPreviewVideoUrl && (
                                        <video
                                            key={finalPreviewVideoUrl}
                                            src={finalPreviewVideoUrl}
                                            className={styles.previewHeaderVideo}
                                            controls playsInline preload="metadata"
                                        />
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
                                    {footer && (
                                        <Typography className={styles.previewFooterText}>{footer}</Typography>
                                    )}
                                    {buttons.length > 0 && (
                                        <div className={styles.previewButtons}>
                                            {buttons.map((btn) => (
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
                        showEmptyHint && (
                            <div className={styles.previewEmptyHint}>
                                Preview will appear here
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(MessagePreview);
