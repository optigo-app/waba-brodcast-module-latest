// Global chip styling using theme colors
export const getChipStyles = () => {
  return {
    backgroundColor: 'rgba(115, 103, 240, 0.12)',
    color: '#7367f0',
    fontWeight: 500,
    '& .MuiChip-deleteIcon': {
      color: '#7367f0',
      transition: 'color 0.2s ease, transform 0.2s ease',
      '&:hover': {
        color: '#d32f2f',
        transform: 'scale(1.1)',
      },
    },
  };
};
