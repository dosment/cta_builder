/**
 * Utility Functions Module
 * Helper functions for the CTA Builder
 */

/**
 * Create an HTML element with attributes and content
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'checked' || key === 'disabled' || key === 'selected') {
            // Boolean attributes must be set as properties, not attributes
            element[key] = Boolean(value);
        } else {
            element.setAttribute(key, value);
        }
    });

    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    }

    return element;
}

/**
 * Clear all children from an element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Show an element by removing the 'hidden' class
 */
export function showElement(element) {
    element.classList.remove('hidden');
}

/**
 * Hide an element by adding the 'hidden' class
 */
export function hideElement(element) {
    element.classList.add('hidden');
}

/**
 * Toggle element visibility
 */
export function toggleElement(element, show) {
    if (show === undefined) {
        element.classList.toggle('hidden');
    } else {
        if (show) {
            showElement(element);
        } else {
            hideElement(element);
        }
    }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (err) {
            document.body.removeChild(textarea);
            console.error('Failed to copy text:', err);
            return false;
        }
    }
}

/**
 * Format CTA type to display name
 */
export function formatCtaTypeName(ctaType) {
    const nameMap = {
        'personalize_payment': 'Personalize My Payment',
        'confirm_availability': 'Confirm Availability',
        'value_trade': 'Value My Trade',
        'test_drive': 'Schedule Test Drive',
        'pre_qualify': 'Pre-Qualify',
        'eprice': 'Get E-Price',
        'text_us': 'Text Us',
        'chat_now': 'Chat Now'
    };

    return nameMap[ctaType] || ctaType;
}

/**
 * Generate CSS from style object
 */
export function generateCssFromStyles(styles) {
    const cssProperties = [];

    const propertyMap = {
        backgroundColor: 'background-color',
        textColor: 'color',
        borderColor: 'border-color',
        borderRadius: 'border-radius',
        textTransform: 'text-transform',
        fontSize: 'font-size',
        fontWeight: 'font-weight',
        fontFamily: 'font-family',
        lineHeight: 'line-height',
        padding: 'padding',
        marginTop: 'margin-top',
        marginBottom: 'margin-bottom',
        letterSpacing: 'letter-spacing',
        borderWidth: 'border-width',
        whiteSpace: 'white-space',
        transition: 'transition'
    };

    Object.entries(styles).forEach(([key, value]) => {
        if (propertyMap[key]) {
            cssProperties.push(`${propertyMap[key]}: ${value}`);
        }
    });

    return cssProperties.join(';\n    ');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create a debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate hex color
 */
export function isValidHexColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Get contrast color (black or white) for a given background color
 */
export function getContrastColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Show temporary notification
 */
export function showNotification(message, type = 'success', duration = 3000) {
    const notification = createElement('div', {
        className: `notification notification-${type}`,
        style: `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `
    }, message);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

/**
 * Format department number for display
 */
export function formatDepartmentLabel(dept) {
    if (typeof dept === 'number') {
        return `Department ${dept}`;
    }
    return dept;
}

/**
 * Get CTA class name based on type
 */
export function getCtaClassName(ctaType, useDeeplink) {
    if (ctaType === 'personalize_payment') {
        if (useDeeplink) {
            return 'demo-cta cn-buy-now';
        }
        return 'demo-cta cn-buynow-b1';
    }

    if (ctaType === 'text_us' || ctaType === 'chat_now') {
        return 'demo-cta';
    }

    if (useDeeplink) {
        return 'demo-cta cn-buy-now';
    }

    return 'demo-cta';
}

/**
 * Get onclick handler pattern for CTA
 */
export function getOnclickPattern(ctaType, config, ctaLabels) {
    const ctaInfo = ctaLabels[ctaType];

    // Special CTAs with predefined onclick patterns
    if (ctaInfo.onclickPattern) {
        return ctaInfo.onclickPattern;
    }

    // Deeplink CTAs don't use onclick
    if (config.useDeeplink) {
        return null;
    }

    // BuyNow (Personalize Payment) without deeplink
    if (ctaType === 'personalize_payment') {
        return null; // Uses data-vin attribute only
    }

    // Regular CTAs with tree and department
    if (config.tree && config.dept) {
        const dept = config.customDept || config.dept;
        return `CNPC.launch(this, { tree: '${config.tree}', dept: ${dept}, re_engage: true, vin: '{vin}'})`;
    }

    return null;
}

/**
 * Sanitize CSS class name
 */
export function sanitizeCssClassName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Generate unique ID
 */
let idCounter = 0;
export function generateUniqueId(prefix = 'id') {
    return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Show inline error message for a field
 */
export function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove any existing error for this field
    clearFieldError(fieldId);

    // Add error class to field
    field.classList.add('field-error');

    // Create error message element
    const errorElement = createElement('small', {
        className: 'text-danger field-error-message',
        id: `${fieldId}-error`,
        style: 'display: block; margin-top: 4px; color: #dc3545; font-size: 0.875em;'
    }, message);

    // Insert error message after the field
    field.parentNode.insertBefore(errorElement, field.nextSibling);

    // Add visual indicator to the field
    field.style.borderColor = '#dc3545';
}

/**
 * Clear inline error message for a field
 */
export function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove error class
    field.classList.remove('field-error');
    field.style.borderColor = '';

    // Remove error message element
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Clear all field errors on the page
 */
export function clearAllFieldErrors() {
    // Clear all error messages
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());

    // Clear all error styling
    document.querySelectorAll('.field-error').forEach(field => {
        field.classList.remove('field-error');
        field.style.borderColor = '';
    });
}
