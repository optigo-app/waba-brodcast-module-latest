import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, Chip, Box, Typography, Button, ToggleButtonGroup, ToggleButton, Grid, Card, CardContent, Tooltip, Pagination } from '@mui/material';
import { BarChart3, Copy, Download, Rocket, Edit2, Plus, RefreshCw, Megaphone, LayoutGrid, List, Octagon } from 'lucide-react';
import FilterBar from '../Common/FilterBar/FilterBar';
import IconButton from '../Common/IconButton/IconButton';
import { fetchCampaignLists } from '../../API/CampaignList/CampaignList';
import { fetchCampaignDetails } from '../../API/CampaignList/FetchCampaignDetails';
import { sendBulk } from '../../API/SendBullk/SendBulk';
import { useAuthToken } from '../../hooks/useAuthToken';
import styles from './CampaignGrid.module.scss';
import { formatDate } from '../../utils/globalFunc';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import toast from 'react-hot-toast';

// ── Stable helpers ────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return { label: 'Completed', color: 'var(--success-main)', bg: 'rgba(40,199,111,0.16)' };
    case 'pending': return { label: 'Pending', color: 'var(--warning-main)', bg: 'rgba(245,124,0,0.16)' };
    case 'active': return { label: 'Active', color: 'var(--primary-main)', bg: 'rgba(115,103,240,0.16)' };
    case 'failed': return { label: 'Failed', color: 'var(--error-main)', bg: 'rgba(211,47,47,0.16)' };
    default: return { label: status || 'Unknown', color: 'var(--secondary-color)', bg: '#f3f4f6' };
  }
};

const getTypeConfig = (type) => {
  switch (type?.toLowerCase()) {
    case 'schedule': return { label: 'Schedule', color: 'var(--info-main)', bg: 'rgba(0,207,232,0.16)' };
    case 'immediate': return { label: 'Immediate', color: 'var(--success-main)', bg: 'rgba(40,199,111,0.16)' };
    case 'recurring': return { label: 'Recurring', color: 'var(--primary-main)', bg: 'rgba(115,103,240,0.16)' };
    default: return { label: type || 'Unknown', color: 'var(--secondary-color)', bg: '#f3f4f6' };
  }
};

// ── Stable column definitions ─────────────────────────────────────────────────
const buildColumns = (onAnalytics, onDuplicate, onDownload, onLaunch, onStop, onEdit, onCopyId, activeTimers) => {
  const hasActiveTimer = Object.keys(activeTimers).length > 0;
  return [
    {
      field: 'actions', headerName: 'ACTION', minWidth: 220, sortable: false,
      filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pl: 1 }}>
          <IconButton icon={Copy} color="secondary" tooltip="Copy Campaign ID" onClick={() => onCopyId(params.row.Id)} />
          <IconButton 
            icon={BarChart3} 
            color="primary" 
            tooltip={Number(params.row.Status) === 1 ? "Analytics not available for pending campaigns" : "Analytics"} 
            onClick={() => onAnalytics(params.row)}
            disabled={Number(params.row.Status) === 1}
          />
          <IconButton icon={Copy} color="info" tooltip="Quick Clone" onClick={() => onDuplicate(params.row)} />
          <IconButton icon={Download} color="success" tooltip="Download" onClick={() => onDownload(params.row)} />
          {(Number(params.row.Type) === 1 && Number(params.row.Status) === 1) && (
            activeTimers[String(params.row.Id)] ? (
              <IconButton
                icon={Octagon}
                color="error"
                className={styles.stopButtonPulse}
                tooltip={`Stop (${Math.max(0, Math.ceil((activeTimers[String(params.row.Id)] - Date.now()) / 1000))}s)`}
                onClick={() => onStop(params.row)}
              />
            ) : (
              <IconButton
                icon={Rocket}
                color="warning"
                tooltip={hasActiveTimer ? "Another launch in progress" : "Launch"}
                onClick={() => onLaunch(params.row)}
                disabled={hasActiveTimer}
              />
            )
          )}
          <IconButton icon={Edit2} color="secondary" tooltip="Edit" onClick={() => onEdit(params.row)} />
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
      renderCell: (p) => (
        <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>
          {formatDate(p.value) || '—'}
        </Typography>
      ),
    },
    {
      field: 'ScheduleTime', headerName: 'SCHEDULED FOR', minWidth: 150, flex: 0.9,
      renderCell: (p) => {
        if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
        return (
          <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
            {formatDate(p.value)}
          </Typography>
        );
      },
    },
    {
      field: 'ProcessTime', headerName: 'PROCESSED ON', minWidth: 150, flex: 0.9,
      renderCell: (p) => {
        if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
        return (
          <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
            {formatDate(p.value)}
          </Typography>
        );
      },
    },
    {
      field: 'ComplateTime', headerName: 'COMPLETED ON', minWidth: 150, flex: 0.9,
      renderCell: (p) => {
        if (!p.value) return <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem' }}>—</Typography>;
        return (
          <Typography variant="body2" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.8rem', lineHeight: 1.4 }}>
            {formatDate(p.value)}
          </Typography>
        );
      },
    },
  ];
};

