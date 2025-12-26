import React, { useEffect, useState, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Button,
  InputAdornment,
  Tooltip,
  useTheme,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import styles from './AudienceSection.module.scss';
import { fetchGroupList } from '../../API/GroupLists/GroupLists';
import { useAuthToken } from '../../hooks/useAuthToken';

const GroupDropdown = ({
  GroupData,
  selectedGroup,
  onGroupChange,
  source,
  setFilterDrawerOpen,
  currentStep,
  onSearchChange,
  onCreateNewGroup,
  isDisabled = false,
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(selectedGroup || null);
  const [inputValue, setInputValue] = useState('');
  const [searchText, setSearchText] = useState('');
  const { userToken } = useAuthToken();
  const [groupOptions, setGroupOptions] = useState(GroupData || []);
  const searchTimeoutRef = useRef(null);

  // Debounce search
  const debounceSearch = (value) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange && onSearchChange(value);
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch group list only if GroupData is not provided
  const fetchGroupData = async () => {
    try {
      const result = await fetchGroupList(userToken?.userId);
      if (result?.data) {
        setGroupOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  };

  useEffect(() => {
    if (currentStep === 3 && source === 'crm') {
      fetchGroupData();
    } else if (GroupData?.length) {
      setGroupOptions(GroupData);
    }
  }, [GroupData, currentStep, source]);

  useEffect(() => {
    setValue(null);
    setInputValue('');
    onGroupChange && onGroupChange(null);
  }, [source]);

  useEffect(() => {
    if (selectedGroup) {
      setSearchText('');
      debounceSearch('');
    }
  }, [selectedGroup]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debounceSearch(value);
  };

  const isGroupSelected = !!selectedGroup?.id || !!selectedGroup?.Category;

  return (
    <Box className={styles.section}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography className={styles.sectionTitle}>
            Select Group
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip
            title={
              isGroupSelected
                ? `Group "${selectedGroup.SerchFilterName || selectedGroup.Category}" is selected. Clear it to use filters.`
                : ''
            }
            placement="top"
            arrow
            disableHoverListener={!isGroupSelected}
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                disabled={isGroupSelected}
                onClick={() => setFilterDrawerOpen(true)}
                className={styles.filterButton}
                sx={{
                  textTransform: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  px: 2,
                  py: 1
                }}
              >
                More Filters
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Dropdown + Search */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Group Selector */}
        <Autocomplete
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            onGroupChange && onGroupChange(newValue);
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          options={groupOptions}
          getOptionLabel={(option) =>
            option?.SerchFilterName || option?.Category || ""
          }
          disabled={isDisabled}
          sx={{
            flex: 1,
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#fcfcfd',
            },
          }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
              mt: 0.5,
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Group"
              placeholder={isDisabled ? "Clear filters to select group" : "Select Group"}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--sidebar-borderColor)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(90, 90, 90, 0.15)',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary-main)',
                  borderWidth: 2,
                },
              }}
            />
          )}
        />

        {/* Search Input */}
        <TextField
          placeholder="Search contacts..."
          variant="outlined"
          size="medium"
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(125, 127, 133, 0.6)' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: '#fcfcfd',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--sidebar-borderColor)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(90, 90, 90, 0.15)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary-main)',
                borderWidth: '2px',
              }
            }
          }}
          sx={{ flex: 2, minWidth: 300 }}
        />
      </Box>
    </Box>
  );
};

export default GroupDropdown;
