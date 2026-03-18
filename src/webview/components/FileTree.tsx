import * as React from 'react';

export interface FileItem {
    uri: string;
    name: string;
    relativePath: string;
}

interface FileTreeProps {
    files: FileItem[];
    selectedFile?: string;
    onSelectFile: (file: FileItem) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ 
    files, 
    selectedFile, 
    onSelectFile 
}) => {
    if (files.length === 0) {
        return (
            <div className="file-tree empty">
                <p className="empty-message">
                    🔍 未检测到 AGENTS.md 文件
                </p>
                <p className="hint">
                    工作区中的 .agents.md 或 AGENTS.md 文件将显示在这里
                </p>
            </div>
        );
    }

    return (
        <div className="file-tree">
            <div className="file-tree-header">
                <span className="file-count">
                    找到 {files.length} 个文件
                </span>
            </div>
            <ul className="file-list">
                {files.map((file) => (
                    <li 
                        key={file.uri}
                        className={`file-item ${selectedFile === file.uri ? 'selected' : ''}`}
                        onClick={() => onSelectFile(file)}
                    >
                        <div className="file-icon">
                            {file.name.startsWith('.') ? '🔒' : '📄'}
                        </div>
                        <div className="file-info">
                            <div className="file-name">{file.name}</div>
                            <div className="file-path">{file.relativePath}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
