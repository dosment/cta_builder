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
        code += generateHtmlSection('SRP', selectedCtas, ctaConfigs, ctaLabels, oemData, advancedStyles);
        code += '\n\n';
    }

    // Generate HTML for VDP
    const hasVdpCtas = selectedCtas.some(type => ctaConfigs[type].placement.vdp);
    if (hasVdpCtas) {
        code += generateHtmlSection('VDP', selectedCtas, ctaConfigs, ctaLabels, oemData, advancedStyles);
    }

    return code;
}

/**
 * Generate CSS styles
 */
function generateCss(oemData, selectedCtas, ctaConfigs, advancedStyles) {
    let css = '<style>\n';

    // Base .demo-cta class — comprehensive reset so buttons never inherit from site
    const fontFamily = oemData.font
        ? `'${oemData.font}', Arial, Helvetica, sans-serif`
        : 'Arial, Helvetica, sans-serif';
    css += '.demo-cta {\n';
    css += '    display: inline-flex;\n';
    css += '    justify-content: center;\n';
    css += '    align-items: center;\n';
    css += '    text-align: center;\n';
    css += '    text-decoration: none !important;\n';
    css += `    font-family: ${fontFamily};\n`;
    css += '    font-size: 16px;\n';
    css += '    font-weight: normal;\n';
    css += '    line-height: 1.4;\n';
    css += '    letter-spacing: 0.08em;\n';
    css += '    text-transform: uppercase;\n';
    css += '    white-space: normal;\n';
    css += '    cursor: pointer;\n';
    css += '    border-style: solid;\n';
    css += '    border-width: 1px;\n';
    css += '    border-radius: 6px;\n';
    css += '    padding: 8px;\n';
    css += '    margin-top: 4px;\n';
    css += '    margin-bottom: 4px;\n';
    css += '    width: 100%;\n';
    css += '    box-sizing: border-box;\n';
    css += '    transition: all 0.3s ease;\n';
    css += '}\n\n';

    css += '.demo-cta:hover {\n';
    css += '    text-decoration: none !important;\n';
    css += '}\n\n';

    const styleTypeMap = new Map();
    const customStyleMap = new Map(); // Track custom styles by ctaType

    selectedCtas.forEach(ctaType => {
        const config = ctaConfigs[ctaType];
        const styleType = utils.sanitizeCssClassName(config.styleType || 'oemTestFilled');

        if (config.styleType === '__custom__' && config.customStyle) {
            // Store custom style with unique identifier
            customStyleMap.set(ctaType, config.customStyle);
        } else if (!styleTypeMap.has(styleType)) {
            const styles = oemData.styles[config.styleType] || oemData.styles.oemTestFilled;
            styleTypeMap.set(styleType, styles);
        }
    });

    // Check if we need separate SRP/VDP classes
    const separateStyling = advancedStyles?.separateStyling || false;
    const srpStyles = separateStyling ? (advancedStyles.srp || {}) : (advancedStyles.buttons || {});
    const vdpStyles = separateStyling ? (advancedStyles.vdp || {}) : (advancedStyles.buttons || {});
    const needsSeparateClasses = separateStyling && JSON.stringify(srpStyles) !== JSON.stringify(vdpStyles);

    // Generate standard OEM styles
    styleTypeMap.forEach((styleData, styleType) => {
        if (!styleData) return;

        if (needsSeparateClasses) {
            // Generate separate classes for SRP and VDP
            const mergedSrp = mergeAdvancedStyles(styleData, advancedStyles, 'srp');
            const mergedVdp = mergeAdvancedStyles(styleData, advancedStyles, 'vdp');

            // SRP variant
            css += `.cn-srp-only .demo-cta-${styleType} {\n`;
            css += `    ${utils.generateCssFromStyles(mergedSrp)};\n`;
            css += '}\n\n';

            // VDP variant
            css += `.cn-vdp-only .demo-cta-${styleType} {\n`;
            css += `    ${utils.generateCssFromStyles(mergedVdp)};\n`;
            css += '}\n\n';
        } else {
            // Unified: merge advanced styles directly into base class
            const mergedStyles = mergeAdvancedStyles(styleData, advancedStyles);

            css += `.demo-cta-${styleType} {\n`;
            css += `    ${utils.generateCssFromStyles(mergedStyles)};\n`;
            css += '}\n\n';
        }

        // Hover states — respect advancedStyles hover setting
        if (needsSeparateClasses) {
            // Separate hover for SRP and VDP
            const srpHover = getHoverColorsForPlacement(styleData, advancedStyles, 'srp');
            const vdpHover = getHoverColorsForPlacement(styleData, advancedStyles, 'vdp');

            css += `.cn-srp-only .demo-cta-${styleType}:hover {\n`;
            css += `    background-color: ${srpHover.backgroundColor};\n`;
            css += `    color: ${srpHover.textColor};\n`;
            css += `    border-color: ${srpHover.borderColor};\n`;
            css += '}\n\n';

            css += `.cn-vdp-only .demo-cta-${styleType}:hover {\n`;
            css += `    background-color: ${vdpHover.backgroundColor};\n`;
            css += `    color: ${vdpHover.textColor};\n`;
            css += `    border-color: ${vdpHover.borderColor};\n`;
            css += '}\n\n';
        } else {
            const hoverColors = getHoverColorsForGeneration(styleData, advancedStyles, separateStyling);
            css += `.demo-cta-${styleType}:hover {\n`;
            css += `    background-color: ${hoverColors.backgroundColor};\n`;
            css += `    color: ${hoverColors.textColor};\n`;
            css += `    border-color: ${hoverColors.borderColor};\n`;
            css += '}\n\n';
        }
    });

    // Generate custom styles for each CTA with custom styling
    // Colors come from user picks; padding/margin/etc come from base .demo-cta
    // Advanced style overrides are merged in just like OEM styles
    customStyleMap.forEach((customStyle, ctaType) => {
        const sanitizedType = utils.sanitizeCssClassName(ctaType);

        // Base custom style — only colors + text-transform override
        const baseCustom = {
            backgroundColor: customStyle.backgroundColor,
            textColor: customStyle.textColor,
            borderColor: customStyle.borderColor,
            textTransform: 'none'
        };

        if (needsSeparateClasses) {
            const mergedSrp = mergeAdvancedStyles(baseCustom, advancedStyles, 'srp');
            const mergedVdp = mergeAdvancedStyles(baseCustom, advancedStyles, 'vdp');

            css += `.cn-srp-only .demo-cta-custom-${sanitizedType} {\n`;
            css += `    ${utils.generateCssFromStyles(mergedSrp)};\n`;
            css += '}\n\n';

            css += `.cn-vdp-only .demo-cta-custom-${sanitizedType} {\n`;
            css += `    ${utils.generateCssFromStyles(mergedVdp)};\n`;
            css += '}\n\n';
        } else {
            const merged = mergeAdvancedStyles(baseCustom, advancedStyles);

            css += `.demo-cta-custom-${sanitizedType} {\n`;
            css += `    ${utils.generateCssFromStyles(merged)};\n`;
            css += '}\n\n';
        }

        // Custom hover — respect advancedStyles hover setting
        const customBase = {
            backgroundColor: customStyle.backgroundColor,
            textColor: customStyle.textColor,
            borderColor: customStyle.borderColor,
            // Custom styles don't have OEM hover colors, so default is invert
            hoverBackgroundColor: customStyle.textColor,
            hoverTextColor: customStyle.backgroundColor,
            hoverBorderColor: customStyle.textColor
        };
        if (needsSeparateClasses) {
            const srpHover = getHoverColorsForPlacement(customBase, advancedStyles, 'srp');
            const vdpHover = getHoverColorsForPlacement(customBase, advancedStyles, 'vdp');

            css += `.cn-srp-only .demo-cta-custom-${sanitizedType}:hover {\n`;
            css += `    background-color: ${srpHover.backgroundColor};\n`;
            css += `    color: ${srpHover.textColor};\n`;
            css += `    border-color: ${srpHover.borderColor};\n`;
            css += '}\n\n';

            css += `.cn-vdp-only .demo-cta-custom-${sanitizedType}:hover {\n`;
            css += `    background-color: ${vdpHover.backgroundColor};\n`;
            css += `    color: ${vdpHover.textColor};\n`;
            css += `    border-color: ${vdpHover.borderColor};\n`;
            css += '}\n\n';
        } else {
            const customHoverColors = getHoverColorsForGeneration(customBase, advancedStyles, separateStyling);
            css += `.demo-cta-custom-${sanitizedType}:hover {\n`;
            css += `    background-color: ${customHoverColors.backgroundColor};\n`;
            css += `    color: ${customHoverColors.textColor};\n`;
            css += `    border-color: ${customHoverColors.borderColor};\n`;
            css += '}\n\n';
        }
    });

    // Advanced styles are now merged into OEM classes above, no separate override classes needed

    // Special CSS for deeplinked CTAs
    const hasDeeplink = selectedCtas.some(type => ctaConfigs[type].useDeeplink);
    if (hasDeeplink) {
        css += '.cn-bn1 {\n';
        css += '    display: none !important;\n';
        css += '}\n\n';
    }

    // Sheen effect CSS (if any CTA has it enabled)
    const hasSheen = selectedCtas.some(type => ctaConfigs[type].enableSheen);
    if (hasSheen) {
        css += '/* Sheen Effect for Buy Now Buttons */\n';
        css += '.cn-sheen-enabled {\n';
        css += '    position: relative;\n';
        css += '    overflow: hidden;\n';
        css += '    contain: paint;\n';
        css += '    transform: translateZ(0);\n';
        css += '}\n\n';

        css += '.cn-sheen-enabled::after {\n';
        css += '    content: "";\n';
        css += '    position: absolute;\n';
        css += '    top: 0;\n';
        css += '    left: -60%;\n';
        css += '    height: 100%;\n';
        css += '    width: 40%;\n';
        css += '    background: linear-gradient(110deg,\n';
        css += '        rgba(255,255,255,0) 0%,\n';
        css += '        rgba(255,255,255,0.35) 45%,\n';
        css += '        rgba(255,255,255,0.65) 50%,\n';
        css += '        rgba(255,255,255,0.35) 55%,\n';
        css += '        rgba(255,255,255,0) 100%);\n';
        css += '    transform: skewX(-20deg);\n';
        css += '    pointer-events: none;\n';
        css += '    opacity: 0.95;\n';
        css += '    will-change: left;\n';
        css += '    animation: cn-sheen-cycle 15s ease-out infinite;\n';
        css += '}\n\n';

        css += '@keyframes cn-sheen-cycle {\n';
        css += '    0%   { left: -60%; }\n';
        css += '    4.67% { left: 120%; }\n';
        css += '    4.68% { left: -60%; }\n';
        css += '    100% { left: -60%; }\n';
        css += '}\n\n';

        css += '.cn-sheen-enabled:hover,\n';
        css += '.cn-sheen-enabled:active {\n';
        css += '    filter: brightness(1.12);\n';
        css += '    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.22), inset 0 -8px 12px rgba(0,0,0,0.12);\n';
        css += '}\n\n';

        // Generate custom timing overrides for each CTA with custom interval
        selectedCtas.forEach(ctaType => {
            const config = ctaConfigs[ctaType];
            if (config.enableSheen) {
                const interval = config.sheenInterval || 15;
                const hasCustom = interval !== 15;

                if (hasCustom) {
                    const sanitizedType = utils.sanitizeCssClassName(ctaType);
                    // Fixed sweep speed of 0.7s
                    const sweep = 0.7;
                    const sweepPercent = ((sweep / interval) * 100).toFixed(2);

                    // Generate custom keyframe animation
                    const snapPercent = (parseFloat(sweepPercent) + 0.01).toFixed(2);
                    css += `@keyframes cn-sheen-cycle-${sanitizedType} {\n`;
                    css += '    0%   { left: -60%; }\n';
                    css += `    ${sweepPercent}% { left: 120%; }\n`;
                    css += `    ${snapPercent}% { left: -60%; }\n`;
                    css += '    100% { left: -60%; }\n';
                    css += '}\n\n';

                    // Apply custom animation to this CTA
                    css += `.cn-sheen-${sanitizedType}::after {\n`;
                    css += `    animation: cn-sheen-cycle-${sanitizedType} ${interval}s ease-out infinite;\n`;
                    css += '}\n\n';
                }
            }
        });
    }

    // Device visibility classes - only generate if actually used
    const hasMobileOnly = selectedCtas.some(type => {
        const config = ctaConfigs[type];
        return config.placement.mobileOnly && !config.placement.desktopOnly;
    });

    const hasDesktopOnly = selectedCtas.some(type => {
        const config = ctaConfigs[type];
        return config.placement.desktopOnly && !config.placement.mobileOnly;
    });

    if (hasMobileOnly) {
        css += '/* Mobile-only visibility */\n';
        css += '.cn-mobile-only {\n';
        css += '    display: block;\n';
        css += '}\n\n';
        css += '@media (min-width: 768px) {\n';
        css += '    .cn-mobile-only {\n';
        css += '        display: none !important;\n';
        css += '    }\n';
        css += '}\n\n';
    }

    if (hasDesktopOnly) {
        css += '/* Desktop-only visibility */\n';
        css += '.cn-desktop-only {\n';
        css += '    display: none;\n';
        css += '}\n\n';
        css += '@media (min-width: 768px) {\n';
        css += '    .cn-desktop-only {\n';
        css += '        display: block !important;\n';
        css += '    }\n';
        css += '}\n\n';
    }

    css += '</style>';

    return css;
}

