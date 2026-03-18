import * as vscode from 'vscode';
import * as path from 'path';

export interface AgentsMdFile {
    uri: vscode.Uri;
    name: string;
    relativePath: string;
}

export class AgentsMdFileWatcher {
    private fileSystemWatcher: vscode.FileSystemWatcher | undefined;
    private foundFiles: AgentsMdFile[] = [];
    private onFilesChangedCallback: ((files: AgentsMdFile[]) => void) | undefined;

    constructor(private workspaceRoot: vscode.Uri) {}

    public async startWatching(): Promise<void> {
        // 创建文件监视器来监视 AGENTS.md 和 .agents.md 文件
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
            '**/{AGENTS.md,.agents.md}',
            false, // 不忽略创建
            false, // 不忽略修改
            false  // 不忽略删除
        );

        // 监听文件创建
        this.fileSystemWatcher.onDidCreate((uri) => {
            this.scanFiles();
        });

        // 监听文件删除
        this.fileSystemWatcher.onDidDelete((uri) => {
            this.scanFiles();
        });

        // 监听文件修改
        this.fileSystemWatcher.onDidChange((uri) => {
            this.onFilesChangedCallback?.(this.foundFiles);
        });

        // 初始扫描
        await this.scanFiles();
    }

    public async scanFiles(): Promise<AgentsMdFile[]> {
        if (!vscode.workspace.workspaceFolders) {
            this.foundFiles = [];
            return this.foundFiles;
        }

        const files: AgentsMdFile[] = [];
        
        for (const folder of vscode.workspace.workspaceFolders) {
            // 查找 AGENTS.md 文件
            const agentsMdPattern = new vscode.RelativePattern(folder, '**/AGENTS.md');
            const agentsMdFiles = await vscode.workspace.findFiles(agentsMdPattern, '**/node_modules/**');
            
            // 查找 .agents.md 文件
            const hiddenPattern = new vscode.RelativePattern(folder, '**/.agents.md');
            const hiddenFiles = await vscode.workspace.findFiles(hiddenPattern, '**/node_modules/**');

            // 合并结果
            const allFiles = [...agentsMdFiles, ...hiddenFiles];
            
            for (const uri of allFiles) {
                const relativePath = vscode.workspace.asRelativePath(uri);
                files.push({
                    uri,
                    name: path.basename(relativePath),
                    relativePath
                });
            }
        }

        this.foundFiles = files;
        this.onFilesChangedCallback?.(files);
        return files;
    }

    public getFoundFiles(): AgentsMdFile[] {
        return this.foundFiles;
    }

    public onFilesChanged(callback: (files: AgentsMdFile[]) => void): void {
        this.onFilesChangedCallback = callback;
    }

    public dispose(): void {
        this.fileSystemWatcher?.dispose();
    }
}
