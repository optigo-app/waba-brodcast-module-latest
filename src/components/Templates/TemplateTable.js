import { Paper, Chip, Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FileText, Eye, Send, Copy, Trash2, BookOpen, CheckCircle2, Clock, XCircle, AlertCircle, Image, Video, FileType, FileQuestion, Rocket, Edit2 } from 'lucide-react';
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

const canEditTemplate = (template) => {
    const updatedAt = template?.UpdatedAt;
    if (!updatedAt) return true;

    const updatedAtMs = new Date(updatedAt).getTime();
    if (!Number.isFinite(updatedAtMs)) return true;

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    return (Date.now() - updatedAtMs) >= TWENTY_FOUR_HOURS_MS;
};

const TemplateTable = ({ items, onView, onSend, onClone, onEdit, onDelete, onPublish, count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
    const rows = items.map((template) => {
        const status = getStatusConfig(template.WabaStatus);

        let components = [];
        try { components = JSON.parse(template.Components || '[]'); } catch { components = []; }

        const headerType = getHeaderType(components);
        const headerInfo = HEADER_ICONS[headerType];

        const formattedDate = template.EntryDate
            ? new Date(template.EntryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        return {
            ...template,
            id: template.Id,
            status,
            headerInfo,
            formattedDate,
            isApproved: template.WabaStatus?.toUpperCase() === 'APPROVED',
            isDraft: template.WabaStatus?.toUpperCase() === 'DRAFT',
            isPending: template.WabaStatus?.toUpperCase() === 'PENDING',
            canEdit: canEditTemplate(template),
        };
    });

    const columns = [
        {
            field: 'TemplateName',
            headerName: 'NAME',
            minWidth: 220,
            flex: 1.4,
            align: 'start',
            headerAlign: 'start',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <FileText size={16} color="#6b7280" />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--title-color)', fontSize: '0.875rem' }} noWrap>
                        {params.row.TemplateName}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'WabaStatus',
            headerName: 'STATUS',
            minWidth: 150,
            flex: 0.9,
            align: 'start',
            headerAlign: 'start',
            renderCell: (params) => {
                const StatusIcon = params.row.status.icon;
                return (
                    <Chip
                        icon={<StatusIcon size={12} color={params.row.status.color} />}
                        label={params.row.status.label}
                        size="small"
                        sx={{
                            backgroundColor: params.row.status.bg,
                            color: params.row.status.color,
                            fontSize: '0.72rem',
                            height: '22px',
                            '& .MuiChip-icon': { marginLeft: '4px', color: 'inherit' },
                        }}
                    />
                );
            }
        },
        {
            field: 'headerType',
            headerName: 'TYPE',
            minWidth: 130,
            flex: 0.8,
            sortable: false,
            filterable: false,
            align: 'start',
            headerAlign: 'start',
            valueGetter: (_, row) => row.headerInfo?.label || 'Text',
            renderCell: (params) => {
                const HeaderIcon = params.row.headerInfo.Icon;
                return (
                    <Chip
                        icon={<HeaderIcon size={11} color={params.row.headerInfo.color} />}
                        label={params.row.headerInfo.label}
                        size="small"
                        sx={{
                            backgroundColor: params.row.headerInfo.bg,
                            color: params.row.headerInfo.color,
                            fontSize: '0.72rem',
                            height: '22px',
                            '& .MuiChip-icon': { marginLeft: '4px', color: 'inherit' }
                        }}
                    />
                );
            }
        },
        {
            field: 'TemplateType',
            headerName: 'CATEGORY',
            minWidth: 130,
            flex: 0.8,
            align: 'start',
            headerAlign: 'start',
            renderCell: (params) => (
                <Chip label={params.row.TemplateType || '—'} size="small" sx={{ fontSize: '0.72rem', height: '22px' }} />
            )
        },
        {
            field: 'Language',
            headerName: 'LANGUAGE',
            minWidth: 120,
            flex: 0.7,
            align: 'start',
            headerAlign: 'start',
            renderCell: (params) => (
                <Chip label={params.row.Language || '—'} size="small" sx={{ fontSize: '0.72rem', height: '22px' }} />
            )
        },
        {
            field: 'formattedDate',
            headerName: 'CREATED DATE',
            minWidth: 130,
            flex: 0.8,
            align: 'start',
            headerAlign: 'start',
            valueGetter: (_, row) => row.formattedDate,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontWeight: 500, fontSize: '0.875rem' }}>
                    {params.row.formattedDate}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'ACTIONS',
            minWidth: 240,
            flex: 1,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            align: 'start',
            headerAlign: 'start',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'start', width: '100%', paddingLeft: '8px' }}>
                    <IconButton icon={Eye} color="secondary" tooltip="View" onClick={() => onView(params.row)} />
                    {params.row.isApproved && (
                        <IconButton icon={Send} color="success" tooltip="Send" onClick={() => onSend(params.row)} />
                    )}
                    {!params.row.isPending && (
                        <IconButton icon={Copy} color="info" tooltip="Clone" onClick={() => onClone(params.row)} />
                    )}
                    {!params.row.isPending && (
                        <IconButton
                            icon={Edit2}
                            color="secondary"
                            tooltip={params.row.canEdit ? 'Edit' : 'Editable after 24 hours from last update'}
                            onClick={params.row.canEdit ? () => onEdit(params.row) : undefined}
                            disabled={!params.row.canEdit}
                        />
                    )}
                    {params.row.isDraft && (
                        <IconButton icon={Rocket} color="primary" tooltip="Submit/Apply" onClick={() => onPublish(params.row)} />
                    )}
                    <IconButton icon={Trash2} color="error" tooltip="Delete" onClick={() => onDelete(params.row)} />
                </Box>
            )
        },
    ];

    return (
        <Paper sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e4e8ee', overflow: 'hidden', backgroundColor: '#fff' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                paginationMode="server"
                rowCount={count}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                paginationModel={{ page, pageSize: rowsPerPage }}
                onPaginationModelChange={(model) => {
                    if (model.page !== page && onPageChange) {
                        onPageChange(null, model.page);
                    }
                    if (model.pageSize !== rowsPerPage && onRowsPerPageChange) {
                        onRowsPerPageChange({ target: { value: model.pageSize } });
                    }
                }}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                sx={{
                    border: 'none',
                    minHeight: 520,

                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f8fafc',
                        color: 'var(--secondary-color)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    },

                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 700,
                    },

                    '& .MuiDataGrid-cell': {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    },

                    '& .MuiDataGrid-footerContainer': {
                        borderTop: '1px solid var(--sidebar-borderColor)',
                    },

                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                        outline: 'none',
                    },

                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                        outline: 'none',
                    },
                }}
            />
        </Paper>
    );
};

export default TemplateTable;
