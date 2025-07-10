import React from 'react';
import './style.scss';

export interface ToggleSettingProps {
    /** Label for the toggle */
    label: string;
    /** Current value */
    value: boolean;
    /** Change handler */
    onChange: (value: boolean) => void;
    /** Whether the toggle is disabled */
    disabled?: boolean;
    /** Help text shown below the toggle */
    helpText?: string;
    /** Show toggle on the left side */
    togglePosition?: 'left' | 'right';
    /** Custom className */
    className?: string;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    helpText,
    togglePosition = 'right',
    className = ''
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
    };

    const toggle = (
        <label className="toggle-switch">
            <input
                type="checkbox"
                checked={value}
                onChange={handleChange}
                disabled={disabled}
            />
            <span className="toggle-slider"></span>
        </label>
    );

    return (
        <div className={`toggle-setting ${className} ${disabled ? 'disabled' : ''}`}>
            <div className={`toggle-container ${togglePosition}`}>
                {togglePosition === 'left' && toggle}
                <div className="toggle-content">
                    <label className="toggle-label">{label}</label>
                    {helpText && (
                        <span className="toggle-help">{helpText}</span>
                    )}
                </div>
                {togglePosition === 'right' && toggle}
            </div>
        </div>
    );
};