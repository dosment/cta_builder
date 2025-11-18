/**
 * AdvancedStylingStep
 * Step 5: Advanced Styling Configuration (Typography & Spacing)
 */

import * as utils from '../../utils.js';
import { TypographyControls } from '../components/TypographyControls.js';

export class AdvancedStylingStep {
    constructor(appState, previewManager) {
        this.appState = appState;
        this.previewManager = previewManager;
        this.typographyControls = new TypographyControls(
            appState,
            () => this.handleControlChange()
        );
    }

    /**
     * Render advanced styling configuration step
     */
    render() {
        const container = document.getElementById('advanced-styling-config-list');
        utils.clearElement(container);

        const placements = [
            { key: 'srp', label: 'SRP Buttons' },
            { key: 'vdp', label: 'VDP Buttons' }
        ];

        placements.forEach(({ key, label }) => {
            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, label);
            configItem.appendChild(heading);

            configItem.appendChild(this.typographyControls.createTypographyControls(key));
            configItem.appendChild(this.typographyControls.createSpacingControls(key));

            container.appendChild(configItem);
        });
    }

    /**
     * Handle control change
     */
    handleControlChange() {
        this.previewManager.updateLivePreview();
    }
}
