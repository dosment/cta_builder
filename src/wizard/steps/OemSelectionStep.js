/**
 * OemSelectionStep
 * Step 1: OEM Selection
 */

import * as utils from '../../utils.js';

export class OemSelectionStep {
    constructor(appState, previewManager) {
        this.appState = appState;
        this.previewManager = previewManager;
    }

    /**
     * Render OEM selection step
     */
    render() {
        const select = document.getElementById('oem-select');

        // Mark as required
        select.required = true;

        // Clear existing options (except first)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Populate OEM options
        this.appState.loadedData.oems.forEach(oem => {
            const option = document.createElement('option');
            option.value = oem.code;
            option.textContent = oem.name;
            if (this.appState.data.oem === oem.code) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Event listener
        select.onchange = async (e) => {
            const oemCode = e.target.value;
            if (oemCode) {
                const oemData = await this.appState.loadOemData(oemCode);
                this.appState.setOem(oemCode, oemData);
                // Clear validation error if present
                utils.clearFieldError('oem-select');
                // Update live preview immediately with OEM colors
                this.previewManager.updateLivePreview();
            } else {
                this.appState.setOem(null, null);
                this.previewManager.updateLivePreview();
            }
        };
    }
}
