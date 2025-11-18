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
        const previewAreaSrp = document.getElementById('preview-area-srp');
        const previewAreaVdp = document.getElementById('preview-area-vdp');
        const codeOutput = document.getElementById('generated-code');

        // Generate SRP preview
        utils.clearElement(previewAreaSrp);
        const srpCount = this.previewManager.renderPreviewCtas(previewAreaSrp, 'srp');
        if (srpCount === 0) {
            previewAreaSrp.innerHTML = `<p class="text-muted">No CTAs configured for SRP placement.</p>`;
        }

        // Generate VDP preview
        utils.clearElement(previewAreaVdp);
        const vdpCount = this.previewManager.renderPreviewCtas(previewAreaVdp, 'vdp');
        if (vdpCount === 0) {
            previewAreaVdp.innerHTML = `<p class="text-muted">No CTAs configured for VDP placement.</p>`;
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
