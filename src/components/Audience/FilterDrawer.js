import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './AudienceSection.module.scss';
import { fetchFilterMasterList } from '../../API/FilterMaster/FIlterMaster';
import { useAuthToken } from '../../hooks/useAuthToken';
import VirtualizedAutocomplete from './VirtualizedAutoComplete';

// ✅ Main Filter Drawer Component
const FilterDrawer = ({ open, onClose, onApplyFilters, filters = {} }) => {
  const [localFilters, setLocalFilters] = useState({
    country: null,
    companyName: null,
    companyType: null,
    city: null,
    state: null,
    ...filters,
  });

  const [companyName, setCompanyName] = useState([]);
  const [companyType, setCompanyType] = useState([]);
  const [state, setState] = useState([]);
  const [country, setCountry] = useState([]);
  const [city, setCity] = useState([]);
  const { userToken } = useAuthToken();

  const fetchFilterData = async () => {
    try {
      const response = await fetchFilterMasterList(userToken?.userId);
      if (response?.data) {
        setCompanyName(response?.data?.rd || []);
        setCompanyType(response?.data?.rd1 || []);
        setState(response?.data?.rd2 || []);
        setCountry(response?.data?.rd3 || []);
        setCity(response?.data?.rd4 || []);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  useEffect(() => {
    if (open) fetchFilterData();
  }, [open]);


  // ✅ Handles filter selection
  const handleFilterChange = (field) => (newValue) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: newValue || null
    }));
  };

  // ✅ Reset filters
  const handleReset = () => {
    const resetFilters = {
      country: null,
      companyName: null,
      companyType: null,
      city: null,
      state: null,
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  // ✅ Apply filters
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      classes={{ paper: styles.filterDrawer }}
    >
      {/* Header */}
      <Box className={styles.filterHeader}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Filter Fields */}
      <Box className={styles.filterContent} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <VirtualizedAutocomplete
          data={companyName}
          label="Select Company"
          valueKey="companyname"
          value={localFilters.companyName}
          onChange={handleFilterChange('companyName')}
        />
        <VirtualizedAutocomplete
          data={companyType}
          label="Select Company Type"
          valueKey="businessclassname"
          value={localFilters.companyType}
          onChange={handleFilterChange('companyType')}
        />
        <VirtualizedAutocomplete
          data={state}
          label="Select State"
          valueKey="StateName"
          value={localFilters.state}
          onChange={handleFilterChange('state')}
        />
        <VirtualizedAutocomplete
          data={country}
          label="Select Country"
          valueKey="CountryName"
          value={localFilters.country}
          onChange={handleFilterChange('country')}
        />
        <VirtualizedAutocomplete
          data={city}
          label="Select City"
          valueKey="City"
          value={localFilters.city}
          onChange={handleFilterChange('city')}
        />
      </Box>

      {/* Footer Actions */}
      <Box className={styles.filterActions}>
        <Button onClick={handleReset} color="secondary" variant="outlined" fullWidth>
          Reset
        </Button>
        <Button
          onClick={handleApply}
          color="primary"
          variant="contained"
          fullWidth
          className={styles.applyButton}
        >
          Apply Filters
        </Button>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