/**
 * Get hover colors for generation based on advancedStyles settings
 * Used when separate styling is disabled (unified buttons)
 */
function getHoverColorsForGeneration(baseStyles, advancedStyles, separateStyling) {
    const placement = separateStyling ? 'srp' : 'buttons';
    return getHoverColorsForPlacement(baseStyles, advancedStyles, placement);
}

/**
 * Get hover colors for a specific placement
 */
function getHoverColorsForPlacement(baseStyles, advancedStyles, placement) {
    const styles = advancedStyles?.[placement] || {};
    const hoverStyle = styles.hoverStyle || null;
    const hoverCustomColors = styles.hoverCustomColors || null;
    return utils.resolveHoverColors(baseStyles, hoverStyle, hoverCustomColors);
}

/**
 * Merge advanced styling overrides into base OEM style data
 * @param {Object} baseStyles - Base OEM style object
 * @param {Object} advancedStyles - Advanced styling configuration
 * @param {String} placement - Optional placement ('srp' or 'vdp') for separate styling
 */
function mergeAdvancedStyles(baseStyles, advancedStyles, placement = null) {
    if (!advancedStyles) return baseStyles;

    const merged = { ...baseStyles };
    const separateStyling = advancedStyles.separateStyling || false;

    // Determine which styles to apply
    let stylesToApply;
    if (separateStyling && placement) {
        // Use placement-specific styles
        stylesToApply = advancedStyles[placement] || {};
    } else {
        // Use unified buttons styles
        stylesToApply = advancedStyles.buttons || {};
    }

    // Apply overrides
    if (stylesToApply.fontFamily) merged.fontFamily = stylesToApply.fontFamily;
    if (stylesToApply.textTransform) merged.textTransform = stylesToApply.textTransform;
    if (stylesToApply.fontSize) merged.fontSize = stylesToApply.fontSize;
    if (stylesToApply.fontWeight) merged.fontWeight = stylesToApply.fontWeight;
    if (stylesToApply.lineHeight) merged.lineHeight = stylesToApply.lineHeight;
    if (stylesToApply.letterSpacing) merged.letterSpacing = stylesToApply.letterSpacing;
    if (stylesToApply.borderRadius) merged.borderRadius = stylesToApply.borderRadius;
    if (stylesToApply.borderWidth) merged.borderWidth = stylesToApply.borderWidth;
    if (stylesToApply.marginTop) merged.marginTop = stylesToApply.marginTop;
    if (stylesToApply.marginBottom) merged.marginBottom = stylesToApply.marginBottom;
    if (stylesToApply.padding) merged.padding = stylesToApply.padding;

    // Handle text wrap
    if (stylesToApply.textWrap === 'nowrap') {
        merged.whiteSpace = 'nowrap';
    } else if (stylesToApply.textWrap === 'wrap') {
        merged.whiteSpace = 'normal';
    }

    return merged;
}


