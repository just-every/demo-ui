import React, { useState } from 'react';
import { EnhancedModal } from './EnhancedModal';
import { TabGroup, TabPanel, Tab } from './TabGroup';
import { CodeDisplay } from './CodeDisplay';
import './style.scss';

export interface CodeTab {
    id: string;
    label: string;
    code: string;
    language?: string;
}

export interface CodeModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Code tabs to display */
    tabs: CodeTab[];
    /** Default active tab */
    defaultTab?: string;
    /** Show line numbers in code */
    showLineNumbers?: boolean;
    /** Custom width */
    width?: string | number;
    /** Custom max width */
    maxWidth?: string | number;
}

export const CodeModal: React.FC<CodeModalProps> = ({
    isOpen,
    onClose,
    title = 'Generated Code',
    tabs,
    defaultTab,
    showLineNumbers = false,
    width,
    maxWidth = '900px'
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const tabItems: Tab[] = tabs.map(tab => ({
        id: tab.id,
        label: tab.label
    }));

    const header = (
        <>
            <h2 className="modal-title">{title}</h2>
        </>
    );


    return (
        <EnhancedModal
            isOpen={isOpen}
            onClose={onClose}
            header={header}
            width={width}
            maxWidth={maxWidth}
            className="code-modal"
        >
            {tabs.length > 1 && (
                <div className="modal-tabs-section">
                    <TabGroup
                        tabs={tabItems}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        variant="underline"
                    />
                </div>
            )}
            
            <div className="code-modal-content">
                {tabs.map(tab => (
                    <TabPanel
                        key={tab.id}
                        tabId={tab.id}
                        activeTab={activeTab}
                        keepMounted={false}
                    >
                        <CodeDisplay
                            code={tab.code}
                            language={tab.language}
                            showLineNumbers={showLineNumbers}
                            maxHeight="60vh"
                        />
                    </TabPanel>
                ))}
            </div>
        </EnhancedModal>
    );
};