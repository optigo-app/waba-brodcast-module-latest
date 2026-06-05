import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { ArrowLeft, Users, Phone, MoreVertical, CheckCheck, ChevronLeft, ChevronRight, FileText, Image, Video, ExternalLink, PhoneCall, Reply } from 'lucide-react';
import styles from './MessagePreview.module.scss';
import { previewBg } from '../../utils/globalFunc';
import { isOwnServerUrl } from '../../utils/mediaUtils';
import imagePlaceholder from '../../assets/imagePlaceholder.png';

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
    const [videoError, setVideoError] = React.useState(false);

    // Reset video error when URL changes
    React.useEffect(() => {
        setVideoError(false);
    }, [previewVideoUrl, headerMedia?.mediaUrl]);

    const handleImageFallback = (event) => {
        const img = event?.currentTarget;
        if (!img) return;
        img.onerror = null;
        img.src = imagePlaceholder;
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    const previewBody = useMemo(() =>
        (body || '').replace(/\{\{(\d+)\}\}/g, (_, k) => {
            const value = variableValues[k]?.trim();
            if (value) {
                return `<span style="color: #000; font-weight: 600; background: rgba(0, 0, 0, 0.05); padding: 0 2px; border-radius: 2px;">${value}</span>`;
            }
            return `{{${k}}}`;
        }), [body, variableValues]);

    const finalPreviewImageUrl = previewImageUrl || (headerType === 'Media' && headerMedia?.mediaType === 'image' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : (headerMedia.mediaUrl && isOwnServerUrl(headerMedia.mediaUrl) ? headerMedia.mediaUrl : imagePlaceholder)) : '');
    const finalPreviewVideoUrl = previewVideoUrl || (headerType === 'Media' && headerMedia?.mediaType === 'video' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : (headerMedia.mediaUrl || '')) : '');
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
                        <div className={`${styles.previewBubbleWrap} ${templateType === 'Carousel' ? styles.previewBubbleWrapCarousel : ''}`}>
                            {templateType === 'Carousel' ? (
                                <div className={styles.previewCarouselWrap}>
                                    {/* Top level body for carousel */}
                                    {previewBody.trim() && (
                                        <div className={styles.previewBubble}>
                                            <Typography 
                                                className={styles.previewBodyText}
                                                dangerouslySetInnerHTML={{ __html: previewBody }}
                                            />
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
                                                        {(card.header.file || card.header.mediaUrl || card.header.existingHandle) ? (
                                                            card.header.mediaType === 'image' ? (
                                                                <img
                                                                    src={card.header.file ? URL.createObjectURL(card.header.file) : ((card.header.mediaUrl && isOwnServerUrl(card.header.mediaUrl)) ? card.header.mediaUrl : imagePlaceholder)}
                                                                    alt="card"
                                                                    className={styles.previewCardMedia}
                                                                    onError={handleImageFallback}
                                                                />
                                                            ) : card.header.mediaType === 'video' ? (
                                                                <video
                                                                    src={card.header.file ? URL.createObjectURL(card.header.file) : (card.header.mediaUrl || '')}
                                                                    className={styles.previewCardMedia}
                                                                    controls
                                                                    playsInline
                                                                    preload="metadata"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
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
                                                                <div key={btn.id || bIdx} className={styles.previewCardBtn}>
                                                                    {btn.type === 'URL' && <ExternalLink size={13} className={styles.previewCardBtnIcon} />}
                                                                    {btn.type === 'PHONE_NUMBER' && <PhoneCall size={13} className={styles.previewCardBtnIcon} />}
                                                                    {btn.type === 'QUICK_REPLY' && <Reply size={13} className={styles.previewCardBtnIcon} />}
                                                                    <span className={styles.previewCardBtnText}>{btn.text || btn.label || 'Button'}</span>
                                                                </div>
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
                                        <img
                                            src={finalPreviewImageUrl}
                                            alt="Header"
                                            className={styles.previewHeaderImage}
                                            onError={handleImageFallback}
                                        />
                                    )}
                                    {(finalPreviewVideoUrl && !videoError && !headerMedia?.isInvalid) ? (
                                        <video
                                            key={finalPreviewVideoUrl}
                                            src={finalPreviewVideoUrl}
                                            className={styles.previewHeaderVideo}
                                            controls playsInline preload="metadata"
                                            onError={handleVideoError}
                                        />
                                    ) : (headerType === 'Media' && headerMedia?.mediaType === 'video' && (videoError || headerMedia?.isInvalid)) ? (
                                        <div className={styles.previewVideoFallback}>
                                            <Video size={32} color="#94a3b8" />
                                            <span>Video unavailable</span>
                                        </div>
                                    ) : null}
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
                                        <Typography 
                                            className={styles.previewBodyText}
                                            dangerouslySetInnerHTML={{ __html: previewBody }}
                                        />
                                    )}
                                    {footer && (
                                        <Typography className={styles.previewFooterText}>{footer}</Typography>
                                    )}
                                    {buttons.length > 0 && (
                                        <div className={styles.previewButtons}>
                                            {(() => {
                                                const quickReplyButtons = buttons.filter(btn => btn.type === 'QUICK_REPLY');
                                                const ctaButtons = buttons.filter(btn => btn.type !== 'QUICK_REPLY');
                                                const visibleQuickReplies = quickReplyButtons.slice(0, 2);
                                                const hiddenQuickReplyCount = quickReplyButtons.length - 2;

                                                return (
                                                    <>
                                                        {ctaButtons.map((btn) => (
                                                            <button key={btn.id} type="button" className={styles.previewActionBtn}>
                                                                {btn.type === 'URL' && <ExternalLink size={13} className={styles.previewBtnIcon} />}
                                                                {btn.type === 'PHONE_NUMBER' && <PhoneCall size={13} className={styles.previewBtnIcon} />}
                                                                <span>{btn.text || btn.label || 'Button'}</span>
                                                            </button>
                                                        ))}
                                                        {visibleQuickReplies.map((btn) => (
                                                            <button key={btn.id} type="button" className={styles.previewActionBtn}>
                                                                <Reply size={13} className={styles.previewBtnIcon} />
                                                                <span>{btn.text || btn.label || 'Button'}</span>
                                                            </button>
                                                        ))}
                                                        {hiddenQuickReplyCount > 0 && (
                                                            <button type="button" className={styles.previewActionBtn}>
                                                                <span>+{hiddenQuickReplyCount} more</span>
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
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
