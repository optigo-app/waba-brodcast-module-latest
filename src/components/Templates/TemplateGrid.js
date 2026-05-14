import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Tooltip, Grid, TablePagination } from '@mui/material';
import { FileText, Eye, Send, Copy, Edit, Trash2, BookOpen, CheckCircle2, Clock, XCircle, AlertCircle, Image, Video, FileType, FileQuestion, Rocket } from 'lucide-react';
import IconButton from '../Common/IconButton/IconButton';

const STATUS_CONFIG = {
    APPROVED: { label: 'Approved', icon: CheckCircle2, color: 'var(--success-main)', bg: 'rgba(40, 199, 111, 0.16)' },
    REJECTED: { label: 'Rejected', icon: XCircle, color: 'var(--error-main)', bg: 'rgba(211, 47, 47, 0.16)' },
    PENDING: { label: 'Pending', icon: Clock, color: 'var(--warning-main)', bg: 'rgba(245, 124, 0, 0.16)' },
    IN_APPEAL: { label: 'In Appeal', icon: AlertCircle, color: 'var(--primary-main)', bg: 'rgba(115, 103, 240, 0.16)' },
    DRAFT: { label: 'Draft', icon: BookOpen, color: 'var(--secondary-color)', bg: 'rgba(125, 127, 133, 0.16)' },
};

const getStatusConfig = (status) =>
    STATUS_CONFIG[status?.toUpperCase()] || { label: status || 'Unknown', icon: Clock, color: '#6b7280', bg: '#f3f4f6' };

const getHeaderType = (components = []) => {
    const header = components.find((c) => c.type === 'HEADER');
    if (!header) return 'text';
    const fmt = header.format?.toLowerCase();
    if (fmt === 'image') return 'image';
    if (fmt === 'video') return 'video';
    if (fmt === 'document') return 'document';
    return 'text';
};

const HEADER_ICONS = {
    image: { Icon: Image, label: 'Image', color: 'var(--primary-main)', bg: 'rgba(115, 103, 240, 0.16)' },
    video: { Icon: Video, label: 'Video', color: 'var(--info-main)', bg: 'rgba(0, 207, 232, 0.16)' },
    document: { Icon: FileType, label: 'Document', color: 'var(--warning-main)', bg: 'rgba(245, 124, 0, 0.16)' },
    text: { Icon: FileQuestion, label: 'Text', color: 'var(--title-color)', bg: 'rgba(68, 64, 80, 0.16)' },
};

const TemplateGrid = ({ items, onView, onSend, onClone, onEdit, onDelete, count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
    return (
        <Grid
            container
            spacing={2}
            sx={{
                flex: 1,
                overflowY: 'auto',
                py: 2,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '99px' }
            }}
        >
            {items.map((template) => {
                const status = getStatusConfig(template.WabaStatus);
                const StatusIcon = status.icon;

                let components = [];
                try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }

                const headerType = getHeaderType(components);
                const headerInfo = HEADER_ICONS[headerType];
                const HeaderIcon = headerInfo.Icon;

                const body = components.find((c) => c.type === 'BODY');
                const footer = components.find((c) => c.type === 'FOOTER');
                const buttons = components.find((c) => c.type === 'BUTTONS');

                const formattedDate = template.EntryDate
                    ? new Date(template.EntryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                const isApproved = template.WabaStatus?.toUpperCase() === 'APPROVED';
                const isDraft = template.WabaStatus?.toUpperCase() === 'DRAFT';

                return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.Id}>
                        <Card sx={{ height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }, transition: 'box-shadow 0.2s' }}>
                            <CardContent sx={{ p: 2, flex: 1, '&:last-child': { pb: 2 } }}>
                                {/* Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FileText size={16} color="#6b7280" />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {template.TemplateName}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={<StatusIcon size={12} color={status.color} />}
                                        label={status.label}
                                        size="small"
                                        sx={{
                                            backgroundColor: status.bg,
                                            color: status.color,
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            height: '22px',
                                            '& .MuiChip-icon': { marginLeft: '4px', color: 'inherit' },
                                        }}
                                    />
                                </Box>

                                {/* Meta Chips */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                    <Chip
                                        icon={<HeaderIcon size={11} color={headerInfo.color} />}
                                        label={headerInfo.label}
                                        size="small"
                                        sx={{
                                            backgroundColor: headerInfo.bg,
                                            color: headerInfo.color,
                                            fontSize: '0.72rem',
                                            height: '20px',
                                            '& .MuiChip-icon': { marginLeft: '4px', color: 'inherit' }
                                        }}
                                    />
                                    <Chip label={template.TemplateType} size="small" sx={{ fontSize: '0.72rem', height: '20px' }} />
                                    <Chip label={template.Language} size="small" sx={{ fontSize: '0.72rem', height: '20px' }} />
                                    {template.IsVariables === 1 && <Chip label="Has Variables" size="small" sx={{ fontSize: '0.72rem', height: '20px' }} />}
                                </Box>

                                {/* Body Preview */}
                                {body?.text && (
                                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.78rem', mb: 1, whiteSpace: 'pre-wrap' }}>
                                        {body.text}
                                    </Typography>
                                )}

                                {/* Footer Preview */}
                                {footer?.text && (
                                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', display: 'block', mb: 1 }}>
                                        {footer.text}
                                    </Typography>
                                )}

                                {/* Buttons Preview */}
                                {buttons?.buttons?.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {buttons.buttons.map((btn, i) => (
                                            <Chip key={i} label={btn.text} size="small" variant="outlined" sx={{ fontSize: '0.72rem', height: '20px' }} />
                                        ))}
                                    </Box>
                                )}
                            </CardContent>

                            {/* Footer Actions */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                                    {formattedDate}
                                </Typography>

                                <Box data-testid="hover-actions" sx={{ display: 'flex', gap: 0.25 }}>
                                    <IconButton icon={Eye} color="secondary" tooltip="View" onClick={() => onView(template)} size={20} />

                                    {isApproved && (
                                        <IconButton icon={Send} color="success" tooltip="Send" onClick={() => onSend(template)} size={20} />
                                    )}

                                    <IconButton icon={Copy} color="info" tooltip="Clone" onClick={() => onClone(template)} size={20} />

                                    <IconButton icon={Edit} color="warning" tooltip="Edit" onClick={() => onEdit(template)} size={20} />

                                    {isDraft && (
                                        <IconButton icon={Rocket} color="primary" tooltip="Submit/Apply" size={20} />
                                    )}

                                    <IconButton icon={Trash2} color="error" tooltip="Delete" onClick={() => onDelete(template)} size={20} />
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                );
            })}

            <Grid item xs={12}>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                    component="div"
                    count={count}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    sx={{
                        borderTop: '1px solid #e4e8ee',
                        mt: 'auto',
                        '& .MuiTablePagination-spacer': { display: 'none' },
                        '& .MuiTablePagination-displayedRows': { order: 1, marginRight: 'auto' },
                        '& .MuiTablePagination-selectLabel': { order: 2 },
                        '& .MuiTablePagination-select': { order: 3 },
                        '& .MuiTablePagination-actions': { order: 4 },
                    }}
                    labelDisplayedRows={({ from, to, count }) => `Showing ${from} to ${to} of ${count} entries`}
                />
            </Grid>
        </Grid>
    );
};

export default TemplateGrid;
