import React, { useState } from 'react';

interface TagIntroductionProps {
    tag: string;
    description: string;
    color: string;
    formatTagName: (tag: string) => string;
}

export const TagIntroduction: React.FC<TagIntroductionProps> = ({
    tag,
    description,
    color,
    formatTagName
}) => {
    const [showDescription, setShowDescription] = useState(false);

    const handleClick = () => {
        if (description) {
            setShowDescription(!showDescription);
        }
    };

    return (
        <div className="tag-introduction">
            <div 
                className="tag-header"
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: description ? 'pointer' : 'default',
                }}
            >
                <h4 
                    className="tag-name" 
                    style={{ 
                        color: `rgb(${color})`,
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 500 
                    }}
                >
                    {formatTagName(tag)}
                </h4>
            </div>
            {description && showDescription && (
                <p className="tag-description">{description}</p>
            )}
        </div>
    );
};