import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, Chip, Box, Typography, Button } from '@mui/material';
import { Eye, BarChart3, Copy, Download, Rocket, Edit2, Plus, RefreshCw, Megaphone } from 'lucide-react';
import FilterBar from '../Common/FilterBar/FilterBar';
import IconButton from '../Common/IconButton/IconButton';
import { fetchCampaignLists } from '../../API/CampaignList/CampaignList';
import { useAuthToken } from '../../hooks/useAuthToken';
import styles from './CampaignGrid.module.scss';

// ── Stable helpers ────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return { label: 'Completed', color: 'var(--success-main)',   bg: 'rgba(40,199,111,0.16)' };
    case 'pending':   return { label: 'Pending',   color: 'var(--warning-main)',   bg: 'rgba(245,124,0,0.16)' };
    case 'active':    return { label: 'Active',    color: 'var(--primary-main)',   bg: 'rgba(115,103,240,0.16)' };
    case 'failed':    return { label: 'Failed',    color: 'var(--error-main)',     bg: 'rgba(211,47,47,0.16)' };
    default:          return { label: status || 'Unknown', color: 'var(--secondary-color)', bg: '#f3f4f6' };
  }
};

const getTypeConfig = (type) => {
  switch (type?.toLowerCase()) {
    case 'schedule':  return { label: 'Schedule',  color: 'var(--info-main)',    bg: 'rgba(0,207,232,0.16)' };
    case 'immediate': return { label: 'Immediate', color: 'var(--success-main)', bg: 'rgba(40,199,111,0.16)' };
    case 'recurring': return { label: 'Recurring', color: 'var(--primary-main)', bg: 'rgba(115,103,240,0.16)' };
    default:          return { label: type || 'Unknown', color: 'var(--secondary-color)', bg: '#f3f4f6' };
  }
};

const formatDateCell = (value) => {
  if (!value || value === '—') return value || '—';
  const parts = String(value).split(' ');
  if (parts.length <= 3) return value;
  return { date: parts.slice(0, 3).join(' '), time: parts.slice(3).join(' ') };
};

