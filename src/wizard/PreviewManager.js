/**
 * PreviewManager
 * Handles all preview rendering (sidebar and main preview)
 */

import * as utils from '../utils.js';

export class PreviewManager {
    constructor(appState) {
        this.appState = appState;
        this.previewThemeToggleBtn = null;
        this.themeToggleLabel = null;
    }

    /**
     * Setup preview theme toggle
     */
    setupThemeToggle() {
        this.previewThemeToggleBtn = document.getElementById('preview-theme-toggle');
        this.themeToggleLabel = document.getElementById('theme-toggle-label');

        if (this.previewThemeToggleBtn) {
            this.previewThemeToggleBtn.addEventListener('change', () => this.togglePreviewTheme());
            this.updatePreviewThemeLabel(false);
        }
    }

    /**
     * Toggle preview theme between light and dark
     */
    togglePreviewTheme() {
        const sidebar = document.getElementById('preview-sidebar');
        if (!sidebar) return;

        const isDark = this.previewThemeToggleBtn.checked;
        if (isDark) {
            sidebar.classList.add('dark');
        } else {
            sidebar.classList.remove('dark');
        }
        this.updatePreviewThemeLabel(isDark);
    }

    /**
     * Update theme toggle label text
     */
    updatePreviewThemeLabel(isDark) {
        if (!this.themeToggleLabel) return;
        this.themeToggleLabel.textContent = isDark ? 'Dark' : 'Light';
    }

    /**
     * Update live preview sidebar
     */
    updateLivePreview() {
        const livePreviewArea = document.getElementById('live-preview-area');

        // If no OEM selected, show placeholder
        if (!this.appState.data.oemData) {
            livePreviewArea.innerHTML = '<p class="text-muted">Select an OEM to see preview</p>';
            return;
        }

        // If OEM selected but no CTAs, show sample button with OEM colors
        if (this.appState.data.selectedCtas.length === 0) {
            this.renderSampleButton(livePreviewArea);
            return;
        }

        // Clear and render preview CTAs for both SRP and VDP
        utils.clearElement(livePreviewArea);

        // Check if there are any SRP CTAs
        const hasSrpCtas = this.appState.data.selectedCtas.some(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            return config && config.placement.srp;
        });

