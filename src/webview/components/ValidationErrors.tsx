import * as React from 'react';

interface ValidationErrorsProps {
    errors: ValidationError[];
}

export interface ValidationError {
    message: string;
    line?: number;
    severity: 'error' | 'warning' | 'info';
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors }) => {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div className="validation-errors">
            <div className="errors-header">
                <span className="errors-title">
                    ⚠️ 验证问题 ({errors.length})
                </span>
            </div>
            <ul className="errors-list">
                {errors.map((error, index) => (
                    <li 
                        key={index} 
                        className={`error-item ${error.severity}`}
                    >
                        <span className="error-icon">
                            {error.severity === 'error' ? '❌' : 
                             error.severity === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <span className="error-message">{error.message}</span>
                        {error.line !== undefined && (
                            <span className="error-line">行 {error.line + 1}</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
