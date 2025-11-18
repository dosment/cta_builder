/**
 * TypographyControls
 * Builds advanced typography and spacing UI controls
 */

import * as utils from '../../utils.js';

export class TypographyControls {
    constructor(appState, onControlChange) {
        this.appState = appState;
        this.onControlChange = onControlChange;
    }

    /**
     * Create typography controls for a placement
     */
    createTypographyControls(placement) {
        const wrapper = utils.createElement('div', { className: 'config-group config-card' });
        const title = utils.createElement('div', { className: 'config-subtitle' }, 'Typography');
        wrapper.appendChild(title);

        const selectsRow = utils.createElement('div', { className: 'config-grid config-grid-selects' });
        const slidersRow = utils.createElement('div', { className: 'config-grid config-grid-sliders' });

        // Font family
        const fontFamilies = [
            { value: '', label: 'Inherit from site' },
            { value: 'Arial, sans-serif', label: 'Arial' },
            { value: '\'Roboto\', sans-serif', label: 'Roboto' },
            { value: '\'Montserrat\', sans-serif', label: 'Montserrat' },
            { value: '\'Georgia\', serif', label: 'Georgia' }
        ];
        const fontFamilyField = this.createPlacementSelect(
            placement,
            'fontFamily',
            'Font Family',
            fontFamilies
        );
        selectsRow.appendChild(fontFamilyField);

        // Text transform
        const textTransforms = [
            { value: '', label: 'Inherit from site' },
            { value: 'none', label: 'None' },
            { value: 'capitalize', label: 'Capitalize' },
            { value: 'uppercase', label: 'Uppercase' },
            { value: 'lowercase', label: 'Lowercase' }
        ];
        const textTransformField = this.createPlacementSelect(
            placement,
            'textTransform',
            'Text Transform',
            textTransforms
        );
        selectsRow.appendChild(textTransformField);

        // Font size slider
        const fontSizeField = this.createPlacementSlider(
            placement,
            'fontSize',
            'Font Size (px)',
            12,
            28,
            1,
            'px'
        );
        slidersRow.appendChild(fontSizeField);

        // Font weight
        const fontWeights = [
            { value: '', label: 'Inherit from site' },
            { value: '400', label: 'Regular (400)' },
            { value: '500', label: 'Medium (500)' },
            { value: '600', label: 'Semi-bold (600)' },
            { value: '700', label: 'Bold (700)' }
        ];
        const fontWeightField = this.createPlacementSelect(
            placement,
            'fontWeight',
            'Font Weight',
            fontWeights
        );
        selectsRow.appendChild(fontWeightField);

        // Line height slider
        const lineHeightField = this.createPlacementSlider(
            placement,
            'lineHeight',
            'Line Height',
            1,
            3,
            0.1,
            ''
        );
        slidersRow.appendChild(lineHeightField);

        // Letter spacing slider
        const letterSpacingField = this.createPlacementSlider(
            placement,
            'letterSpacing',
            'Letter Spacing (px)',
            -2,
            6,
            0.1,
            'px'
        );
        slidersRow.appendChild(letterSpacingField);

        // Wrap select
        const wrapField = this.createPlacementSelect(
            placement,
            'textWrap',
            'Text Wrapping',
            [
                { value: 'wrap', label: 'Wrap text' },
                { value: 'nowrap', label: 'No wrap' }
            ]
        );
        selectsRow.appendChild(wrapField);

        wrapper.appendChild(selectsRow);
        wrapper.appendChild(slidersRow);

        return wrapper;
    }

    /**
     * Create spacing controls for a placement
     */
    createSpacingControls(placement) {
        const wrapper = utils.createElement('div', { className: 'config-group config-card' });
        const title = utils.createElement('div', { className: 'config-subtitle' }, 'Spacing');
        wrapper.appendChild(title);

        const topRow = utils.createElement('div', { className: 'config-grid config-grid-sliders' });
        const bottomRow = utils.createElement('div', { className: 'config-grid config-grid-sliders' });

        const borderRadiusField = this.createPlacementSlider(
            placement,
            'borderRadius',
            'Border Radius (px)',
            0,
            50,
            1,
            'px'
        );
        topRow.appendChild(borderRadiusField);

        const borderWidthField = this.createPlacementSlider(
            placement,
            'borderWidth',
            'Border Width (px)',
            0,
            10,
            1,
            'px'
        );
        topRow.appendChild(borderWidthField);

        const marginTopField = this.createPlacementSlider(
            placement,
            'marginTop',
            'Margin Top (px)',
            0,
            40,
            1,
            'px'
        );
        bottomRow.appendChild(marginTopField);

        const marginBottomField = this.createPlacementSlider(
            placement,
            'marginBottom',
            'Margin Bottom (px)',
            0,
            40,
            1,
            'px'
        );
        bottomRow.appendChild(marginBottomField);

        const paddingField = this.createPlacementSlider(
            placement,
            'padding',
            'Padding (px)',
            4,
            40,
            1,
            'px'
        );
        bottomRow.appendChild(paddingField);

        wrapper.appendChild(topRow);
        wrapper.appendChild(bottomRow);

        return wrapper;
    }