// ── Stable column definitions ─────────────────────────────────────────────────
const buildColumns = (onView, onAnalytics, onDuplicate, onDownload, onLaunch, onEdit) => [
  {
    field: 'actions', headerName: 'ACTION', minWidth: 220, sortable: false,
    filterable: false, disableColumnMenu: true,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pl: 1 }}>
        <IconButton icon={Eye}      color="secondary" tooltip="View"      onClick={() => onView(params.row)} />
        <IconButton icon={BarChart3} color="primary"  tooltip="Analytics" onClick={() => onAnalytics(params.row)} />
        <IconButton icon={Copy}     color="info"      tooltip="Duplicate" onClick={() => onDuplicate(params.row)} />
        <IconButton icon={Download} color="success"   tooltip="Download"  onClick={() => onDownload(params.row)} />
        <IconButton icon={Rocket}   color="warning"   tooltip="Launch"    onClick={() => onLaunch(params.row)} />
        <IconButton icon={Edit2}    color="secondary" tooltip="Edit"      onClick={() => onEdit(params.row)} />
      </Box>
    ),
  },
  {
    field: 'Name', headerName: 'NAME', minWidth: 200, flex: 1.5,
    renderCell: (p) => (
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--title-color)', fontSize: '0.875rem' }}>
        {p.value || '—'}
      </Typography>
    ),
  },
  {
    field: 'Type', headerName: 'TYPE', minWidth: 120, flex: 0.7,
    renderCell: (p) => {
      // Type is numeric: 1=Immediate, 2=Schedule, 3=Recurring
      const typeLabel = p.value === 1 ? 'Immediate' : p.value === 2 ? 'Schedule' : p.value === 3 ? 'Recurring' : String(p.value || '');
      const cfg = getTypeConfig(typeLabel);
      return <Chip label={cfg.label} size="small" sx={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: '0.72rem', height: 22, fontWeight: 600 }} />;
    },
  },
  {
    field: 'Status', headerName: 'STATUS', minWidth: 120, flex: 0.7,
    renderCell: (p) => {
      // Status is numeric: 1=Pending, 2=Active, 3=Completed, 4=Failed
      const statusLabel = p.value === 1 ? 'Pending' : p.value === 2 ? 'Active' : p.value === 3 ? 'Completed' : p.value === 4 ? 'Failed' : String(p.value || '');
      const cfg = getStatusConfig(statusLabel);
      return <Chip label={cfg.label} size="small" sx={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: '0.72rem', height: 22, fontWeight: 600 }} />;
    },
  },
  {
    field: 'Receiver', headerName: 'RECEIVERS', minWidth: 100, flex: 0.6, type: 'number',
    renderCell: (p) => (
      <Chip label={p.value ?? 0} size="small" sx={{ fontSize: '0.72rem', height: 22, fontWeight: 500 }} />
    ),
  },
  {
    field: 'Message', headerName: 'MESSAGES', minWidth: 100, flex: 0.6, type: 'number',
    renderCell: (p) => (
      <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontWeight: 600, fontSize: '0.875rem' }}>
        {p.value ?? 0}
      </Typography>
    ),
  },
  {
    field: 'EntryDate', headerName: 'CREATED ON', minWidth: 130, flex: 0.8,
    renderCell: (p) => {
      const v = p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>{v}</Typography>;
    },
  },
  {
    field: 'ScheduleTime', headerName: 'SCHEDULED FOR', minWidth: 150, flex: 0.9,
    renderCell: (p) => {
      if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
      const d = new Date(p.value);
      return (
        <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          <br />
          {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      );
    },
  },
  {
    field: 'ProcessTime', headerName: 'PROCESSED ON', minWidth: 150, flex: 0.9,
    renderCell: (p) => {
      if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
      const d = new Date(p.value);
      return (
        <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          <br />
          {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      );
    },
  },
  {
    field: 'ComplateTime', headerName: 'COMPLETED ON', minWidth: 150, flex: 0.9,
    renderCell: (p) => {
      if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
      const d = new Date(p.value);
      return (
        <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          <br />
          {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      );
    },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
const CampaignGrid = () => {
  const navigate = useNavigate();
  const { userToken } = useAuthToken();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const loadCampaigns = useCallback(async () => {
    if (!userToken?.username) return;
    setLoading(true);
    const result = await fetchCampaignLists(userToken.username);
    setCampaigns(result.data || []);
    setLoading(false);
  }, [userToken?.username]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // Action handlers
  const handlers = useMemo(() => ({
    onView:      (row) => console.log('view', row),
    onAnalytics: (row) => console.log('analytics', row),
    onDuplicate: (row) => console.log('duplicate', row),
    onDownload:  (row) => console.log('download', row),
    onLaunch:    (row) => console.log('launch', row),
    onEdit:      (row) => navigate('/campaigns/add', { state: { campaign: row } }),
  }), [navigate]);

  const columns = useMemo(() =>
    buildColumns(handlers.onView, handlers.onAnalytics, handlers.onDuplicate, handlers.onDownload, handlers.onLaunch, handlers.onEdit),
    [handlers]
  );

  const statusCounts = useMemo(() =>
    campaigns.reduce((acc, c) => {
      const label = c.Status === 1 ? 'Pending' : c.Status === 2 ? 'Active' : c.Status === 3 ? 'Completed' : c.Status === 4 ? 'Failed' : 'Unknown';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
    [campaigns]
  );

  const filteredData = useMemo(() => {
    let rows = [...campaigns];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        (c.Name || '').toLowerCase().includes(q) ||
        (c.EntryDate || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'ALL') {
      const statusMap = { Pending: 1, Active: 2, Completed: 3, Failed: 4 };
      const statusNum = statusMap[filterStatus];
      if (statusNum) rows = rows.filter(c => c.Status === statusNum);
    }

    if (sortBy === 'newest') rows.sort((a, b) => new Date(b.EntryDate) - new Date(a.EntryDate));
    else if (sortBy === 'oldest') rows.sort((a, b) => new Date(a.EntryDate) - new Date(b.EntryDate));
    else if (sortBy === 'name') rows.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));

    return rows;
  }, [campaigns, search, filterStatus, sortBy]);

  const filterChips = useMemo(() =>
    ['ALL', 'Completed', 'Pending', 'Active', 'Failed'].map((s) => ({
      value: s,
      label: s === 'ALL' ? `All (${campaigns.length})` : `${s} (${statusCounts[s] || 0})`,
    })),
    [campaigns.length, statusCounts]
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.headerIconWrap}>
            <Megaphone size={18} />
          </div>
          <div>
            <h2 className={styles.pageTitle}>Campaigns</h2>
            <p className={styles.pageSubtitle}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <Button variant="outlined" className='varientOutlinedBtn' startIcon={<RefreshCw size={15} className={loading ? styles.spinning : ''} />} onClick={loadCampaigns} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" className='buttonClassname' startIcon={<Plus size={16} />} onClick={() => navigate('/campaigns/add')}>
            Add Campaign
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns..."
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterChips={filterChips}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {/* Grid */}
      <div className={styles.contentArea}>
        <Paper sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e4e8ee', overflow: 'hidden', flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={filteredData}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.Id}
            pageSizeOptions={[10, 25, 50]}
            rowHeight={60}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc',
                color: 'var(--secondary-color)',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
              },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid var(--sidebar-borderColor)' },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
              '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
            }}
          />
        </Paper>
      </div>
    </div>
  );
};

export default CampaignGrid;
