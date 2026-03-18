import * as vscode from 'vscode';
import * as path from 'path';

/**
 * AGENTS.md 文件树数据提供器
 * 使用 VS Code TreeView API 展示文件列表
 */
export class AgentsMdTreeDataProvider implements vscode.TreeDataProvider<AgentsMdTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AgentsMdTreeItem | undefined | null | void> = new vscode.EventEmitter<AgentsMdTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AgentsMdTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private fileSystemWatcher: vscode.FileSystemWatcher | undefined;
    private foundFiles: AgentsMdFile[] = [];
    private workspaceRoot: vscode.Uri | undefined;

    constructor() {
        this.initializeWorkspace();
        this.setupFileWatcher();
    }

    private initializeWorkspace(): void {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
        }
    }

    /**
     * 设置文件系统监视器
     */
    private setupFileWatcher(): void {
        // 创建文件监视器来监视 AGENTS.md 和 .agents.md 文件
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
            '**/{AGENTS.md,.agents.md}',
            false, // 不忽略创建
            false, // 不忽略修改
            false  // 不忽略删除
        );

        // 监听文件创建
        this.fileSystemWatcher.onDidCreate(() => {
            this.refresh();
        });

        // 监听文件删除
        this.fileSystemWatcher.onDidDelete(() => {
            this.refresh();
        });

        // 监听文件修改
        this.fileSystemWatcher.onDidChange(() => {
            this.refresh();
        });

        // 监听工作区变化
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.initializeWorkspace();
            this.refresh();
        });
    }

    /**
     * 刷新树视图
     */
    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * 获取树节点
     */
    public getTreeItem(element: AgentsMdTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * 获取子节点
     */
    public async getChildren(element?: AgentsMdTreeItem): Promise<AgentsMdTreeItem[]> {
        if (!this.workspaceRoot) {
            // 没有工作区，显示提示
            return [new AgentsMdTreeItem(
                '请先打开一个工作区文件夹',
                vscode.TreeItemCollapsibleState.None,
                'info'
            )];
        }

        if (!element) {
            // 根级别 - 扫描文件
            const files = await this.scanFiles();
            
            if (files.length === 0) {
                // 没有找到文件
                return [new AgentsMdTreeItem(
                    '未找到 AGENTS.md 文件',
                    vscode.TreeItemCollapsibleState.None,
                    'info',
                    undefined,
                    '点击 + 按钮创建新文件'
                )];
            }

            // 按文件夹分组
            const rootItems: AgentsMdTreeItem[] = [];
            const filesByFolder = this.groupFilesByFolder(files);

            for (const [folderPath, folderFiles] of filesByFolder) {
                if (folderPath === '.') {
                    // 根目录下的文件直接显示
                    for (const file of folderFiles) {
                        rootItems.push(this.createFileTreeItem(file));
                    }
                } else {
                    // 子文件夹创建文件夹节点
                    const folderItem = new AgentsMdTreeItem(
                        folderPath,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'folder',
                        undefined,
                        `${folderFiles.length} 个文件`
                    );
                    folderItem.children = folderFiles.map(f => this.createFileTreeItem(f));
                    rootItems.push(folderItem);
                }
            }

            return rootItems;
        } else {
            // 返回子节点
            return element.children || [];
        }
    }

    /**
     * 创建文件树节点
     */
    private createFileTreeItem(file: AgentsMdFile): AgentsMdTreeItem {
        const isHidden = file.name.startsWith('.');
        const item = new AgentsMdTreeItem(
            file.name,
            vscode.TreeItemCollapsibleState.None,
            'file',
            file.uri,
            file.relativePath,
            isHidden ? 'hidden' : 'normal'
        );
        
        // 设置点击命令
        item.command = {
            command: 'agentsmd-studio.openFileInEditor',
            title: '打开文件',
            arguments: [file.uri]
        };

        return item;
    }

    /**
     * 按文件夹分组文件
     */
    private groupFilesByFolder(files: AgentsMdFile[]): Map<string, AgentsMdFile[]> {
        const groups = new Map<string, AgentsMdFile[]>();
        
        for (const file of files) {
            const dir = path.dirname(file.relativePath);
            const folderPath = dir === '.' ? '.' : dir;
            
            if (!groups.has(folderPath)) {
                groups.set(folderPath, []);
            }
            groups.get(folderPath)!.push(file);
        }

        return groups;
    }

    /**
     * 扫描 AGENTS.md 文件
     */
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

        // 排序：根目录优先，然后按路径排序
        files.sort((a, b) => {
            const aDepth = a.relativePath.split(path.sep).length;
            const bDepth = b.relativePath.split(path.sep).length;
            if (aDepth !== bDepth) {
                return aDepth - bDepth;
            }
            return a.relativePath.localeCompare(b.relativePath);
        });

        this.foundFiles = files;
        return files;
    }

    /**
     * 获取已发现的文件
     */
    public getFoundFiles(): AgentsMdFile[] {
        return this.foundFiles;
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.fileSystemWatcher?.dispose();
    }
}

/**
 * 树节点项
 */
export class AgentsMdTreeItem extends vscode.TreeItem {
    public children?: AgentsMdTreeItem[];
    public fileType?: 'normal' | 'hidden';

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: 'file' | 'folder' | 'info',
        public readonly uri?: vscode.Uri,
        public readonly description?: string,
        fileType?: 'normal' | 'hidden'
    ) {
        super(label, collapsibleState);
        
        this.description = description;
        this.fileType = fileType;
        this.tooltip = this.getTooltip();
        this.iconPath = this.getIconPath();
        
        // 文件节点设为叶子节点
        if (contextValue === 'file') {
            this.resourceUri = uri;
        }
    }

    private getTooltip(): string {
        if (this.contextValue === 'file') {
            return `文件: ${this.description || this.label}\n点击在编辑器中打开`;
        } else if (this.contextValue === 'folder') {
            return `文件夹: ${this.label}\n包含 ${this.children?.length || 0} 个文件`;
        }
        return this.label;
    }

    private getIconPath(): vscode.ThemeIcon | undefined {
        switch (this.contextValue) {
            case 'file':
                return this.fileType === 'hidden' 
                    ? new vscode.ThemeIcon('file-code', new vscode.ThemeColor('descriptionForeground'))
                    : new vscode.ThemeIcon('file-code', new vscode.ThemeColor('charts.blue'));
            case 'folder':
                return new vscode.ThemeIcon('folder');
            case 'info':
                return new vscode.ThemeIcon('info');
            default:
                return undefined;
        }
    }
}

/**
 * AGENTS.md 文件接口
 */
export interface AgentsMdFile {
    uri: vscode.Uri;
    name: string;
    relativePath: string;
}