        // Check if there are any VDP CTAs
        const hasVdpCtas = this.appState.data.selectedCtas.some(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            return config && config.placement.vdp;
        });

        // Render SRP section
        if (hasSrpCtas) {
            const srpSection = utils.createElement('div', { className: 'preview-section' });
            const srpTitle = utils.createElement('div', { className: 'preview-section-title' }, 'SRP Buttons');
            srpSection.appendChild(srpTitle);

            const srpContainer = utils.createElement('div', {});
            this.renderPreviewCtas(srpContainer, 'srp');
            srpSection.appendChild(srpContainer);
            livePreviewArea.appendChild(srpSection);
        }

        // Render VDP section
        if (hasVdpCtas) {
            const vdpSection = utils.createElement('div', { className: 'preview-section' });
            const vdpTitle = utils.createElement('div', { className: 'preview-section-title' }, 'VDP Buttons');
            vdpSection.appendChild(vdpTitle);

            const vdpContainer = utils.createElement('div', {});
            this.renderPreviewCtas(vdpContainer, 'vdp');
            vdpSection.appendChild(vdpContainer);
            livePreviewArea.appendChild(vdpSection);
        }

        // If no CTAs are enabled for either placement
        if (!hasSrpCtas && !hasVdpCtas) {
            livePreviewArea.innerHTML = '<p class="text-muted">Enable SRP or VDP placement to see CTAs here.</p>';
        }
    }

    /**
     * Render sample button when no CTAs selected
     */
    renderSampleButton(container) {
        utils.clearElement(container);
        const oemData = this.appState.data.oemData;
        const styles = oemData.styles.primary;
        const appliedStyles = this.getPreviewStyles(styles, 'srp');

        const sampleButton = utils.createElement('a', {
            className: 'demo-cta demo-cta-primary',
            href: '#',
            style: this.buildButtonStyle(appliedStyles)
        }, `Sample ${oemData.name} Button`);

        // Hover effects
        sampleButton.onmouseenter = () => {
            sampleButton.style.backgroundColor = styles.hoverBackgroundColor;
            sampleButton.style.color = styles.hoverTextColor;
        };
        sampleButton.onmouseleave = () => {
            sampleButton.style.backgroundColor = appliedStyles.backgroundColor;
            sampleButton.style.color = appliedStyles.textColor;
        };

        container.appendChild(sampleButton);
    }

    /**
     * Render preview CTAs
     * @returns {number} Number of CTAs rendered
     */
    renderPreviewCtas(container, mode = 'srp') {
        const oemData = this.appState.data.oemData;
        if (!oemData) return 0;

        let rendered = 0;

        this.appState.data.selectedCtas.forEach(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            if (!config) return;

            const placement = this.resolvePlacementForPreview(config, mode);
            if (!placement) return;

            // Handle custom styles
            let styles, appliedStyles;
            if (config.styleType === '__custom__' && config.customStyle) {
                // Use custom colors
                styles = {
                    backgroundColor: config.customStyle.backgroundColor,
                    textColor: config.customStyle.textColor,
                    borderColor: config.customStyle.borderColor,
                    borderWidth: '2px',
                    textTransform: 'none',
                    hoverBackgroundColor: config.customStyle.textColor,
                    hoverTextColor: config.customStyle.backgroundColor,
                    transition: 'all 0.3s ease'
                };
                appliedStyles = this.getPreviewStyles(styles, placement);
            } else {
                // Use OEM styles
                styles = oemData.styles[config.styleType] || oemData.styles.primary;
                appliedStyles = this.getPreviewStyles(styles, placement);
            }

            const buttonLabel = config.useCustomLabel
                ? (config.customLabel || config.label)
                : config.label;

            const styleClass = utils.sanitizeCssClassName(config.styleType || 'primary');
            const button = utils.createElement('a', {
                className: `demo-cta demo-cta-${styleClass}`,
                href: '#',
                style: this.buildButtonStyle(appliedStyles)
            }, buttonLabel);

            const baseStyles = styles;

            button.onmouseenter = () => {
                button.style.backgroundColor = baseStyles.hoverBackgroundColor;
                button.style.color = baseStyles.hoverTextColor;
            };
            button.onmouseleave = () => {
                button.style.backgroundColor = appliedStyles.backgroundColor;
                button.style.color = appliedStyles.textColor;
            };

            container.appendChild(button);
            rendered++;
        });

        return rendered;
    }

    /**
     * Resolve placement for preview mode
     */
    resolvePlacementForPreview(config, mode) {
        if (mode === 'srp') {
            return config.placement.srp ? 'srp' : null;
        }
        if (mode === 'vdp') {
            return config.placement.vdp ? 'vdp' : null;
        }

        // live preview mode - prioritize SRP, fallback to VDP
        if (config.placement.srp) return 'srp';
        if (config.placement.vdp) return 'vdp';
        return null;
    }

    /**
     * Get preview styles with advanced overrides
     */
    getPreviewStyles(baseStyles, placement) {
        const advanced = this.appState.data.advancedStyles?.[placement] || {};

        const resolve = (prop, fallbackKey) => {
            if (advanced[prop]) {
                return advanced[prop];
            }
            if (baseStyles && baseStyles[prop]) {
                return baseStyles[prop];
            }
            return this.getFallbackValue(fallbackKey || prop);
        };

        return {
            backgroundColor: baseStyles.backgroundColor,
            textColor: baseStyles.textColor,
            borderColor: baseStyles.borderColor,
            borderWidth: resolve('borderWidth'),
            borderRadius: resolve('borderRadius'),
            textTransform: baseStyles.textTransform,
            fontSize: resolve('fontSize'),
            fontWeight: resolve('fontWeight'),
            fontFamily: resolve('fontFamily'),
            lineHeight: resolve('lineHeight'),
            letterSpacing: resolve('letterSpacing'),
            padding: resolve('padding'),
            marginTop: resolve('marginTop'),
            marginBottom: resolve('marginBottom'),
            whiteSpace: advanced.textWrap === 'nowrap' ? 'nowrap' : 'normal',
            transition: baseStyles.transition
        };
    }

    /**
     * Get fallback value for a style property
     */
    getFallbackValue(property) {
        const defaults = {
            fontFamily: 'inherit',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0px',
            borderRadius: '4px',
            borderWidth: '2px',
            marginTop: '6px',
            marginBottom: '6px',
            padding: '12px',
            textWrap: 'wrap'
        };

        return defaults[property] || '';
    }

    /**
     * Build button style string
     */
    buildButtonStyle(styles) {
        return `
            display: inline-flex;
            width: 100%;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: ${styles.backgroundColor};
            color: ${styles.textColor};
            border: ${styles.borderWidth} solid ${styles.borderColor};
            border-radius: ${styles.borderRadius};
            text-transform: ${styles.textTransform};
            font-size: ${styles.fontSize};
            font-weight: ${styles.fontWeight};
            line-height: ${styles.lineHeight};
            letter-spacing: ${styles.letterSpacing};
            padding: ${styles.padding};
            margin-top: ${styles.marginTop};
            margin-bottom: ${styles.marginBottom};
            font-family: ${styles.fontFamily};
            white-space: ${styles.whiteSpace};
            transition: ${styles.transition};
            text-decoration: none;
            cursor: pointer;
        `;
    }
}
