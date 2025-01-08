export function createChip() {
  function render(status) {
    const statusColors = {
      safe: "chip-safe",
      unsafe: "chip-unsafe",
      pending: "chip-pending",
    };

    const chipClass = statusColors[status.toLowerCase()] || "chip-default";

    const chipElement = document.createElement("div");
    chipElement.className = `chip ${chipClass}`;
    chipElement.textContent = status;

    return chipElement;
  }

  return {
    render: render,
  };
}
