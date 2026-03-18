import * as vscode from 'vscode';
import * as path from 'path';
import { AgentsMdTreeDataProvider, AgentsMdTreeItem } from './treeView';
import { AgentsMdEditorProvider } from './webview/editorProvider';
import { TemplateManager, Template } from './templates/templateManager';

// TreeView 实例
let treeView: vscode.TreeView<AgentsMdTreeItem> | undefined;
let treeDataProvider: AgentsMdTreeDataProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Agents.md Studio is now active!');

    // 初始化 TreeDataProvider
    treeDataProvider = new AgentsMdTreeDataProvider();

    // 注册 TreeView
    treeView = vscode.window.createTreeView('agentsmd-studio.files', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true,
        canSelectMany: false
    });

    context.subscriptions.push(treeView);

    // 注册自定义编辑器
    const editorRegistration = AgentsMdEditorProvider.register(context);
    context.subscriptions.push(editorRegistration);

    // 注册命令
    registerCommands(context);

    // 初始扫描
    treeDataProvider.scanFiles().then(files => {
        console.log(`Found ${files.length} AGENTS.md files`);
    });
}

/**
 * 注册所有命令
 */
function registerCommands(context: vscode.ExtensionContext): void {
    // 打开编辑器命令
    const openEditorCommand = vscode.commands.registerCommand(
        'agentsmd-studio.openEditor',
        () => {
            vscode.window.showInformationMessage('Agents.md Studio - 使用侧边栏查看文件树');
        }
    );

    // 在编辑器中打开文件
    const openFileInEditorCommand = vscode.commands.registerCommand(
        'agentsmd-studio.openFileInEditor',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('未选择文件');
                return;
            }

            try {
                // 使用自定义编辑器打开
                await vscode.commands.executeCommand('vscode.openWith', uri, AgentsMdEditorProvider.viewType);
            } catch (error) {
                vscode.window.showErrorMessage(`无法打开文件: ${error}`);
            }
        }
    );

    // 刷新文件列表
    const refreshFilesCommand = vscode.commands.registerCommand(
        'agentsmd-studio.refreshFiles',
        () => {
            treeDataProvider?.refresh();
            vscode.window.showInformationMessage('AGENTS.md 文件列表已刷新');
        }
    );

    // 创建新文件
    const newFileCommand = vscode.commands.registerCommand(
        'agentsmd-studio.newFile',
        async () => {
            await createNewAgentsMdFile();
        }
    );

    // 扫描工作区
    const scanWorkspaceCommand = vscode.commands.registerCommand(
        'agentsmd-studio.scanWorkspace',
        async () => {
            const files = await treeDataProvider?.scanFiles() || [];
            if (files.length === 0) {
                const action = await vscode.window.showInformationMessage(
                    '未找到 AGENTS.md 文件',
                    '创建新文件',
                    '确定'
                );
                if (action === '创建新文件') {
                    await createNewAgentsMdFile();
                }
            } else {
                const items = files.map(f => ({
                    label: f.relativePath,
                    description: f.name,
                    uri: f.uri
                }));
                
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: '选择一个文件打开',
                    canPickMany: false
                });

                if (selected) {
                    vscode.commands.executeCommand('agentsmd-studio.openFileInEditor', selected.uri);
                }
            }
        }
    );

    // 从模板创建新文件
    const newFromTemplateCommand = vscode.commands.registerCommand(
        'agentsmd-studio.newFromTemplate',
        async () => {
            await createNewFromTemplate();
        }
    );

    // 预览模板
    const previewTemplateCommand = vscode.commands.registerCommand(
        'agentsmd-studio.previewTemplate',
        async () => {
            await previewTemplate();
        }
    );

    context.subscriptions.push(
        openEditorCommand,
        openFileInEditorCommand,
        refreshFilesCommand,
        newFileCommand,
        newFromTemplateCommand,
        previewTemplateCommand,
        scanWorkspaceCommand
    );
}

/**
 * 创建新的 AGENTS.md 文件
 */
