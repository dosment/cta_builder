/**
 * PreviewStep
 * Step 7: Preview & Export Code
 */

import * as utils from '../../utils.js';
import { generateCode } from '../../generator.js';

export class PreviewStep {
    constructor(appState, previewManager) {
        this.appState = appState;
        this.previewManager = previewManager;
        this.currentPreviewPlacement = 'srp';
    }

    /**
     * Render preview and code export step
     */
    render() {
        const previewArea = document.getElementById('preview-area');
        const codeOutput = document.getElementById('generated-code');
        const placementSelect = document.getElementById('preview-placement-select');

        if (placementSelect) {
            placementSelect.value = this.currentPreviewPlacement;
            placementSelect.onchange = (e) => {
                this.currentPreviewPlacement = e.target.value;
                this.render();
                this.previewManager.updateLivePreview();
            };
        }

        // Generate preview
        utils.clearElement(previewArea);
        const renderedCount = this.previewManager.renderPreviewCtas(previewArea, this.currentPreviewPlacement);
        if (renderedCount === 0) {
            previewArea.innerHTML = `<p class="text-muted">No CTAs configured for ${this.currentPreviewPlacement.toUpperCase()} placement.</p>`;
        }

        // Generate code
        const generatedCode = generateCode(this.appState.data, this.appState.loadedData);
        codeOutput.querySelector('code').textContent = generatedCode;

        // Copy button
        const copyBtn = document.getElementById('copy-code-btn');
        copyBtn.onclick = async () => {
            const success = await utils.copyToClipboard(generatedCode);
            if (success) {
                utils.showNotification('Code copied to clipboard!', 'success');
            } else {
                utils.showNotification('Failed to copy code', 'error');
            }
        };
    }
}
