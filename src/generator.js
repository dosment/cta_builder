/**
 * Code Generator Module
 * Generates HTML/CSS code for CTAs based on configuration
 */

import * as utils from './utils.js';

/**
 * Main code generation function
 */
export function generateCode(stateData, loadedData) {
    const { oemData, selectedCtas, ctaConfigs } = stateData;
    const { ctaLabels } = loadedData;

    let code = '';

    // Generate CSS
    code += generateCss(oemData, selectedCtas, ctaConfigs);
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
function generateCss(oemData, selectedCtas, ctaConfigs) {
    let css = '<style>\n';

    // Base .demo-cta class with common styles
    css += '.demo-cta {\n';
    css += '    display: block;\n';
    css += '    text-align: center;\n';
    css += '    text-decoration: none;\n';
    css += '    cursor: pointer;\n';
    css += '    border-style: solid;\n';
    css += '}\n\n';

    // Generate unique style classes for each CTA
    selectedCtas.forEach(ctaType => {
        const config = ctaConfigs[ctaType];
        const styles = oemData.styles[config.styleType];
        const customStyles = config.customStyles || {};
        const className = utils.sanitizeCssClassName(ctaType);

        // Merge base styles with custom overrides
        const mergedStyles = { ...styles };
        if (customStyles.borderRadius) mergedStyles.borderRadius = customStyles.borderRadius;
        if (customStyles.marginTop) mergedStyles.marginTop = customStyles.marginTop;
        if (customStyles.marginBottom) mergedStyles.marginBottom = customStyles.marginBottom;
        if (customStyles.padding) mergedStyles.padding = customStyles.padding;

        css += `.demo-cta-${className} {\n`;
        css += `    ${utils.generateCssFromStyles(mergedStyles)};\n`;
        css += '}\n\n';

        // Hover styles
        css += `.demo-cta-${className}:hover {\n`;
        css += `    background-color: ${styles.hoverBackgroundColor};\n`;
        css += `    color: ${styles.hoverTextColor};\n`;
        css += '}\n\n';
    });

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

        const label = config.customLabel || config.label;

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
        html += generateCtaAttributes(ctaType, config, ctaLabels);

        html += `>${label}</a>\n`;
        html += `    </div>${closeWrapper}\n`;
    });

    html += '</div>';

    return html;
}

/**
 * Generate attributes for CTA anchor tag
 */
function generateCtaAttributes(ctaType, config, ctaLabels) {
    let attrs = '';
    const baseClass = `demo-cta demo-cta-${utils.sanitizeCssClassName(ctaType)}`;
    let className = baseClass;

    // Add special classes for BuyNow
    if (ctaType === 'personalize_payment' && !config.useDeeplink) {
        className += ' cn-buynow-b1';
    }

    // Add special class for deeplink
    if (config.useDeeplink) {
        className += ' cn-buy-now';
    }

    // Always add class attribute
    attrs += ` class="${className}"`;

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
