/**
 * StyleSelector
 * Builds label and style selection UI components
 */

import * as utils from '../../utils.js';

export class StyleSelector {
    constructor(appState, onStyleChange) {
        this.appState = appState;
        this.onStyleChange = onStyleChange;
    }

    /**
     * Create label selection UI
     */
    createLabelSelection(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        const labelField = utils.createElement('div', { className: 'config-field' });
        const labelLabel = utils.createElement('label', {}, 'Button Label:');
        const labelSelect = utils.createElement('select', { id: `label-${ctaType}` });

        const useCustomLabel = config.useCustomLabel;

        ctaInfo.options.forEach(option => {
            const optElement = utils.createElement('option', {
                value: option,
                selected: !useCustomLabel && (config.label === option)
            }, option);
            labelSelect.appendChild(optElement);
        });

        // Custom option
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: useCustomLabel
        }, 'Custom');
        labelSelect.appendChild(customOption);

        labelSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                this.appState.updateCtaConfig(ctaType, {
                    useCustomLabel: true,
                    customLabel: config.customLabel || ''
                });
                if (this.onStyleChange) {
                    this.onStyleChange();
                }
            } else {
                this.appState.updateCtaConfig(ctaType, {
                    useCustomLabel: false,
                    customLabel: '',
                    label: e.target.value
                });
                if (this.onStyleChange) {
                    this.onStyleChange(true); // true = update preview
                }
            }
        };

        labelField.appendChild(labelLabel);
        labelField.appendChild(labelSelect);
        row.appendChild(labelField);

        // Custom text input or disabled placeholder
        if (useCustomLabel) {
            const customLabelField = utils.createElement('div', { className: 'config-field' });
            const customLabelLabel = utils.createElement('label', {}, 'Custom Label Text:');
            const customLabelInput = utils.createElement('input', {
                type: 'text',
                id: `custom-label-${ctaType}`,
                value: config.customLabel || '',
                placeholder: 'Enter button text'
            });

            customLabelInput.oninput = (e) => {
                this.appState.updateCtaConfig(ctaType, { customLabel: e.target.value });
                if (this.onStyleChange) {
                    this.onStyleChange(true); // Update preview as user types
                }
            };

            customLabelField.appendChild(customLabelLabel);
            customLabelField.appendChild(customLabelInput);
            row.appendChild(customLabelField);
        } else {
            const helperField = utils.createElement('div', { className: 'config-field' });
            const helperLabel = utils.createElement('label', {}, 'Custom Label Text:');
            const helperInput = utils.createElement('input', {
                type: 'text',
                id: `custom-label-${ctaType}`,
                value: '',
                placeholder: 'Select "Custom" to edit',
                disabled: true
            });
            helperField.appendChild(helperLabel);
            helperField.appendChild(helperInput);
            row.appendChild(helperField);
        }

        return row;
    }

    /**
     * Create style type selection UI
     */
    createStyleSelection(ctaType, config) {
        const container = utils.createElement('div', {
            className: 'style-selection-container',
            style: 'display: flex; flex-direction: column; margin-bottom: 15px;'
        });

        // Create dedicated row for Style Type dropdown
        const styleTypeRow = utils.createElement('div', { className: 'config-row' });
        const styleField = utils.createElement('div', { className: 'config-field', style: 'flex: 1;' });
        const styleLabel = utils.createElement('label', {}, 'Style Type:');
        const styleSelect = utils.createElement('select', { id: `style-${ctaType}` });

        const oemData = this.appState.data.oemData;
        const useCustomStyle = config.styleType === '__custom__';

        if (oemData && oemData.styles) {
            Object.keys(oemData.styles).forEach(styleKey => {
                const styleInfo = oemData.styles[styleKey];
                const option = utils.createElement('option', {
                    value: styleKey,
                    selected: !useCustomStyle && config.styleType === styleKey
                }, styleInfo.label);
                styleSelect.appendChild(option);
            });
        }

        // Add Custom option
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: useCustomStyle
        }, 'Custom');
        styleSelect.appendChild(customOption);

        styleSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                this.appState.updateCtaConfig(ctaType, {
                    styleType: '__custom__',
                    customStyle: config.customStyle || {
                        backgroundColor: '#000000',
                        textColor: '#ffffff',
                        borderColor: '#000000'
                    }
                });
                if (this.onStyleChange) {
                    this.onStyleChange();
                }
            } else {
                this.appState.updateCtaConfig(ctaType, {
                    styleType: e.target.value,
                    customStyle: null
                });
                if (this.onStyleChange) {
                    this.onStyleChange(true); // Update preview
                }
            }
        };

        styleField.appendChild(styleLabel);
        styleField.appendChild(styleSelect);
        styleTypeRow.appendChild(styleField);
        container.appendChild(styleTypeRow);

        // Show custom color inputs if custom style is selected
        if (useCustomStyle) {
            const colorRow = this.createCustomColorInputs(ctaType, config);
            container.appendChild(colorRow);
        }

        return container;
    }

    /**
     * Create custom color input controls
     */
    createCustomColorInputs(ctaType, config) {
        const colorRow = utils.createElement('div', {
            className: 'custom-color-row'
        });

        // Background Color
        const bgColorField = this.createColorInput(
            ctaType,
            'bg',
            'Background:',
            config.customStyle?.backgroundColor || '#000000',
            (value) => {
                const newCustomStyle = { ...config.customStyle, backgroundColor: value };
                this.appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                if (this.onStyleChange) {
                    this.onStyleChange(true);
                }
            }
        );
        colorRow.appendChild(bgColorField);

        // Text Color
        const textColorField = this.createColorInput(
            ctaType,
            'text',
            'Text:',
            config.customStyle?.textColor || '#ffffff',
            (value) => {
                const newCustomStyle = { ...config.customStyle, textColor: value };
                this.appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                if (this.onStyleChange) {
                    this.onStyleChange(true);
                }
            }
        );
        colorRow.appendChild(textColorField);

        // Border Color
        const borderColorField = this.createColorInput(
            ctaType,
            'border',
            'Border:',
            config.customStyle?.borderColor || '#000000',
            (value) => {
                const newCustomStyle = { ...config.customStyle, borderColor: value };
                this.appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                if (this.onStyleChange) {
                    this.onStyleChange(true);
                }
            }
        );
        colorRow.appendChild(borderColorField);

        return colorRow;
    }

    /**
     * Create a single color input field with picker and text input
     */
    createColorInput(ctaType, colorType, label, initialValue, onChange) {
        const field = utils.createElement('div', {
            className: 'config-field',
            style: 'display: flex; flex-direction: column; gap: 4px; flex: 1;'
        });
        const labelEl = utils.createElement('label', {}, label);
        const wrapper = utils.createElement('div', {
            style: 'display: flex; gap: 8px; align-items: center;'
        });

        const colorPicker = utils.createElement('input', {
            type: 'color',
            id: `custom-${colorType}-picker-${ctaType}`,
            value: initialValue,
            style: 'width: 60px; height: 40px; cursor: pointer;'
        });

        const colorText = utils.createElement('input', {
            type: 'text',
            id: `custom-${colorType}-text-${ctaType}`,
            value: initialValue,
            placeholder: initialValue,
            style: 'width: 100px; text-transform: uppercase;'
        });

        colorPicker.oninput = (e) => {
            const value = e.target.value;
            colorText.value = value.toUpperCase();
            onChange(value);
        };

        colorText.oninput = (e) => {
            const value = e.target.value.trim();
            // Validate hex color format
            if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
                colorPicker.value = value;
                onChange(value);
            }
        };

        wrapper.appendChild(colorPicker);
        wrapper.appendChild(colorText);
        field.appendChild(labelEl);
        field.appendChild(wrapper);

        return field;
    }
}