// ── Component ─────────────────────────────────────────────────────────────────
const CampaignGrid = () => {
  const navigate = useNavigate();
  const { userToken } = useAuthToken();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [launchConfirmOpen, setLaunchConfirmOpen] = useState(false);
  const [campaignToLaunch, setCampaignToLaunch] = useState(null);
  const [launchingCampaignIds, setLaunchingCampaignIds] = useState(() => new Set());
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [activeTimers, setActiveTimers] = useState(() => {
    try {
      const saved = localStorage.getItem('campaignActiveTimers');
      if (saved) {
        const timers = JSON.parse(saved);
        const now = Date.now();
        // Filter out expired ones immediately
        const validTimers = {};
        Object.entries(timers).forEach(([id, expiry]) => {
          if (expiry > now) validTimers[id] = expiry;
        });
        return validTimers;
      }
    } catch (e) { console.error('Error loading timers:', e); }
    return {};
  });

  const loadCampaigns = useCallback(async () => {
    if (!userToken?.username) return;
    setLoading(true);
    const result = await fetchCampaignLists(userToken.username);
    setCampaigns(result.data || []);
    setLoading(false);
  }, [userToken?.username]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const triggerSendBulk = useCallback(async (campaignId) => {
    if (!campaignId || launchingCampaignIds.has(String(campaignId))) return;

    setLaunchingCampaignIds(prev => {
      const next = new Set(prev);
      next.add(String(campaignId));
      return next;
    });

    try {
      const response = await sendBulk({
        appuserid: userToken?.username,
        userId: userToken?.userId,
        campaignId,
        whatsappNumber: userToken?.whatsappNumber,
      });

      if (response?.success || response?.stat === 1 || response?.stat_code === 1000) {
        toast.success(`Campaign ${campaignId} started sending`);
      } else {
        toast.error(`Failed to send campaign ${campaignId}`);
      }
    } catch (error) {
      console.error('Error triggering send bulk:', error);
      toast.error(`Error sending campaign ${campaignId}`);
    } finally {
      setLaunchingCampaignIds(prev => {
        const next = new Set(prev);
        next.delete(String(campaignId));
        return next;
      });
    }
  }, [launchingCampaignIds, userToken?.username, userToken?.userId, userToken?.whatsappNumber]);

  // Timer logic for stop button with persistence
  useEffect(() => {
    localStorage.setItem('campaignActiveTimers', JSON.stringify(activeTimers));

    if (Object.keys(activeTimers).length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id] <= now) {
            triggerSendBulk(Number(id));
            delete next[id];
            changed = true;
          }
        });
        // Always return a new object if there are active timers to trigger re-render for tooltips
        return Object.keys(next).length > 0 ? { ...next } : (changed ? {} : prev);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers, triggerSendBulk]);

  // Action handlers
  const handlers = useMemo(() => ({
    onAnalytics: (row) => navigate(`/report/${row.Id}`),
    onDuplicate: async (row) => {
      try {
        toast.loading('Fetching campaign data...', { id: 'fetch-campaign' });
        const result = await fetchCampaignDetails(userToken?.userId, row.Id);
        toast.dismiss('fetch-campaign');

        if (result.success && result.data) {
          const campaignData = {
            ...result.data.rd[0],
            templateData: result.data.rd1[0],
            audienceData: result.data.rd2,
            isClone: true
          };
          navigate('/campaigns/add', { state: { campaign: campaignData } });
          toast.success('Campaign data loaded for cloning');
        } else {
          toast.error('Failed to fetch campaign details');
        }
      } catch (error) {
        toast.dismiss('fetch-campaign');
        toast.error('Error fetching campaign details');
        console.error('Error:', error);
      }
    },
    onDownload: (row) => console.log('download', row),
    onLaunch: (row) => {
      if (Object.keys(activeTimers).length > 0) {
        toast.error('Another campaign is currently being launched. Please wait or stop it first.');
        return;
      }
      setCampaignToLaunch(row);
      setLaunchConfirmOpen(true);
    },
    onEdit: async (row) => {
      try {
        toast.loading('Fetching campaign data...', { id: 'fetch-campaign' });
        const result = await fetchCampaignDetails(userToken?.userId, row.Id);
        toast.dismiss('fetch-campaign');

        if (result.success && result.data) {
          const campaignData = {
            ...result.data.rd[0],
            templateData: result.data.rd1[0],
            audienceData: result.data.rd2,
            isEdit: true
          };
          navigate('/campaigns/add', { state: { campaign: campaignData } });
          toast.success('Campaign data loaded for editing');
        } else {
          toast.error('Failed to fetch campaign details');
        }
      } catch (error) {
        toast.dismiss('fetch-campaign');
        toast.error('Error fetching campaign details');
        console.error('Error:', error);
      }
    },
    onCopyId: (id) => {
      navigator.clipboard.writeText(id);
      toast.success('Campaign ID copied to clipboard');
    },
    onStop: (row) => {
      setActiveTimers(prev => {
        const next = { ...prev };
        delete next[row.Id];
        return next;
      });
      toast.success(`Campaign "${row.Name}" stopped`);
    }
  }), [navigate, userToken?.userId]);

  const handleLaunchConfirm = () => {
    if (campaignToLaunch) {
      console.log('launch campaign:', campaignToLaunch);
      // Start 60 second timer (store expiration timestamp)
      setActiveTimers(prev => ({
        ...prev,
        [campaignToLaunch.Id]: Date.now() + 60000
      }));
      toast.success(`Campaign "${campaignToLaunch.Name}" launched. You have 1 minute to stop it.`);
      setLaunchConfirmOpen(false);
      setCampaignToLaunch(null);
    }
  };

  const handleLaunchCancel = () => {
    setLaunchConfirmOpen(false);
    setCampaignToLaunch(null);
  };

  const columns = useMemo(() =>
    buildColumns(
      handlers.onAnalytics,
      handlers.onDuplicate,
      handlers.onDownload,
      handlers.onLaunch,
      handlers.onStop,
      handlers.onEdit,
      handlers.onCopyId,
      activeTimers
    ),
    [handlers, activeTimers]
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
      rows = rows.filter(c => {
        const searchableFields = [
          c.Name,
          c.Status,
          c.Type,
          c.EntryDate,
          c.ScheduleTime,
          c.ProcessTime,
          c.ComplateTime,
          c.Receiver,
          c.Message,
          c.Id
        ].filter(Boolean).map(f => String(f).toLowerCase());

        return searchableFields.some(field => field.includes(q));
      });
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
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            className='toggle-button-group'
            size="medium"
          >
            <Tooltip title="Grid View" arrow>
              <ToggleButton value="grid"><LayoutGrid size={16} /></ToggleButton>
            </Tooltip>
            <Tooltip title="Card View" arrow>
              <ToggleButton value="card"><List size={16} /></ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
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
        {viewMode === 'grid' ? (
          <Paper sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e4e8ee', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DataGrid
              rows={filteredData.slice(paginationModel.page * paginationModel.pageSize, (paginationModel.page + 1) * paginationModel.pageSize)}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.Id}
              rowHeight={60}
              disableRowSelectionOnClick
              getRowClassName={(params) => activeTimers[String(params.row.Id)] ? styles.stoppingRow : ''}
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
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
              }}
            />
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredData.map((campaign) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={campaign.Id}>
                <Card
                  className={activeTimers[String(campaign.Id)] ? styles.stoppingCard : ''}
                  sx={{
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e4e8ee',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <CardContent sx={{ p: 2, flex: 1, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--title-color)', flex: 1 }}>
                        {campaign.Name || '—'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton icon={Edit2} color="secondary" tooltip="Edit" onClick={() => handlers.onEdit(campaign)} />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {(() => {
                        const typeLabel = campaign.Type === 1 ? 'Immediate' : campaign.Type === 2 ? 'Schedule' : campaign.Type === 3 ? 'Recurring' : String(campaign.Type || '');
                        const typeCfg = getTypeConfig(typeLabel);
                        return <Chip label={typeCfg.label} size="small" sx={{ backgroundColor: typeCfg.bg, color: typeCfg.color, fontSize: '0.7rem', height: 20 }} />;
                      })()}
                      {(() => {
                        const statusLabel = campaign.Status === 1 ? 'Pending' : campaign.Status === 2 ? 'Active' : campaign.Status === 3 ? 'Completed' : campaign.Status === 4 ? 'Failed' : String(campaign.Status || '');
                        const statusCfg = getStatusConfig(statusLabel);
                        return <Chip label={statusCfg.label} size="small" sx={{ backgroundColor: statusCfg.bg, color: statusCfg.color, fontSize: '0.7rem', height: 20 }} />;
                      })()}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-2nd-color)', mb: 1 }}>
                      <span>Receivers: {campaign.Receiver ?? 0}</span>
                      <span>Messages: {campaign.Message ?? 0}</span>
                    </Box>

                    <Typography variant="caption" sx={{ color: 'var(--text-2nd-color)', fontSize: '0.75rem', display: 'block', mb: 2 }}>
                      Created: {formatDate(campaign.EntryDate) || '—'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {(() => {
                        const hasActiveTimer = Object.keys(activeTimers).length > 0;
                        return (
                          <>
                            <IconButton 
                              icon={BarChart3} 
                              color="primary" 
                              tooltip={Number(campaign.Status) === 1 ? "Analytics not available for pending campaigns" : "Analytics"} 
                              onClick={() => handlers.onAnalytics(campaign)}
                              disabled={Number(campaign.Status) === 1}
                            />
                            <IconButton icon={Copy} color="info" tooltip="Quick Clone" onClick={() => handlers.onDuplicate(campaign)} />
                            <IconButton icon={Download} color="success" tooltip="Download" onClick={() => handlers.onDownload(campaign)} />
                            {(Number(campaign.Type) === 1 && Number(campaign.Status) === 1) && (
                              activeTimers[String(campaign.Id)] ? (
                                <IconButton
                                  icon={Octagon}
                                  color="error"
                                  className={styles.stopButtonPulse}
                                  tooltip={`Stop (${Math.max(0, Math.ceil((activeTimers[String(campaign.Id)] - Date.now()) / 1000))}s)`}
                                  onClick={() => handlers.onStop(campaign)}
                                />
                              ) : (
                                <IconButton
                                  icon={Rocket}
                                  color="warning"
                                  tooltip={hasActiveTimer ? "Another launch in progress" : "Launch"}
                                  onClick={() => handlers.onLaunch(campaign)}
                                  disabled={hasActiveTimer}
                                />
                              )
                            )}
                            <IconButton icon={Copy} color="secondary" tooltip="Copy ID" onClick={() => handlers.onCopyId(campaign.Id)} />
                          </>
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </div>

      {/* Launch Confirmation Modal */}
      <ConfirmationModal
        isOpen={launchConfirmOpen}
        onClose={handleLaunchCancel}
        onConfirm={handleLaunchConfirm}
        title="Launch Campaign"
        description={`Are you sure you want to launch the campaign "${campaignToLaunch?.Name || 'this campaign'}"? Once launched, messages will start sending immediately to ${campaignToLaunch?.Receiver || 0} recipients.`}
      />
    </div>
  );
};

export default CampaignGrid;
