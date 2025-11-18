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

        // Add toggle for separate styling
        const toggleSection = this.createSeparateStylingToggle();
        container.appendChild(toggleSection);

        const separateStyling = this.appState.getSeparateStyling();

        if (separateStyling) {
            // Show separate SRP and VDP sections
            this.renderSeparateSections(container);
        } else {
            // Show unified Buttons section
            this.renderUnifiedSection(container);
        }
    }

    /**
     * Create the toggle for separate styling by page type
     */
    createSeparateStylingToggle() {
        const toggleContainer = utils.createElement('div', {
            className: 'config-item',
            style: 'margin-bottom: 20px; background: var(--gray-100); border: 1px solid var(--gray-300); padding: 20px; border-radius: 6px;'
        });

        const toggleRow = utils.createElement('div', { className: 'config-row' });
        const toggleField = utils.createElement('div', { className: 'config-field checkbox-field' });

        const checkbox = utils.createElement('input', {
            type: 'checkbox',
            id: 'separate-styling-toggle',
            checked: this.appState.getSeparateStyling()
        });

        const label = utils.createElement('label', {
            for: 'separate-styling-toggle',
            className: 'inline-checkbox-label',
            style: 'font-weight: 600; font-size: 1rem;'
        });

        const labelText = utils.createElement('span', {}, 'Separate Styling By Page Type?');

        checkbox.onchange = (e) => {
            this.appState.setSeparateStyling(e.target.checked);
            this.render(); // Re-render to show/hide sections
            this.handleControlChange(); // Update preview
        };

        label.appendChild(labelText);
        label.appendChild(checkbox);
        toggleField.appendChild(label);
        toggleRow.appendChild(toggleField);
        toggleContainer.appendChild(toggleRow);

        return toggleContainer;
    }

    /**
     * Render unified Buttons section (applies to both SRP and VDP)
     */
    renderUnifiedSection(container) {
        const configItem = utils.createElement('div', { className: 'config-item' });
        const heading = utils.createElement('h3', {}, 'Buttons');
        configItem.appendChild(heading);

        configItem.appendChild(this.typographyControls.createTypographyControls('buttons'));
        configItem.appendChild(this.typographyControls.createSpacingControls('buttons'));

        container.appendChild(configItem);
    }

    /**
     * Render separate SRP and VDP sections
     */
    renderSeparateSections(container) {
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
