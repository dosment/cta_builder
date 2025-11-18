/**
 * TreeConfigurationStep
 * Step 3: Tree & Department Configuration
 */

import * as utils from '../../utils.js';
import { TreeFieldBuilder } from '../components/TreeFieldBuilder.js';

export class TreeConfigurationStep {
    constructor(appState, validationManager) {
        this.appState = appState;
        this.validationManager = validationManager;
        this.treeFieldBuilder = new TreeFieldBuilder(appState, () => this.handleFieldChange());
    }

    /**
     * Render tree configuration step
     */
    render() {
        const container = document.getElementById('tree-config-list');
        utils.clearElement(container);

        const ctaLabels = this.appState.loadedData.ctaLabels;

        this.appState.data.selectedCtas.forEach(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Check if CTA supports deeplink
            if (ctaInfo.supportsDeeplink) {
                const deeplinkToggle = this.treeFieldBuilder.createDeeplinkToggle(ctaType, config, ctaInfo);
                configItem.appendChild(deeplinkToggle);
            }

            // Tree and department fields (only if requires tree and not using deeplink)
            if (ctaInfo.requiresTree && !config.useDeeplink) {
                const treeFields = this.treeFieldBuilder.createTreeFields(ctaType, config, ctaInfo);
                configItem.appendChild(treeFields);
            }

            // Deeplink step selector (if using deeplink)
            if (config.useDeeplink && ctaInfo.deeplinkSteps) {
                const deeplinkFields = this.treeFieldBuilder.createDeeplinkFields(ctaType, config, ctaInfo);
                configItem.appendChild(deeplinkFields);
            }

            // Note for CTAs that don't require configuration
            if (!ctaInfo.requiresTree && !ctaInfo.supportsDeeplink) {
                const note = utils.createElement('p', { className: 'text-muted' },
                    'This CTA does not require tree or department configuration.');
                configItem.appendChild(note);
            }

            container.appendChild(configItem);
        });
    }

    /**
     * Handle field change (triggers re-render and validation setup)
     */
    handleFieldChange() {
        this.render();
        this.validationManager.setupValidationWatching(this.appState.currentStep);
    }
}
