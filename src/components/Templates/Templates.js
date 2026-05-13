import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchCrmTemplates } from '../../API/TemplateList/FetchCrmTemplates';
import { useAuthToken } from '../../hooks/useAuthToken';
import CreateTemplateModal from './CreateTemplateModal';
import styles from './Templates.module.scss';

const STATUS_CONFIG = {
    APPROVED: { label: 'Approved', icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
    REJECTED: { label: 'Rejected', icon: XCircle, color: '#dc2626', bg: '#fee2e2' },
    PENDING: { label: 'Pending', icon: Clock, color: '#d97706', bg: '#fef3c7' },
    IN_APPEAL: { label: 'In Appeal', icon: AlertCircle, color: '#7c3aed', bg: '#ede9fe' },
};

const getStatusConfig = (status) =>
    STATUS_CONFIG[status?.toUpperCase()] || { label: status || 'Unknown', icon: Clock, color: '#6b7280', bg: '#f3f4f6' };

const TemplateCard = ({ template }) => {
    const status = getStatusConfig(template.WabaStatus);
    const StatusIcon = status.icon;

    let components = [];
    try {
        components = JSON.parse(template.Components || '[]');
    } catch {
        components = [];
    }

    const body = components.find((c) => c.type === 'BODY');
    const footer = components.find((c) => c.type === 'FOOTER');
    const buttons = components.find((c) => c.type === 'BUTTONS');

    const formattedDate = template.EntryDate
        ? new Date(template.EntryDate).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—';

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                    <FileText size={16} className={styles.cardIcon} />
                    <span className={styles.cardTitle}>{template.TemplateName}</span>
                </div>
                <span
                    className={styles.statusBadge}
                    style={{ color: status.color, background: status.bg }}
                >
                    <StatusIcon size={12} />
                    {status.label}
                </span>
            </div>

            <div className={styles.cardMeta}>
                <span className={styles.metaChip}>{template.TemplateType}</span>
                <span className={styles.metaChip}>{template.Language}</span>
                {template.IsVariables === 1 && (
                    <span className={styles.metaChip}>Has Variables</span>
                )}
            </div>

            {body?.text && (
                <p className={styles.bodyPreview}>{body.text}</p>
            )}

            {footer?.text && (
                <p className={styles.footerPreview}>{footer.text}</p>
            )}

            {buttons?.buttons?.length > 0 && (
                <div className={styles.buttonPreviewRow}>
                    {buttons.buttons.map((btn, i) => (
                        <span key={i} className={styles.buttonChip}>{btn.text}</span>
                    ))}
                </div>
            )}

            <div className={styles.cardFooter}>
                <span className={styles.dateText}>{formattedDate}</span>
            </div>
        </div>
    );
};

const Templates = () => {
    const { userToken } = useAuthToken();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const loadTemplates = async () => {
        if (!userToken?.username) return;
        setLoading(true);
        const result = await fetchCrmTemplates(userToken.username);
        setTemplates(result.data);
        setLoading(false);
    };

    useEffect(() => {
        loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userToken?.username]);

    const filtered = templates.filter((t) => {
        const matchSearch = t.TemplateName?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || t.WabaStatus?.toUpperCase() === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusCounts = templates.reduce((acc, t) => {
        const s = t.WabaStatus?.toUpperCase() || 'UNKNOWN';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className={styles.page}>
            {/* Top bar */}
            <div className={styles.topBar}>
                <div>
                    <h2 className={styles.pageTitle}>Templates</h2>
                    <p className={styles.pageSubtitle}>{templates.length} template{templates.length !== 1 ? 's' : ''} total</p>
                </div>
                <div className={styles.topActions}>
                    <button className={styles.refreshBtn} onClick={loadTemplates} disabled={loading}>
                        <RefreshCw size={15} className={loading ? styles.spinning : ''} />
                        Refresh
                    </button>
                    <button className={styles.createBtn} onClick={() => setOpenModal(true)}>
                        <Plus size={16} />
                        Create Template
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <input
                    className={styles.searchInput}
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className={styles.statusFilters}>
                    {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((s) => (
                        <button
                            key={s}
                            className={`${styles.filterChip} ${filterStatus === s ? styles.activeFilter : ''}`}
                            onClick={() => setFilterStatus(s)}
                        >
                            {s === 'ALL' ? `All (${templates.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${statusCounts[s] || 0})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className={styles.loadingState}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonHeader}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
                            </div>
                            <div className={styles.skeletonMeta}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonChip}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonChip}`} />
                            </div>
                            <div className={styles.skeletonBody}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonFull}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonFull}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonHalf}`} />
                            </div>
                            <div className={`${styles.skeletonLine} ${styles.skeletonFooter}`} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <FileText size={40} className={styles.emptyIcon} />
                    <p>No templates found</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((t) => (
                        <TemplateCard key={t.Id} template={t} />
                    ))}
                </div>
            )}

            {/* Create Template Modal */}
            <CreateTemplateModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={() => {
                    setOpenModal(false);
                    loadTemplates();
                }}
            />
        </div>
    );
};

export default Templates;
