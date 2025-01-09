export const createChip = (status) => {
  const template = document.getElementById('chip-template');
  const chip = template.content.cloneNode(true).querySelector('.status-chip');
  chip.classList.add(status);
  chip.textContent = status;
  return chip;
};

