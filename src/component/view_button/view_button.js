export const createViewButton = (sender) => {
    const button = document.createElement('button');
    button.className = 'view-button';
    button.textContent = 'View';
    button.dataset.sender = sender;
    
    button.addEventListener('click', () => {
        handleViewClick(sender);
    });
    
    return button;
};

const handleViewClick = (sender) => {
    // Handle view action here
    console.log(`Viewing details for: ${sender}`);
    // Add your view logic here
};
