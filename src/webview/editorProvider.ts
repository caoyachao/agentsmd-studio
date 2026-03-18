import * as vscode from 'vscode';
import * as path from 'path';
import { AgentsMdConfig, Command, ParseResult, YamlFrontmatterParser } from '../yamlParser';

export class AgentsMdEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'agentsmd-studio.editor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new AgentsMdEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            AgentsMdEditorProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        );
        return providerRegistration;
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // 设置 webview 选项
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'resources')
            ]
        };

        // 设置初始 HTML 内容
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // 初始化文档内容
        this.updateWebview(document, webviewPanel.webview);

        // 监听文档变化
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(document, webviewPanel.webview);
            }
        });

        // 监听 webview 消息
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'save':
                        await this.saveDocument(document, message.config);
                        break;
                    case 'ready':
                        this.updateWebview(document, webviewPanel.webview);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    /**
     * 更新 webview 内容
     */
    private updateWebview(document: vscode.TextDocument, webview: vscode.Webview): void {
        const content = document.getText();
        const parseResult = YamlFrontmatterParser.parse(content);

        webview.postMessage({
            type: 'update',
            config: parseResult.config || {},
            parseError: parseResult.error || null
        });
    }

    /**
     * 保存文档
     */
    private async saveDocument(document: vscode.TextDocument, config: AgentsMdConfig): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        
        // 获取现有内容中的 markdown 部分
        const currentContent = document.getText();
        const parseResult = YamlFrontmatterParser.parse(currentContent);
        const markdownContent = parseResult.content || '';
        
        // 生成新的 YAML frontmatter 内容
        const newContent = YamlFrontmatterParser.stringify(config, markdownContent);
        
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        
        edit.replace(document.uri, fullRange, newContent);
        
        await vscode.workspace.applyEdit(edit);
        await document.save();
    }

    /**
     * 生成 Webview HTML
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const styles = `
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        
        .label-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-weight: normal;
            margin-left: 8px;
        }
        
        input[type="text"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
            font-family: inherit;
        }
        
        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .array-field {
            margin-bottom: 10px;
        }
        
        .array-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .array-item input {
            flex: 1;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .btn-danger {
            background: var(--vscode-errorForeground);
            color: white;
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .btn-icon {
            padding: 4px 8px;
            font-size: 16px;
            line-height: 1;
        }
        
        .commands-section {
            margin-top: 20px;
        }
        
        .command-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .command-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .command-title {
            font-weight: 600;
            font-size: 14px;
        }
        
        .command-fields {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .actions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 12px;
        }
        
        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .success-indicator {
            color: var(--vscode-testing-iconPassed);
            font-weight: 500;
        }
        
        .array-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        
        .tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
        }
        
        .tag button {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0;
            font-size: 14px;
            line-height: 1;
            opacity: 0.7;
        }
        
        .tag button:hover {
            opacity: 1;
        }
        
        .add-tag-row {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .add-tag-row input {
            flex: 1;
        }
        `;

        const script = `
        const vscode = acquireVsCodeApi();
        let currentConfig = {};
        
        // 初始化
        vscode.postMessage({ type: 'ready' });
        
        // 监听来自扩展的消息
        window.addEventListener('message', function(event) {
            const message = event.data;
            
            if (message.type === 'update') {
                currentConfig = message.config || {};
                
                if (message.parseError) {
                    showError(message.parseError);
                } else {
                    hideError();
                    populateForm(currentConfig);
                }
            }
        });
        
        // 填充表单
        function populateForm(config) {
            document.getElementById('name').value = config.name || '';
            document.getElementById('version').value = config.version || '';
            document.getElementById('description').value = config.description || '';
            document.getElementById('role').value = config.role || '';
            document.getElementById('model').value = config.model || '';
            document.getElementById('systemPrompt').value = config.systemPrompt || '';
            
            // 渲染数组字段
            renderTags('capabilities', config.capabilities || []);
            renderTags('tools', config.tools || []);
            
            // 渲染命令
            renderCommands(config.commands || []);
        }
        
        // 渲染标签数组
        function renderTags(fieldName, items) {
            const container = document.getElementById(fieldName + '-container');
            container.innerHTML = '';
            
            items.forEach(function(item, index) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.innerHTML = escapeHtml(item) + 
                    '<button onclick="removeTag(' + "'" + fieldName + "'," + index + ')">×</button>';
                container.appendChild(tag);
            });
        }
        
        // 添加标签
        function addTag(fieldName) {
            const inputId = fieldName === 'capabilities' ? 'new-capability' : 'new-tool';
            const input = document.getElementById(inputId);
            const value = input.value.trim();
            
            if (!value) return;
            
            const array = currentConfig[fieldName] || [];
            array.push(value);
            currentConfig[fieldName] = array;
            
            input.value = '';
            renderTags(fieldName, array);
        }
        
        // 删除标签
        function removeTag(fieldName, index) {
            const array = currentConfig[fieldName] || [];
            array.splice(index, 1);
            currentConfig[fieldName] = array;
            renderTags(fieldName, array);
        }
        
        // 渲染命令列表
        function renderCommands(commands) {
            const container = document.getElementById('commands-container');
            container.innerHTML = '';
            
            commands.forEach(function(cmd, index) {
                const card = document.createElement('div');
                card.className = 'command-card';
                card.innerHTML = 
                    '<div class="command-header">' +
                        '<span class="command-title">命令 #' + (index + 1) + '</span>' +
                        '<button type="button" class="btn btn-danger" onclick="removeCommand(' + index + ')">删除</button>' +
                    '</div>' +
                    '<div class="command-fields">' +
                        '<div>' +
                            '<label>命令名称</label>' +
                            '<input type="text" ' +
                                   'value="' + escapeHtml(cmd.name || '') + '" ' +
                                   'onchange="updateCommand(' + index + ', ' + "'" + 'name' + "'" + ', this.value)" ' +
                                   'placeholder="命令名称">' +
                        '</div>' +
                        '<div>' +
                            '<label>描述</label>' +
                            '<input type="text" ' +
                                   'value="' + escapeHtml(cmd.description || '') + '" ' +
                                   'onchange="updateCommand(' + index + ', ' + "'" + 'description' + "'" + ', this.value)" ' +
                                   'placeholder="命令描述">' +
                        '</div>' +
                        '<div>' +
                            '<label>提示词</label>' +
                            '<textarea rows="3" ' +
                                      'onchange="updateCommand(' + index + ', ' + "'" + 'prompt' + "'" + ', this.value)" ' +
                                      'placeholder="执行此命令时使用的提示词...">' + escapeHtml(cmd.prompt || '') + '</textarea>' +
                        '</div>' +
                    '</div>';
                container.appendChild(card);
            });
        }
        
        // 添加命令
        function addCommand() {
            const commands = currentConfig.commands || [];
            commands.push({ name: '', description: '', prompt: '' });
            currentConfig.commands = commands;
            renderCommands(commands);
        }
        
        // 更新命令
        function updateCommand(index, field, value) {
            if (!currentConfig.commands) currentConfig.commands = [];
            currentConfig.commands[index][field] = value;
        }
        
        // 删除命令
        function removeCommand(index) {
            const commands = currentConfig.commands || [];
            commands.splice(index, 1);
            currentConfig.commands = commands;
            renderCommands(commands);
        }
        
        // 保存配置
        function saveConfig() {
            // 收集表单数据
            currentConfig.name = document.getElementById('name').value;
            currentConfig.version = document.getElementById('version').value;
            currentConfig.description = document.getElementById('description').value;
            currentConfig.role = document.getElementById('role').value;
            currentConfig.model = document.getElementById('model').value;
            currentConfig.systemPrompt = document.getElementById('systemPrompt').value;
            
            vscode.postMessage({
                type: 'save',
                config: currentConfig
            });
            
            showSaveStatus('保存中...');
            
            setTimeout(function() {
                showSaveStatus('✓ 已保存');
                setTimeout(function() {
                    document.getElementById('save-status').innerHTML = '';
                }, 2000);
            }, 500);
        }
        
        // 显示错误
        function showError(message) {
            const container = document.getElementById('error-container');
            container.innerHTML = '<div class="error-message">❌ ' + escapeHtml(message) + '</div>';
        }
        
        // 隐藏错误
        function hideError() {
            document.getElementById('error-container').innerHTML = '';
        }
        
        // 显示保存状态
        function showSaveStatus(message) {
            const status = document.getElementById('save-status');
            status.innerHTML = '<span class="success-indicator">' + escapeHtml(message) + '</span>';
        }
        
        // HTML 转义
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 回车键添加标签
        document.getElementById('new-capability').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag('capabilities');
            }
        });
        
        document.getElementById('new-tool').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag('tools');
            }
        });
        `;

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agents.md Editor</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <h1>🤖 Agents.md 编辑器</h1>
        
        <div id="error-container"></div>
        
        <form id="editor-form">
            <!-- 基础信息 -->
            <div class="form-group">
                <label for="name">
                    名称 (Name)
                    <span class="label-description">Agent 的显示名称</span>
                </label>
                <input type="text" id="name" name="name" placeholder="My Agent">
            </div>
            
            <div class="form-group">
                <label for="version">
                    版本 (Version)
                    <span class="label-description">语义化版本号</span>
                </label>
                <input type="text" id="version" name="version" placeholder="1.0.0">
            </div>
            
            <div class="form-group">
                <label for="description">
                    描述 (Description)
                    <span class="label-description">简要描述 Agent 的用途</span>
                </label>
                <textarea id="description" name="description" rows="3" placeholder="这是一个 AI Agent 配置文件..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="role">
                    角色 (Role)
                    <span class="label-description">Agent 的角色定位</span>
                </label>
                <input type="text" id="role" name="role" placeholder="Assistant">
            </div>
            
            <div class="form-group">
                <label for="model">
                    模型 (Model)
                    <span class="label-description">使用的 AI 模型</span>
                </label>
                <input type="text" id="model" name="model" placeholder="gpt-4">
            </div>
            
            <!-- Capabilities -->
            <div class="form-group">
                <label>
                    能力 (Capabilities)
                    <span class="label-description">Agent 具备的能力列表</span>
                </label>
                <div id="capabilities-container" class="array-tags"></div>
                <div class="add-tag-row">
                    <input type="text" id="new-capability" placeholder="添加新能力...">
                    <button type="button" class="btn btn-secondary" onclick="addTag('capabilities')">添加</button>
                </div>
            </div>
            
            <!-- Tools -->
            <div class="form-group">
                <label>
                    工具 (Tools)
                    <span class="label-description">Agent 可调用的工具列表</span>
                </label>
                <div id="tools-container" class="array-tags"></div>
                <div class="add-tag-row">
                    <input type="text" id="new-tool" placeholder="添加新工具...">
                    <button type="button" class="btn btn-secondary" onclick="addTag('tools')">添加</button>
                </div>
            </div>
            
            <!-- System Prompt -->
            <div class="form-group">
                <label for="systemPrompt">
                    系统提示词 (System Prompt)
                    <span class="label-description">定义 Agent 行为的系统级指令</span>
                </label>
                <textarea id="systemPrompt" name="systemPrompt" rows="6" placeholder="You are a helpful AI assistant..."></textarea>
            </div>
            
            <!-- Commands -->
            <div class="commands-section">
                <label>
                    命令 (Commands)
                    <span class="label-description">自定义命令列表</span>
                </label>
                <div id="commands-container"></div>
                <button type="button" class="btn btn-secondary" onclick="addCommand()" style="margin-top: 12px;">
                    + 添加命令
                </button>
            </div>
            
            <!-- 操作按钮 -->
            <div class="actions">
                <button type="button" class="btn btn-primary" onclick="saveConfig()">
                    💾 保存
                </button>
                <span id="save-status"></span>
            </div>
        </form>
    </div>

    <script>${script}</script>
</body>
</html>`;
    }
}
