/**
 * Code Generator Module
 * Generates HTML/CSS code for CTAs based on configuration
 */

import * as utils from './utils.js';

/**
 * Main code generation function
 */
export function generateCode(stateData, loadedData) {
    const {
        oemData,
        selectedCtas,
        ctaConfigs,
        advancedStyles = { srp: {}, vdp: {} }
    } = stateData;
    const { ctaLabels } = loadedData;

    if (!oemData) {
        return '';
    }

    let code = '';

    // Generate CSS
    code += generateCss(oemData, selectedCtas, ctaConfigs, advancedStyles);
    code += '\n\n';

    // Generate HTML for SRP
    const hasSrpCtas = selectedCtas.some(type => ctaConfigs[type].placement.srp);
    if (hasSrpCtas) {
        code += generateHtmlSection('SRP', selectedCtas, ctaConfigs, ctaLabels, oemData);
        code += '\n\n';
    }

    // Generate HTML for VDP
    const hasVdpCtas = selectedCtas.some(type => ctaConfigs[type].placement.vdp);
    if (hasVdpCtas) {
        code += generateHtmlSection('VDP', selectedCtas, ctaConfigs, ctaLabels, oemData);
    }

    return code;
}

/**
 * Generate CSS styles
 */
function generateCss(oemData, selectedCtas, ctaConfigs, advancedStyles) {
    let css = '<style>\n';

    // Base .demo-cta class with common styles
    css += '.demo-cta {\n';
    css += '    display: inline-flex;\n';
    css += '    justify-content: center;\n';
    css += '    align-items: center;\n';
    css += '    text-align: center;\n';
    css += '    text-decoration: none;\n';
    css += '    cursor: pointer;\n';
    css += '    border-style: solid;\n';
    css += '    width: 100%;\n';
    css += '}\n\n';

    const styleTypeMap = new Map();
    const customStyleMap = new Map(); // Track custom styles by ctaType

    selectedCtas.forEach(ctaType => {
        const config = ctaConfigs[ctaType];
        const styleType = utils.sanitizeCssClassName(config.styleType || 'primary');

        if (config.styleType === '__custom__' && config.customStyle) {
            // Store custom style with unique identifier
            customStyleMap.set(ctaType, config.customStyle);
        } else if (!styleTypeMap.has(styleType)) {
            const styles = oemData.styles[config.styleType] || oemData.styles.primary;
            styleTypeMap.set(styleType, styles);
        }
    });

    // Generate standard OEM styles
    styleTypeMap.forEach((styleData, styleType) => {
        if (!styleData) return;

        css += `.demo-cta-${styleType} {\n`;
        css += `    ${utils.generateCssFromStyles(styleData)};\n`;
        css += '}\n\n';

        css += `.demo-cta-${styleType}:hover {\n`;
        css += `    background-color: ${styleData.hoverBackgroundColor};\n`;
        css += `    color: ${styleData.hoverTextColor};\n`;
        css += '}\n\n';
    });

    // Generate custom styles for each CTA with custom styling
    customStyleMap.forEach((customStyle, ctaType) => {
        const sanitizedType = utils.sanitizeCssClassName(ctaType);
        css += `.demo-cta-custom-${sanitizedType} {\n`;
        css += `    background-color: ${customStyle.backgroundColor};\n`;
        css += `    color: ${customStyle.textColor};\n`;
        css += `    border-color: ${customStyle.borderColor};\n`;
        css += `    border-width: 2px;\n`;
        css += `    text-transform: none;\n`;
        css += `    transition: all 0.3s ease;\n`;
        css += '}\n\n';

        css += `.demo-cta-custom-${sanitizedType}:hover {\n`;
        css += `    background-color: ${customStyle.textColor};\n`;
        css += `    color: ${customStyle.backgroundColor};\n`;
        css += '}\n\n';
    });

    css += buildPlacementOverride('srp', advancedStyles.srp, oemData.styles.primary);
    css += buildPlacementOverride('vdp', advancedStyles.vdp, oemData.styles.secondary || oemData.styles.primary);

    // Special CSS for deeplinked CTAs
    const hasDeeplink = selectedCtas.some(type => ctaConfigs[type].useDeeplink);
    if (hasDeeplink) {
        css += '/* Hide default BuyNow button when using deeplinks */\n';
        css += '.cn-bn1 {\n';
        css += '    display: none !important;\n';
        css += '}\n\n';
    }

    css += '</style>';

    return css;
}

function buildPlacementOverride(placement, overrides = {}, fallbackStyles = {}) {
    if (!fallbackStyles) fallbackStyles = {};
    const className = placement === 'srp' ? 'convertnow-srp' : 'convertnow-vdp';
    const defaults = {
        fontFamily: 'inherit',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.4',
        letterSpacing: '0px',
        borderRadius: fallbackStyles.borderRadius || '4px',
        marginTop: fallbackStyles.marginTop || '6px',
        marginBottom: fallbackStyles.marginBottom || '6px',
        padding: fallbackStyles.padding || '12px',
        whiteSpace: 'normal'
    };

    const resolve = (prop) => {
        if (overrides && overrides[prop]) return overrides[prop];
        if (fallbackStyles && fallbackStyles[prop]) return fallbackStyles[prop];
        return defaults[prop];
    };

    const wrapValue = overrides && overrides.textWrap === 'nowrap' ? 'nowrap' : 'normal';

    let css = `.${className} {\n`;
    css += `    font-family: ${resolve('fontFamily')};\n`;
    css += `    font-size: ${resolve('fontSize')};\n`;
    css += `    font-weight: ${resolve('fontWeight')};\n`;
    css += `    line-height: ${resolve('lineHeight')};\n`;
    css += `    letter-spacing: ${resolve('letterSpacing')};\n`;
    css += `    border-radius: ${resolve('borderRadius')};\n`;
    css += `    margin-top: ${resolve('marginTop')};\n`;
    css += `    margin-bottom: ${resolve('marginBottom')};\n`;
    css += `    padding: ${resolve('padding')};\n`;
    css += `    white-space: ${wrapValue};\n`;
    css += '}\n\n';

    return css;
}

