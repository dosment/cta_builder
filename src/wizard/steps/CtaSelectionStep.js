/**
 * CtaSelectionStep
 * Step 2: CTA Selection
 */

import * as utils from '../../utils.js';

export class CtaSelectionStep {
    constructor(appState, previewManager) {
        this.appState = appState;
        this.previewManager = previewManager;
    }

    /**
     * Render CTA selection step
     */
    render() {
        const container = document.getElementById('cta-checkboxes');
        utils.clearElement(container);

        const ctaLabels = this.appState.loadedData.ctaLabels;

        Object.keys(ctaLabels).forEach(ctaType => {
            const ctaInfo = ctaLabels[ctaType];
            const isChecked = this.appState.data.selectedCtas.includes(ctaType);

            const checkboxItem = utils.createElement('div', { className: 'checkbox-item' });

            const checkbox = utils.createElement('input', {
                type: 'checkbox',
                id: `cta-${ctaType}`,
                value: ctaType,
                checked: isChecked
            });

            const label = utils.createElement('label', {
                for: `cta-${ctaType}`
            }, ctaInfo.displayName || ctaInfo.default);

            checkbox.onchange = () => this.handleCtaSelectionChange();

            // Make the entire div clickable
            checkboxItem.onclick = (e) => {
                const target = e.target;
                // Ignore clicks that originated on the checkbox or its label since the browser handles those
                if (target === checkbox || target.tagName === 'LABEL') {
                    return;
                }
                checkbox.checked = !checkbox.checked;
                this.handleCtaSelectionChange();
            };

            // Add pointer cursor to indicate clickability
            checkboxItem.style.cursor = 'pointer';

            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            container.appendChild(checkboxItem);
        });
    }

    /**
     * Handle CTA selection change
     */
    handleCtaSelectionChange() {
        const checkboxes = document.querySelectorAll('#cta-checkboxes input[type="checkbox"]');
        const selectedCtas = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        this.appState.setSelectedCtas(selectedCtas);

        // Clear validation error if at least one CTA is selected
        if (selectedCtas.length > 0) {
            utils.clearFieldError('cta-checkboxes');
        }

        this.previewManager.updateLivePreview();
    }
}
