/**
 * StylingStep
 * Step 4: Styling Configuration (Labels and Style Types)
 */

import * as utils from '../../utils.js';
import { StyleSelector } from '../components/StyleSelector.js';

export class StylingStep {
    constructor(appState, previewManager, validationManager) {
        this.appState = appState;
        this.previewManager = previewManager;
        this.validationManager = validationManager;
        this.styleSelector = new StyleSelector(
            appState,
            (updatePreview) => this.handleStyleChange(updatePreview),
            previewManager
        );
    }

    /**
     * Render styling configuration step
     */
    render() {
        const container = document.getElementById('styling-config-list');
        utils.clearElement(container);

        const ctaLabels = this.appState.loadedData.ctaLabels;

        this.appState.data.selectedCtas.forEach(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Label selection
            const labelRow = this.styleSelector.createLabelSelection(ctaType, config, ctaInfo);
            configItem.appendChild(labelRow);

            // Style type selection
            const styleRow = this.styleSelector.createStyleSelection(ctaType, config);
            configItem.appendChild(styleRow);

            // Add sheen checkbox for Buy Now CTAs (personalize_payment only)
            if (this.isBuyNowCta(ctaType, config)) {
                const sheenContainer = this.createSheenCheckbox(ctaType, config);
                configItem.appendChild(sheenContainer);
            }

            container.appendChild(configItem);
        });
    }

    /**
     * Handle style change
     */
    handleStyleChange(updatePreview = false) {
        this.render();
        if (updatePreview) {
            this.previewManager.updateLivePreview();
        }
    }

    /**
     * Check if CTA is a Buy Now button
     * Buy Now buttons are:
     * - personalize_payment (always, regardless of deeplink)
     */
    isBuyNowCta(ctaType, config) {
        return ctaType === 'personalize_payment';
    }

    /**
     * Create sheen effect checkbox
     */
    createSheenCheckbox(ctaType, config) {
        const container = utils.createElement('div', { className: 'sheen-checkbox-container' });

        const label = utils.createElement('label', { className: 'sheen-checkbox-label' });

        const checkbox = utils.createElement('input', {
            type: 'checkbox',
            id: `sheen-${ctaType}`,
            checked: config.enableSheen || false
        });

        checkbox.addEventListener('change', (e) => {
            config.enableSheen = e.target.checked;
            const timingControl = container.querySelector('.sheen-timing-control');
            if (timingControl) {
                timingControl.style.display = e.target.checked ? 'block' : 'none';
            }
            this.previewManager.updateLivePreview();
        });

        const labelText = utils.createElement('span', {}, 'Enable Sheen Effect');

        label.appendChild(checkbox);
        label.appendChild(labelText);

        const description = utils.createElement('div', {
            className: 'sheen-description'
        }, 'Adds an animated light reflection that sweeps across the button');

        container.appendChild(label);
        container.appendChild(description);

        // Timing control (shown only when sheen is enabled)
        const timingControl = this.createSheenTimingControl(ctaType, config);
        timingControl.style.display = config.enableSheen ? 'block' : 'none';
        container.appendChild(timingControl);

        return container;
    }

    /**
     * Create sheen timing control
     */
    createSheenTimingControl(ctaType, config) {
        const timingContainer = utils.createElement('div', { className: 'sheen-timing-control' });

        // Loop Interval Control
        const intervalLabel = utils.createElement('label', {
            className: 'sheen-timing-label',
            for: `sheen-interval-${ctaType}`
        });

        const intervalLabelSpan = utils.createElement('span', {}, 'Loop Interval: ');
        const intervalValueSpan = utils.createElement('span', {
            className: 'sheen-timing-value',
            id: `sheen-interval-value-${ctaType}`
        }, this.getSheenIntervalLabel(config.sheenInterval || 15));

        intervalLabel.appendChild(intervalLabelSpan);
        intervalLabel.appendChild(intervalValueSpan);

        const intervalSlider = utils.createElement('input', {
            type: 'range',
            id: `sheen-interval-${ctaType}`,
            className: 'sheen-timing-slider',
            min: '5',
            max: '30',
            step: '1',
            value: config.sheenInterval || 15
        });

        intervalSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            config.sheenInterval = value;
            const valueDisplay = document.getElementById(`sheen-interval-value-${ctaType}`);
            if (valueDisplay) {
                valueDisplay.textContent = this.getSheenIntervalLabel(value);
            }
            this.previewManager.updateLivePreview();
        });

        timingContainer.appendChild(intervalLabel);
        timingContainer.appendChild(intervalSlider);

        return timingContainer;
    }

    /**
     * Get human-readable label for sheen interval
     */
    getSheenIntervalLabel(seconds) {
        if (seconds <= 7) return `${seconds}s (Frequent)`;
        if (seconds <= 12) return `${seconds}s (Medium)`;
        if (seconds <= 18) return `${seconds}s (Slow)`;
        return `${seconds}s (Rare)`;
    }
}
