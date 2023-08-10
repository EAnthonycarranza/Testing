// CompanionConnect/public/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-photo-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const photoId = event.target.getAttribute('data-id');
            
            try {
                const response = await fetch(`/api/users/delete-photo/${photoId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (data.success) {
                    // Remove the photo element from the DOM
                    const photoElement = event.target.closest('.col-md-4');
                    photoElement.remove();
                    // Reload the page to update the list of photos
                    location.reload();
                } else {
                    console.error(data.message || 'Error deleting photo.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});