/**
 * Generate HTML section for SRP or VDP
 */
function generateHtmlSection(placement, selectedCtas, ctaConfigs, ctaLabels, oemData, advancedStyles) {
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
        const safeLabel = utils.escapeHtml(label);

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

        html += `>${safeLabel}</a>\n`;
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
        styleClass = utils.sanitizeCssClassName(config.styleType || 'oemTestFilled');
    }

    // Simple class name - advanced styles are already merged into the OEM class
    let className = `demo-cta demo-cta-${styleClass}`;

    // Add special classes for BuyNow
    if (ctaType === 'personalize_payment' && !config.useDeeplink) {
        className += ' cn-buynow-b1';
    }

    // Add special class for deeplink
    if (config.useDeeplink) {
        className += ' cn-buy-now';
    }

    // Add sheen class if enabled
    if (config.enableSheen) {
        className += ' cn-sheen-enabled';
        // Add timing-specific class if custom interval is set
        const hasCustomInterval = config.sheenInterval && config.sheenInterval !== 15;
        if (hasCustomInterval) {
            const sanitizedType = utils.sanitizeCssClassName(ctaType);
            className += ` cn-sheen-${sanitizedType}`;
        }
    }

    // Only add href if there's an actual URL destination
    // (onclick handlers and deeplinks don't need href="#")

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
