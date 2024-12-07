export function ShareLinkAction(node, { url = window.location.href, title = '', text = '' } = {}) {
    node.onclick = ShareLink({url, title, text});

    // Cleanup when the action is destroyed
    return {
        destroy() {
            node.onclick = null; // Remove the click handler
        }
    };
}

export const ShareLink = async ({ url = window.location.href, title = '', text = '' } = {}) => {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            console.log('Content shared successfully!');
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        console.warn('Web Share API not supported on this device.');
        alert('Sharing not supported on this browser.');
    }
}