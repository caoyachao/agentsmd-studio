import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { MonacoEditorComponent } from './components/MonacoEditor';
import { ConfigForm } from './components/ConfigForm';
import { FileTree, FileItem } from './components/FileTree';
import { ValidationErrors, ValidationError } from './components/ValidationErrors';
import { AgentsMdConfig } from './types';
import './styles.css';

// 消息类型定义
interface ExtensionMessage {
    type: 'files' | 'fileContent' | 'saveSuccess' | 'saveError' | 'error';
    data?: any;
}

// VS Code API
const vscode = (window as any).acquireVsCodeApi?.() || {
    postMessage: () => {},
    getState: () => null,
    setState: () => {}
};

// 默认 AGENTS.md 内容
const defaultAgentsMdContent = `---
name: AI Assistant
version: 1.0.0
description: Intelligent coding companion
role: Senior Developer
model: gpt-4
commands:
  - name: /generate-code
    description: Generate code based on requirements
  - name: /review-code
    description: Review code for best practices
---

# Agent Configuration

## Capabilities
- Code analysis and generation
- Project structure understanding
- Multi-language support

## Tools
- File operations
- Terminal commands
- Web search

## System Prompt
You are a helpful AI assistant specialized in software development.
`;

const App: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<'files' | 'editor' | 'preview' | 'config'>('files');
    const [files, setFiles] = React.useState<FileItem[]>([]);
    const [selectedFile, setSelectedFile] = React.useState<FileItem | null>(null);
    const [editorContent, setEditorContent] = React.useState(defaultAgentsMdContent);
    const [config, setConfig] = React.useState<AgentsMdConfig>({});
    const [errors, setErrors] = React.useState<ValidationError[]>([]);
    const [isDirty, setIsDirty] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState<'' | 'saving' | 'saved' | 'error'>('');

    // 监听来自扩展的消息
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message: ExtensionMessage = event.data;
            
            switch (message.type) {
                case 'files':
                    setFiles(message.data || []);
                    break;
                case 'fileContent':
                    if (message.data) {
                        setSelectedFile(message.data.file);
                        setEditorContent(message.data.content);
                        parseContent(message.data.content);
                        setIsDirty(false);
                        setActiveTab('config');
                    }
                    break;
                case 'saveSuccess':
                    setSaveStatus('saved');
                    setIsDirty(false);
                    setTimeout(() => setSaveStatus(''), 2000);
                    break;
                case 'saveError':
                    setSaveStatus('error');
                    setErrors([{ message: message.data, severity: 'error' }]);
                    break;
                case 'error':
                    setErrors([{ message: message.data, severity: 'error' }]);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        
        // 请求文件列表
        vscode.postMessage({ command: 'getFiles' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 解析内容
    const parseContent = (content: string) => {
        // 这里会实际调用 yamlParser，通过 message 传递给 extension
        vscode.postMessage({ 
            command: 'parseContent', 
            content 
        });
    };

    // 处理编辑器变化
    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setEditorContent(value);
            setIsDirty(true);
            parseContent(value);
        }
    };

    // 处理配置表单变化
    const handleConfigChange = (newConfig: any) => {
        setConfig(newConfig);
        setIsDirty(true);
        
        // 更新编辑器内容
        vscode.postMessage({ 
            command: 'configToYaml', 
            config: newConfig,
            content: ''
        });
    };

    // 处理文件选择
    const handleSelectFile = (file: FileItem) => {
        setSelectedFile(file);
        vscode.postMessage({ 
            command: 'openFile', 
            uri: file.uri 
        });
    };

    // 保存文件
    const handleSave = () => {
        if (!selectedFile) {
            vscode.postMessage({ 
                command: 'saveFile', 
                content: editorContent 
            });
        } else {
            setSaveStatus('saving');
            vscode.postMessage({ 
                command: 'saveFile', 
                uri: selectedFile.uri,
                content: editorContent 
            });
        }
    };

    // 创建新文件
    const handleNewFile = () => {
        vscode.postMessage({ command: 'newFile' });
    };

    // 打开主编辑器
    const handleOpenEditor = () => {
        vscode.postMessage({ command: 'openEditor' });
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>🤖 Agents.md Studio</h1>
                <p className="subtitle">AI编码代理配置可视化编辑器</p>
            </header>

            <nav className="tab-nav">
                <button 
                    className={activeTab === 'files' ? 'active' : ''}
                    onClick={() => setActiveTab('files')}
                >
                    📁 文件
                </button>
                <button 
                    className={activeTab === 'editor' ? 'active' : ''}
                    onClick={() => setActiveTab('editor')}
                >
                    📝 编辑器
                </button>
                <button 
                    className={activeTab === 'config' ? 'active' : ''}
                    onClick={() => setActiveTab('config')}
                >
                    ⚙️ 配置
                </button>
            </nav>

            <main className="app-content">
                {activeTab === 'files' && (
                    <div className="files-section">
                        <div className="section-header">
                            <h3>AGENTS.md 文件</h3>
                            <button onClick={handleNewFile}>+ 新建</button>
                        </div>
                        <FileTree 
                            files={files}
                            selectedFile={selectedFile?.uri}
                            onSelectFile={handleSelectFile}
                        />
                    </div>
                )}

                {activeTab === 'editor' && (
                    <div className="editor-section">
                        <div className="editor-header">
                            <span className="filename">
                                {selectedFile?.name || 'AGENTS.md'}
                                {isDirty && <span className="dirty-indicator">*</span>}
                            </span>
                            <div className="editor-actions">
                                {saveStatus === 'saving' && <span className="save-status">保存中...</span>}
                                {saveStatus === 'saved' && <span className="save-status success">已保存 ✓</span>}
                                {saveStatus === 'error' && <span className="save-status error">保存失败 ✗</span>}
                                <button onClick={handleSave}>保存</button>
                            </div>
                        </div>                        
                        <MonacoEditorComponent 
                            value={editorContent}
                            onChange={handleEditorChange}
                            language="markdown"
                        />
                        <ValidationErrors errors={errors} />
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="config-section">
                        <div className="section-header">
                            <h3>代理配置</h3>
                            <div className="config-actions">
                                {isDirty && <span className="dirty-indicator">有未保存的更改</span>}
                                <button onClick={handleSave}>保存</button>
                            </div>
                        </div>
                        <ConfigForm 
                            config={config}
                            onChange={handleConfigChange}
                        />
                    </div>
                )}
            </main>

            <footer className="app-footer">
                <span>Agents.md Studio v0.1.0</span>
                {selectedFile && <span className="selected-file">{selectedFile.relativePath}</span>}
            </footer>
        </div>
    );
};

// 渲染应用
const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
}
