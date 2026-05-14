import React from 'react';
import { TextField, Select, MenuItem, Chip, Box, FormControl, InputLabel } from '@mui/material';
import { Search } from 'lucide-react';
import styles from './FilterBar.module.scss';

const FilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortBy,
  onSortChange,
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
  ],
  filterChips = [],
  activeFilter,
  onFilterChange,
}) => {
  return (
    <Box className={styles.filterBar}>
      {/* Left side - Search */}
      <Box className={styles.filterLeft}>
        <Box className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <TextField
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              sx: {
                '& .MuiOutlinedInput-input': {
                  paddingLeft: '2.5rem',
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Right side - Sort and Filters */}
      <Box className={styles.filterRight}>
        {/* Sort Select */}
        {onSortChange && (
          <FormControl size="small" className={styles.sortSelect}>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              displayEmpty
              sx={{
                minWidth: 150,
              }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Filter Chips */}
        {filterChips.length > 0 && (
          <Box className={styles.filterChips}>
            {filterChips.map((chip) => (
              <Chip
                key={chip.value}
                label={chip.label}
                onClick={() => onFilterChange(chip.value)}
                className={`${styles.filterChip} ${activeFilter === chip.value ? styles.activeFilter : ''}`}
                size="medium"
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FilterBar;