async function createNewAgentsMdFile(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('没有打开的工作区文件夹');
        return;
    }

    // 选择保存位置
    const rootFolder = workspaceFolders[0];
    const fileName = await vscode.window.showInputBox({
        prompt: '输入文件名',
        placeHolder: 'AGENTS.md',
        value: 'AGENTS.md',
        validateInput: (value) => {
            if (!value) {
                return '文件名不能为空';
            }
            if (!value.endsWith('.md')) {
                return '文件必须以 .md 结尾';
            }
            return null;
        }
    });

    if (!fileName) {
        return;
    }

    const fileUri = vscode.Uri.joinPath(rootFolder.uri, fileName);

    // 默认模板内容
    const defaultContent = `---
name: My Agent
version: 1.0.0
description: An AI agent configuration
tools:
  - web_search
  - file_read
  - code_execution
capabilities:
  - data analysis
  - code generation
  - web browsing
---

# My Agent

## Description

This is my AI agent configuration file.

## Capabilities

- Data analysis
- Code generation  
- Web browsing

## Tools

- web_search
- file_read
- code_execution

## System Prompt

You are a helpful AI assistant.
`;

    try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(fileUri, encoder.encode(defaultContent));
        
        // 刷新树视图
        treeDataProvider?.refresh();
        
        // 在编辑器中打开新文件
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
        
        vscode.window.showInformationMessage(`已创建文件: ${fileName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`创建文件失败: ${error}`);
    }
}

export function deactivate() {
    console.log('Agents.md Studio is now deactivated!');
    treeDataProvider?.dispose();
}

/**
 * 从模板创建新的 AGENTS.md 文件
 */
async function createNewFromTemplate(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('没有打开的工作区文件夹');
        return;
    }

    const templates = TemplateManager.getAllTemplates();
    
    // 显示模板选择器
    const selected = await vscode.window.showQuickPick(
        templates.map(t => ({
            label: `${t.icon} ${t.name}`,
            description: t.description,
            detail: `类别: ${t.category}`,
            template: t
        })),
        {
            placeHolder: '选择一个模板创建新的 Agents.md 文件',
            canPickMany: false
        }
    );

    if (!selected) {
        return;
    }

    const template = selected.template;

    // 输入文件名
    const fileName = await vscode.window.showInputBox({
        prompt: `使用模板 "${template.name}" 创建文件`,
        placeHolder: 'AGENTS.md',
        value: 'AGENTS.md',
        validateInput: (value) => {
            if (!value) {
                return '文件名不能为空';
            }
            if (!value.endsWith('.md')) {
                return '文件必须以 .md 结尾';
            }
            return null;
        }
    });

    if (!fileName) {
        return;
    }

    const rootFolder = workspaceFolders[0];
    const fileUri = vscode.Uri.joinPath(rootFolder.uri, fileName);

    try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(fileUri, encoder.encode(template.defaultContent));
        
        // 刷新树视图
        treeDataProvider?.refresh();
        
        // 使用自定义编辑器打开新文件
        await vscode.commands.executeCommand('vscode.openWith', fileUri, AgentsMdEditorProvider.viewType);
        
        vscode.window.showInformationMessage(`已使用模板 "${template.name}" 创建文件: ${fileName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`创建文件失败: ${error}`);
    }
}

/**
 * 预览模板
 */
async function previewTemplate(): Promise<void> {
    const templates = TemplateManager.getAllTemplates();
    
    const selected = await vscode.window.showQuickPick(
        templates.map(t => ({
            label: `${t.icon} ${t.name}`,
            description: t.description,
            detail: `类别: ${t.category}`,
            template: t
        })),
        {
            placeHolder: '选择一个模板预览',
            canPickMany: false
        }
    );

    if (!selected) {
        return;
    }

    const template = selected.template;

    // 创建临时文档预览
    const doc = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: template.defaultContent
    });

    // 只读预览
    await vscode.window.showTextDocument(doc, { preview: true });
    
    // 询问是否使用此模板创建
    const action = await vscode.window.showInformationMessage(
        `预览模板: ${template.name}`,
        '使用此模板',
        '关闭'
    );

    if (action === '使用此模板') {
        await createNewFromTemplate();
    }
}
