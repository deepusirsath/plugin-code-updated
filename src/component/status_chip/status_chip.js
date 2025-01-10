export const createStatusChip = (status) => {
  const chip = document.createElement('span');
  chip.className = `status-chip ${status}`;
  chip.textContent = status;
  return chip;
};

// Initialize component when loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Status chip component loaded');
});