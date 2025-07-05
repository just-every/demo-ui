import React from 'react';
import './style.scss';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectGroup {
    label: string;
    options: SelectOption[];
}

export type SelectItem = SelectOption | SelectGroup;

export interface FormSelectProps {
    /** Current value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Options - can be flat array or grouped */
    options: SelectItem[];
    /** Placeholder text */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Label for the select */
    label?: string;
    /** Help text shown below the select */
    helpText?: string;
    /** Error message */
    error?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Custom className */
    className?: string;
}

const isSelectGroup = (item: SelectItem): item is SelectGroup => {
    return 'options' in item;
};

export const FormSelect: React.FC<FormSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select an option...',
    disabled = false,
    label,
    helpText,
    error,
    required = false,
    className = ''
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    const renderOptions = () => {
        return options.map((item, index) => {
            if (isSelectGroup(item)) {
                return (
                    <optgroup key={index} label={item.label}>
                        {item.options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </optgroup>
                );
            } else {
                return (
                    <option
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                    >
                        {item.label}
                    </option>
                );
            }
        });
    };

    const hasError = !!error;

    return (
        <div className={`form-select-wrapper ${className} ${hasError ? 'has-error' : ''}`}>
            {label && (
                <label className="form-label">
                    {label}
                    {required && <span className="required-indicator">*</span>}
                </label>
            )}
            
            <select
                className="glass-select"
                value={value}
                onChange={handleChange}
                disabled={disabled}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {renderOptions()}
            </select>
            
            {helpText && !error && (
                <span className="form-help-text">{helpText}</span>
            )}
            
            {error && (
                <span className="form-error-text">{error}</span>
            )}
        </div>
    );
};