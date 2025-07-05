import React from 'react';
import './style.scss';

export interface SliderSettingProps {
    /** Label for the slider */
    label: string;
    /** Current value */
    value: number;
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Step increment */
    step?: number;
    /** Change handler */
    onChange: (value: number) => void;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** Number of decimal places to display */
    decimals?: number;
    /** Custom unit suffix (e.g., 'ms', '%', 'px') */
    unit?: string;
    /** Show value as percentage */
    showPercentage?: boolean;
    /** Custom className */
    className?: string;
}

export const SliderSetting: React.FC<SliderSettingProps> = ({
    label,
    value,
    min,
    max,
    step = 0.1,
    onChange,
    disabled = false,
    decimals = 1,
    unit = '',
    showPercentage = false,
    className = ''
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    const displayValue = () => {
        if (showPercentage) {
            const percentage = ((value - min) / (max - min)) * 100;
            return `${percentage.toFixed(0)}%`;
        }
        return `${value.toFixed(decimals)}${unit}`;
    };

    return (
        <div className={`slider-setting ${className} ${disabled ? 'disabled' : ''}`}>
            <div className="slider-header">
                <label className="slider-label">{label}</label>
                <span className="slider-value">{displayValue()}</span>
            </div>
            <div className="slider-container">
                <input
                    type="range"
                    className="glass-slider"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};