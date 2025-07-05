import React from 'react';
import './style.scss';

interface DemoHeaderProps {
    title: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

const DemoHeader: React.FC<DemoHeaderProps> = ({ title, icon, children }) => {
    return (
        <div className="header-card">
            <div className="header-row">
                <h1>
                    {icon}
                    {title}
                </h1>
                {children}
            </div>
        </div>
    );
};

export default DemoHeader;