    /**
     * Create a select dropdown for placement styling
     */
    createPlacementSelect(placement, property, label, options) {
        const field = utils.createElement('div', { className: 'config-field' });
        const labelEl = utils.createElement('label', {}, `${label}:`);
        const select = utils.createElement('select', {
            id: `${property}-${placement}`
        });

        const advancedValue = this.getAdvancedStylesValue(placement, property);
        const currentValue = advancedValue ?? (property === 'textWrap' ? 'wrap' : '');

        options.forEach(opt => {
            const optionEl = utils.createElement('option', {
                value: opt.value,
                selected: currentValue === opt.value
            }, opt.label);
            select.appendChild(optionEl);
        });

        select.onchange = (e) => {
            const value = e.target.value;
            this.appState.updateAdvancedStyles(placement, {
                [property]: value === '' ? null : value
            });
            if (this.onControlChange) {
                this.onControlChange();
            }
        };

        field.appendChild(labelEl);
        field.appendChild(select);
        return field;
    }

    /**
     * Create a slider for placement styling
     */
    createPlacementSlider(placement, property, label, min, max, step, unit = 'px') {
        const field = utils.createElement('div', { className: 'config-field' });
        const labelEl = utils.createElement('label', {}, `${label}:`);

        const sliderContainer = utils.createElement('div', { className: 'slider-container' });

        const resolvedValue = this.getResolvedPlacementStyleValue(placement, property);
        const numericValue = this.parseNumericValue(resolvedValue, min);

        const sliderTrack = utils.createElement('div', { className: 'slider-track' });
        const slider = utils.createElement('input', {
            type: 'range',
            id: `${property}-${placement}`,
            min,
            max,
            step,
            value: numericValue
        });

        const valueDisplay = utils.createElement('span', {
            className: 'slider-value',
            id: `${property}-value-${placement}`
        }, unit ? `${numericValue}${unit}` : `${numericValue}`);

        slider.oninput = (e) => {
            const rawValue = e.target.value;
            valueDisplay.textContent = unit ? `${rawValue}${unit}` : rawValue;
            const storedValue = unit ? `${rawValue}${unit}` : rawValue;
            this.appState.updateAdvancedStyles(placement, { [property]: storedValue });
            if (this.onControlChange) {
                this.onControlChange();
            }
        };

        sliderTrack.appendChild(slider);
        sliderTrack.appendChild(valueDisplay);
        sliderContainer.appendChild(sliderTrack);
        field.appendChild(labelEl);
        field.appendChild(sliderContainer);

        return field;
    }

    /**
     * Get advanced styles value for placement
     */
    getAdvancedStylesValue(placement, property) {
        const adv = this.appState.data.advancedStyles?.[placement];
        if (!adv) return null;
        return adv[property];
    }

    /**
     * Get resolved style value with fallbacks
     */
    getResolvedPlacementStyleValue(placement, property) {
        const advancedValue = this.getAdvancedStylesValue(placement, property);
        if (advancedValue) {
            return advancedValue;
        }

        if (property === 'textWrap') {
            return 'wrap';
        }

        const baseStyle = this.getPlacementBaseStyle(placement);
        if (baseStyle && baseStyle[property]) {
            return baseStyle[property];
        }

        return this.getFallbackValue(property);
    }

    /**
     * Get base style for placement from OEM data
     */
    getPlacementBaseStyle(placement) {
        const oemData = this.appState.data.oemData;
        if (!oemData || !oemData.styles) {
            return {};
        }

        if (placement === 'buttons') {
            // Unified buttons use primary style as base
            return oemData.styles.primary || {};
        }

        if (placement === 'srp') {
            return oemData.styles.primary || {};
        }

        if (placement === 'vdp') {
            return oemData.styles.secondary || oemData.styles.primary || {};
        }

        return {};
    }

    /**
     * Get fallback value for property
     */
    getFallbackValue(property) {
        const defaults = {
            fontFamily: 'inherit',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0px',
            borderRadius: '4px',
            borderWidth: '2px',
            marginTop: '6px',
            marginBottom: '6px',
            padding: '12px',
            textWrap: 'wrap',
            textTransform: 'none'
        };

        return defaults[property] || '';
    }

    /**
     * Parse numeric value from string
     */
    parseNumericValue(value, fallback) {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            const match = value.match(/-?\d+(\.\d+)?/);
            if (match) {
                return parseFloat(match[0]);
            }
        }

        return fallback;
    }
}
