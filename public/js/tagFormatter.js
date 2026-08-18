// Tag Formatter for Curate
// Transforms comma-separated tags into styled hashtags

class TagFormatter {
    constructor() {
        this.init();
    }

    init() {
        // Format tags on page load
        this.formatAllTags();
        
        // Listen for dynamic content changes
        this.observeDOMChanges();
    }

    formatAllTags() {
        const tagElements = document.querySelectorAll('[data-tags]');
        tagElements.forEach(element => {
            this.formatTags(element);
        });
    }

    formatTags(element) {
        const tagsString = element.getAttribute('data-tags');
        if (!tagsString) return;

        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        if (tags.length === 0) {
            element.innerHTML = '<span class="text-muted">No tags</span>';
            return;
        }

        const formattedTags = tags.map(tag => {
            return `<span class="tag-badge">#${tag}</span>`;
        }).join(' ');

        element.innerHTML = formattedTags;
    }

    observeDOMChanges() {
        // Create a mutation observer to handle dynamically added content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tagElements = node.querySelectorAll('[data-tags]');
                            tagElements.forEach(element => this.formatTags(element));
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Static method for direct tag formatting
    static formatTagString(tagsString) {
        if (!tagsString) return '';
        
        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        if (tags.length === 0) return '<span class="text-muted">No tags</span>';
        
        return tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join(' ');
    }

    // Static method to convert hashtags back to comma format for forms
    static hashtagsToCommaFormat(hashtagsString) {
        if (!hashtagsString) return '';
        
        // Remove # symbols and convert back to comma format
        return hashtagsString.replace(/#/g, '').replace(/\s+/g, ', ');
    }
}

// Initialize tag formatter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TagFormatter();
    
    // Initialize tag preview for forms
    const tagsInput = document.getElementById('tags');
    if (tagsInput) {
        updateTagPreview(tagsInput.value);
    }
});

// Global function for tag preview
function updateTagPreview(tagsString) {
    const previewElement = document.getElementById('tag-preview');
    if (previewElement) {
        previewElement.innerHTML = TagFormatter.formatTagString(tagsString);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagFormatter;
} 


const editButton = document.querySelector('#editUser');
const pwForm = document.querySelector('.pw')

editButton.addEventListener('click', ()=>{
    pwForm.style.display = pwForm.style.display === 'inline' ? 'none' : 'inline';
});