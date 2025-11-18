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
            (updatePreview) => this.handleStyleChange(updatePreview)
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
}
