import { Autocomplete, TextField, Box, Checkbox, ListItemText, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getChipStyles } from '../../utils/chipStyles';

const SelectAutocomplete = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  disabled = false,
  multiple = false,
  limitTags,
  showCheckbox = false,
  showSelectAll = false,
  getOptionLabel,
  sx = {},
  textFieldProps = {},
}) => {
  const handleSelectAll = () => {
    if (value?.length === options.length) {
      onChange(null, []);
    } else {
      onChange(null, [...options]);
    }
  };

  const isAllSelected = value?.length === options.length;
  const isSomeSelected = value?.length > 0 && !isAllSelected;

  // Add Select All option to the beginning of options
  const dropdownOptions = showSelectAll && multiple
    ? [{ id: 'select-all', name: 'Select All', isSelectAll: true }, ...options]
    : options;

  // Custom placeholder based on selection
  const getPlaceholder = () => {
    if (showCheckbox && multiple && value?.length > 0) {
      if (value.length === 2) {
        return ''; // Don't show placeholder when showing chip
      }
      return `${value.length} branches selected`;
    }
    return placeholder;
  };

  const renderOption = (props, option, { selected }) => {
    if (option?.isSelectAll) {
      return (
        <li {...props} onClick={handleSelectAll}>
          <Checkbox
            icon={<span style={{ width: 16, height: 16, border: '1px solid #ccc', borderRadius: 2 }} />}
            style={{ marginRight: 8 }}
            checked={isAllSelected}
            indeterminate={isSomeSelected}
          />
          <ListItemText primary="Select All" />
        </li>
      );
    }
    if (showCheckbox) {
      return (
        <li {...props}>
          <Checkbox
            icon={<span style={{ width: 16, height: 16, border: '1px solid #ccc', borderRadius: 2 }} />}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          <ListItemText primary={getOptionLabel ? getOptionLabel(option) : option?.name || option?.label || option} />
        </li>
      );
    }
    return <li {...props}>{getOptionLabel ? getOptionLabel(option) : option?.name || option?.label || option}</li>;
  };

  const renderTags = (tagValue, getTagProps) => {
    if (showCheckbox) {
      // Show chip when exactly 2 branches are selected
      if (tagValue.length === 2) {
        return tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            label={getOptionLabel ? getOptionLabel(option) : option?.name || option?.label || option}
            deleteIcon={<CloseIcon />}
            size="small"
            sx={getChipStyles()}
          />
        ));
      }
      // Hide chips when 0 or 2+ branches selected
      return tagValue.map((option, index) => (
        <span {...getTagProps({ index })} style={{ display: 'none' }} />
      ));
    }
    return undefined;
  };

  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      options={dropdownOptions}
      getOptionLabel={getOptionLabel || ((option) => option?.name || option?.label || option || "")}
      disabled={disabled}
      multiple={multiple}
      limitTags={limitTags}
      disableCloseOnSelect={showCheckbox}
      renderOption={showCheckbox ? renderOption : undefined}
      renderTags={showCheckbox ? renderTags : undefined}
      size='small'
      sx={{
        flex: 1,
        minWidth: 220,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: '#fcfcfd',
        },
        ...sx,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
            mt: 0.5,
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={getPlaceholder()}
          sx={{
            '& .MuiAutocomplete-input ': {
              p: '4px 4px 4px 8px !important',
            },
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
            ...textFieldProps,
          }}
        />
      )}
    />
  );
};

export default SelectAutocomplete;
