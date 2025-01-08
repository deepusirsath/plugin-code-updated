export function createChip() {
  function render(status) {
    const statusColors = {
      safe: "chip-safe",
      unsafe: "chip-unsafe",
      pending: "chip-pending",
    };

    const chipClass = statusColors[status.toLowerCase()] || "chip-default";
    const chipContainer = document.getElementById("status-chip");

    if (chipContainer) {
      chipContainer.className = `chip ${chipClass}`;
      chipContainer.textContent = status;
      return chipContainer;
    }
  }

  return {
    render: render,
  };
}
