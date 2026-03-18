import * as React from 'react';
import { AgentsMdConfig, Command } from '../types';

interface ConfigFormProps {
    config: AgentsMdConfig;
    onChange: (config: AgentsMdConfig) => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange }) => {
    const handleFieldChange = (field: keyof AgentsMdConfig, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleCommandAdd = () => {
        const newCommand: Command = { 
            name: '', 
            description: '' 
        };
        const commands = [...(config.commands || []), newCommand];
        handleFieldChange('commands', commands);
    };

    const handleCommandRemove = (index: number) => {
        const commands = [...(config.commands || [])];
        commands.splice(index, 1);
        handleFieldChange('commands', commands);
    };

    const handleCommandChange = (index: number, field: keyof Command, value: string) => {
        const commands = [...(config.commands || [])];
        commands[index] = { ...commands[index], [field]: value };
        handleFieldChange('commands', commands);
    };

    return (
        <div className="config-form">
            <h3>📝 基础信息</h3>
            
            <div className="form-group">
                <label htmlFor="name">名称 (Name)</label>
                <input
                    type="text"
                    id="name"
                    value={config.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="输入代理名称"
                />
            </div>

            <div className="form-row">
                <div className="form-group half">
                    <label htmlFor="version">版本 (Version)</label>
                    <input
                        type="text"
                        id="version"
                        value={config.version || ''}
                        onChange={(e) => handleFieldChange('version', e.target.value)}
                        placeholder="如: 1.0.0"
                    />
                </div>

                <div className="form-group half">
                    <label htmlFor="model">模型 (Model)</label>
                    <select
                        id="model"
                        value={config.model || 'gpt-4'}
                        onChange={(e) => handleFieldChange('model', e.target.value)}
                    >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="local">本地模型</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="description">描述 (Description)</label>
                <textarea
                    id="description"
                    value={config.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="简短描述这个AI代理的用途"
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label htmlFor="role">角色 (Role)</label>
                <input
                    type="text"
                    id="role"
                    value={config.role || ''}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                    placeholder="如: 资深开发工程师"
                />
            </div>

            <h3>⚡ 命令 (Commands)</h3>
            <div className="commands-section">
                {(config.commands || []).map((cmd: Command, index: number) => (
                    <div key={index} className="command-item">
                        <div className="command-header">
                            <span className="command-number">#{index + 1}</span>
                            <button 
                                className="btn-remove"
                                onClick={() => handleCommandRemove(index)}
                                title="删除命令"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="form-group">
                            <label>命令名称</label>
                            <input
                                type="text"
                                value={cmd.name}
                                onChange={(e) => handleCommandChange(index, 'name', e.target.value)}
                                placeholder="如: /generate-code"
                            />
                        </div>
                        <div className="form-group">
                            <label>描述</label>
                            <input
                                type="text"
                                value={cmd.description || ''}
                                onChange={(e) => handleCommandChange(index, 'description', e.target.value)}
                                placeholder="描述这个命令的功能"
                            />
                        </div>
                    </div>
                ))}
                
                <button 
                    className="btn-add-command"
                    onClick={handleCommandAdd}
                >
                    + 添加命令
                </button>
            </div>

            <div className="form-group">
                <label htmlFor="systemPrompt">系统提示词 (System Prompt)</label>
                <textarea
                    id="systemPrompt"
                    value={config.systemPrompt || ''}
                    onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                    placeholder="输入系统提示词，定义AI的行为方式..."
                    rows={6}
                />
            </div>
        </div>
    );
};
