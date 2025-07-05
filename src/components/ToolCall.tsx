import React from 'react';
import './style.scss';

export interface ToolCallData {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
    result?: {
        output?: string;
        error?: string;
    };
}

export interface ToolCallProps {
    toolCall: ToolCallData;
    className?: string;
    showArguments?: boolean;
    showResult?: boolean;
}

export const ToolCall: React.FC<ToolCallProps> = ({
    toolCall,
    className = '',
    showArguments = true,
    showResult = true
}) => {
    const formatArguments = (args: string) => {
        try {
            const parsed = JSON.parse(args);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return args;
        }
    };

    const formatResult = (result: any) => {
        if (typeof result === 'string') {
            return result;
        }
        return JSON.stringify(result, null, 2);
    };

    return (
        <div className={`tool-call ${className}`}>
            <div className="tool-arguments">
                <pre className="tool-arguments-content"><strong>{toolCall.function.name}(</strong>{showArguments && toolCall.function.arguments && (formatArguments(toolCall.function.arguments))}<strong>)</strong></pre>
            </div>

            {showResult && !toolCall.result && (
                <div className="tool-result">
                    <pre className="tool-output">
                        Generating...
                    </pre>
                </div>
            )}
            {showResult && toolCall.result && (
                <div className="tool-result">
                    {toolCall.result.error ? (
                        <pre className="tool-error">
                            Error: {toolCall.result.error}
                        </pre>
                    ) : (
                        <pre className="tool-output">
                            {formatResult(toolCall.result.output)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};