/**
 * Generate HTML section for SRP or VDP
 */
function generateHtmlSection(placement, selectedCtas, ctaConfigs, ctaLabels, oemData) {
    const placementKey = placement.toLowerCase();
    const wrapperClass = placement === 'SRP' ? 'cn-srp-only' : 'cn-vdp-only';

    let html = `<!-- ${placement} CTAs -->\n`;
    html += `<div class="${wrapperClass}">\n`;

    selectedCtas.forEach(ctaType => {
        const config = ctaConfigs[ctaType];

        // Skip if not configured for this placement
        if (!config.placement[placementKey]) {
            return;
        }

        const label = config.useCustomLabel
            ? (config.customLabel || config.label)
            : config.label;

        // Add mobile/desktop wrappers if specified
        let openWrapper = '';
        let closeWrapper = '';

        if (config.placement.mobileOnly && !config.placement.desktopOnly) {
            openWrapper = '<div class="cn-mobile-only">';
            closeWrapper = '</div>';
        } else if (config.placement.desktopOnly && !config.placement.mobileOnly) {
            openWrapper = '<div class="cn-desktop-only">';
            closeWrapper = '</div>';
        }

        html += `    ${openWrapper}<div>\n`;
        html += '        <a';

        // Add all attributes including class
        html += generateCtaAttributes(ctaType, config, ctaLabels, placementKey);

        html += `>${label}</a>\n`;
        html += `    </div>${closeWrapper}\n`;
    });

    html += '</div>';

    return html;
}

/**
 * Generate attributes for CTA anchor tag
 */
function generateCtaAttributes(ctaType, config, ctaLabels, placement) {
    let attrs = '';
    let styleClass;

    // Handle custom styles with unique class name
    if (config.styleType === '__custom__') {
        styleClass = `custom-${utils.sanitizeCssClassName(ctaType)}`;
    } else {
        styleClass = utils.sanitizeCssClassName(config.styleType || 'primary');
    }

    // Add placement-specific styling class
    const placementClass = placement === 'srp' ? 'convertnow-srp' : 'convertnow-vdp';
    const baseClass = `demo-cta demo-cta-${styleClass} ${placementClass}`;
    let className = baseClass;

    // Add special classes for BuyNow
    if (ctaType === 'personalize_payment' && !config.useDeeplink) {
        className += ' cn-buynow-b1';
    }

    // Add special class for deeplink
    if (config.useDeeplink) {
        className += ' cn-buy-now';
    }

    // Always add href for proper anchor behavior
    attrs += ' href="#"';

    // Always add class attribute
    attrs += ` class="${className}"`;

    // Accessibility attributes for button-like anchors
    attrs += ' role="button" tabindex="0"';

    // Data-vin attribute for BuyNow and deeplinked CTAs
    if (ctaType === 'personalize_payment' || config.useDeeplink) {
        attrs += ' data-vin="{vin}"';
    }

    // Deeplink step attribute
    if (config.useDeeplink && config.deeplinkStep) {
        attrs += ` drtstp="${config.deeplinkStep}"`;
    }

    // Onclick handler for regular CTAs (not BuyNow, not deeplinked)
    if (ctaType !== 'personalize_payment' && !config.useDeeplink) {
        const onclick = utils.getOnclickPattern(ctaType, config, ctaLabels);
        if (onclick) {
            attrs += ` onclick="${onclick}"`;
        }
    }

    return attrs;
}

/**
 * Generate standalone preview HTML (for testing)
 */
export function generatePreviewHtml(stateData, loadedData) {
    const code = generateCode(stateData, loadedData);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CTA Preview</title>
</head>
<body>
    <div style="max-width: 400px; margin: 50px auto; padding: 20px; background: #f5f5f5;">
        ${code}
    </div>
</body>
</html>`;
}

/**
 * Format code with proper indentation
 */
export function formatCode(code) {
    // Basic code formatting
    let formatted = code;

    // Ensure consistent line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Trim trailing whitespace
    formatted = formatted.split('\n').map(line => line.trimEnd()).join('\n');

    return formatted.trim();
}

/**
 * Validate generated code
 */
export function validateCode(code) {
    const errors = [];

    // Check for basic HTML structure
    if (!code.includes('<style>')) {
        errors.push('Missing CSS styles');
    }

    if (!code.includes('demo-cta')) {
        errors.push('Missing CTA elements');
    }

    // Check for unclosed tags
    const openDivs = (code.match(/<div/g) || []).length;
    const closeDivs = (code.match(/<\/div>/g) || []).length;
    if (openDivs !== closeDivs) {
        errors.push('Mismatched div tags');
    }

    const openAnchors = (code.match(/<a /g) || []).length;
    const closeAnchors = (code.match(/<\/a>/g) || []).length;
    if (openAnchors !== closeAnchors) {
        errors.push('Mismatched anchor tags');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
