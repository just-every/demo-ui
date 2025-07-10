import React from 'react';
import './style.scss';

export interface ModelOption {
    value: string;
    label: string;
    provider?: string;
    disabled?: boolean;
}

export interface ModelGroup {
    label: string;
    options: ModelOption[];
}

interface ModelSelectorProps {
    value?: string;
    selectedValue?: string;
    onChange: (value: string) => void;
    models?: ModelOption[] | ModelGroup[];
    groups?: ModelOption[] | ModelGroup[];
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

const isModelGroup = (item: ModelOption | ModelGroup): item is ModelGroup => {
    return 'options' in item;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    value,
    selectedValue,
    onChange,
    models,
    groups,
    disabled = false,
    placeholder = 'Select a model...',
    className = ''
}) => {
    const actualValue = value || selectedValue || '';
    const actualModels = models || groups || [];
    const renderOptions = () => {
        return actualModels.map((item, index) => {
            if (isModelGroup(item)) {
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

    return (
        <select
            className={`model-select ${className}`}
            value={actualValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {renderOptions()}
        </select>
    );
};