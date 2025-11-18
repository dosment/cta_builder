/**
 * PlacementStep
 * Step 6: Placement Configuration (SRP/VDP, Device Targeting)
 */

import * as utils from '../../utils.js';

export class PlacementStep {
    constructor(appState, previewManager) {
        this.appState = appState;
        this.previewManager = previewManager;
    }

    /**
     * Render placement configuration step
     */
    render() {
        const container = document.getElementById('placement-config-list');
        utils.clearElement(container);

        const ctaLabels = this.appState.loadedData.ctaLabels;

        this.appState.data.selectedCtas.forEach(ctaType => {
            const config = this.appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Placement checkboxes
            const placementRow = this.createPlacementCheckboxes(ctaType, config);
            configItem.appendChild(placementRow);

            container.appendChild(configItem);
        });
    }

    /**
     * Create placement checkboxes (SRP/VDP and device targeting)
     */
    createPlacementCheckboxes(ctaType, config) {
        const container = utils.createElement('div', { className: 'placement-container' });

        // Page placement checkboxes (SRP/VDP)
        const pageRow = utils.createElement('div', { className: 'config-row' });
        const pageLabel = utils.createElement('label', {
            style: 'display: block; margin-bottom: 8px; font-weight: 500;'
        }, 'Show on:');
        pageRow.appendChild(pageLabel);

        // SRP checkbox
        const srpField = utils.createElement('div', { className: 'checkbox-item' });
        const srpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `srp-${ctaType}`,
            checked: config.placement.srp
        });
        const srpLabel = utils.createElement('label', { for: `srp-${ctaType}` }, 'SRP');

        const handleSrpChange = () => {
            const latestConfig = this.appState.getCtaConfig(ctaType);
            const currentPlacement = latestConfig?.placement || config.placement;
            const newPlacement = { ...currentPlacement, srp: srpCheckbox.checked };
            this.appState.updateCtaConfig(ctaType, {
                placement: newPlacement
            });
            // Clear validation error if at least one placement is selected
            if (newPlacement.srp || newPlacement.vdp) {
                utils.clearFieldError(`srp-${ctaType}`);
            }
            // Update live preview
            this.previewManager.updateLivePreview();
        };

        srpCheckbox.onchange = handleSrpChange;

        // Make the entire div clickable
        srpField.onclick = (e) => {
            // Prevent double-triggering if the checkbox itself was clicked
            if (e.target !== srpCheckbox) {
                srpCheckbox.checked = !srpCheckbox.checked;
                handleSrpChange();
            }
        };

        // Add pointer cursor to indicate clickability
        srpField.style.cursor = 'pointer';

        srpField.appendChild(srpCheckbox);
        srpField.appendChild(srpLabel);
        pageRow.appendChild(srpField);

        // VDP checkbox
        const vdpField = utils.createElement('div', { className: 'checkbox-item' });
        const vdpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `vdp-${ctaType}`,
            checked: config.placement.vdp
        });
        const vdpLabel = utils.createElement('label', { for: `vdp-${ctaType}` }, 'VDP');

        const handleVdpChange = () => {
            const latestConfig = this.appState.getCtaConfig(ctaType);
            const currentPlacement = latestConfig?.placement || config.placement;
            const newPlacement = { ...currentPlacement, vdp: vdpCheckbox.checked };
            this.appState.updateCtaConfig(ctaType, {
                placement: newPlacement
            });
            // Clear validation error if at least one placement is selected
            if (newPlacement.srp || newPlacement.vdp) {
                utils.clearFieldError(`srp-${ctaType}`);
            }
            // Update live preview
            this.previewManager.updateLivePreview();
        };

        vdpCheckbox.onchange = handleVdpChange;

        // Make the entire div clickable
        vdpField.onclick = (e) => {
            // Prevent double-triggering if the checkbox itself was clicked
            if (e.target !== vdpCheckbox) {
                vdpCheckbox.checked = !vdpCheckbox.checked;
                handleVdpChange();
            }
        };

        // Add pointer cursor to indicate clickability
        vdpField.style.cursor = 'pointer';

        vdpField.appendChild(vdpCheckbox);
        vdpField.appendChild(vdpLabel);
        pageRow.appendChild(vdpField);

        container.appendChild(pageRow);

        // Device targeting dropdown
        const deviceRow = this.createDeviceTargeting(ctaType, config);
        container.appendChild(deviceRow);

        return container;
    }

    /**
     * Create device targeting dropdown
     */
    createDeviceTargeting(ctaType, config) {
        const deviceRow = utils.createElement('div', { className: 'config-row', style: 'margin-top: 12px;' });
        const deviceField = utils.createElement('div', { className: 'config-field' });
        const deviceLabel = utils.createElement('label', {}, 'Device Targeting:');
        const deviceSelect = utils.createElement('select', { id: `device-${ctaType}` });

        // Determine current device setting
        let currentDeviceValue = 'all';
        if (config.placement.mobileOnly) {
            currentDeviceValue = 'mobile';
        } else if (config.placement.desktopOnly) {
            currentDeviceValue = 'desktop';
        }

        const deviceOptions = [
            { value: 'all', label: 'All devices' },
            { value: 'mobile', label: 'Mobile only' },
            { value: 'desktop', label: 'Desktop only' }
        ];

        deviceOptions.forEach(opt => {
            const option = utils.createElement('option', {
                value: opt.value,
                selected: currentDeviceValue === opt.value
            }, opt.label);
            deviceSelect.appendChild(option);
        });

        deviceSelect.onchange = (e) => {
            const value = e.target.value;
            const latestConfig = this.appState.getCtaConfig(ctaType);
            const currentPlacement = latestConfig?.placement || config.placement;
            this.appState.updateCtaConfig(ctaType, {
                placement: {
                    ...currentPlacement,
                    mobileOnly: value === 'mobile',
                    desktopOnly: value === 'desktop'
                }
            });
            // Update live preview
            this.previewManager.updateLivePreview();
        };

        deviceField.appendChild(deviceLabel);
        deviceField.appendChild(deviceSelect);
        deviceRow.appendChild(deviceField);

        return deviceRow;
    }
}
