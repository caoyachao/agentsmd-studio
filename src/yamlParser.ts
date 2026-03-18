import * as yaml from 'js-yaml';

export interface Command {
    name: string;
    description?: string;
    prompt?: string;
}

export interface AgentsMdConfig {
    name?: string;
    version?: string;
    description?: string;
    role?: string;
    model?: string;
    commands?: Command[];
    capabilities?: string[];
    tools?: string[];
    systemPrompt?: string;
    [key: string]: any;
}

export interface ParseResult {
    success: boolean;
    config?: AgentsMdConfig;
    frontmatter?: string;
    content?: string;
    error?: string;
    errorLine?: number;
}

export class YamlFrontmatterParser {
    /**
     * 解析 AGENTS.md 文件内容
     */
    public static parse(content: string): ParseResult {
        const result: ParseResult = { success: false };

        // 检查是否有 YAML frontmatter (--- 开头)
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const markdownContent = frontmatterMatch[2];

            try {
                const config = yaml.load(frontmatter) as AgentsMdConfig;
                
                // 如果没有 frontmatter，尝试从 markdown 内容解析
                if (!config) {
                    const parsedFromMd = this.parseFromMarkdown(content);
                    return {
                        success: true,
                        config: parsedFromMd,
                        content: content
                    };
                }

                // 合并从 markdown 解析的内容
                const mdParsed = this.parseFromMarkdown(markdownContent);
                const mergedConfig = { ...mdParsed, ...config };

                result.success = true;
                result.config = mergedConfig;
                result.frontmatter = frontmatter;
                result.content = markdownContent;
            } catch (error: any) {
                result.success = false;
                result.error = `YAML 解析错误: ${error.message}`;
                result.errorLine = this.findErrorLine(content, error.message);
            }
        } else {
            // 没有 frontmatter，尝试从 markdown 格式解析
            const config = this.parseFromMarkdown(content);
            result.success = true;
            result.config = config;
            result.content = content;
        }

        return result;
    }

    /**
     * 将配置序列化为 AGENTS.md 内容
     */
    public static stringify(config: AgentsMdConfig, content?: string): string {
        const { name, version, description, role, model, commands, ...rest } = config;
        
        // 构建 frontmatter
        const frontmatterConfig: any = {
            name,
            version,
            description,
            role,
            model,
            commands,
            ...rest
        };

        // 移除 undefined 值
        Object.keys(frontmatterConfig).forEach(key => {
            if (frontmatterConfig[key] === undefined) {
                delete frontmatterConfig[key];
            }
        });

        const frontmatter = yaml.dump(frontmatterConfig, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        // 如果有额外的 content，追加在后面
        if (content && content.trim()) {
            return `---\n${frontmatter}---\n\n${content.trim()}\n`;
        }

        return `---\n${frontmatter}---\n`;
    }

    /**
     * 验证 YAML 格式
     */
    public static validate(content: string): { valid: boolean; error?: string; line?: number } {
        try {
            yaml.load(content);
            return { valid: true };
        } catch (error: any) {
            return {
                valid: false,
                error: error.message,
                line: error.mark?.line
            };
        }
    }

    /**
     * 从 Markdown 内容解析配置
     */
    private static parseFromMarkdown(content: string): AgentsMdConfig {
        const config: AgentsMdConfig = {};
        
        // 解析标题作为 name
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            config.name = titleMatch[1].trim();
        }

        // 解析 Name 部分
        const nameMatch = content.match(/##\s*Name\s*\n+([^#]+)/i);
        if (nameMatch) {
            config.name = nameMatch[1].trim();
        }

        // 解析 Role 部分
        const roleMatch = content.match(/##\s*Role\s*\n+([^#]+)/i);
        if (roleMatch) {
            config.role = roleMatch[1].trim();
        }

        // 解析 Description 部分
        const descMatch = content.match(/##\s*Description\s*\n+([^#]+)/i);
        if (descMatch) {
            config.description = descMatch[1].trim();
        }

        // 解析 Capabilities
        const capMatch = content.match(/##\s*Capabilities\s*\n+([\s\S]*?)(?=##|$)/i);
        if (capMatch) {
            const capLines = capMatch[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().substring(1).trim());
            if (capLines.length > 0) {
                config.capabilities = capLines;
            }
        }

        // 解析 Tools
        const toolsMatch = content.match(/##\s*Tools\s*\n+([\s\S]*?)(?=##|$)/i);
        if (toolsMatch) {
            const toolLines = toolsMatch[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().substring(1).trim());
            if (toolLines.length > 0) {
                config.tools = toolLines;
            }
        }

        // 解析 System Prompt
        const promptMatch = content.match(/##\s*System Prompt\s*\n+([\s\S]*?)(?=##|$)/i);
        if (promptMatch) {
            config.systemPrompt = promptMatch[1].trim();
        }

        // 解析 Commands
        const commandsMatch = content.match(/##\s*Commands\s*\n+([\s\S]*?)(?=##|$)/i);
        if (commandsMatch) {
            const commands: Command[] = [];
            const cmdBlocks = commandsMatch[1].split(/\n\n/).filter(block => block.trim());
            
            for (const block of cmdBlocks) {
                const lines = block.split('\n').filter(l => l.trim());
                if (lines.length >= 1) {
                    const cmd: Command = { name: lines[0].replace(/^-\s*/, '').trim() };
                    
                    // 查找 description
                    const descLine = lines.find(l => l.includes('Description:'));
                    if (descLine) {
                        cmd.description = descLine.split('Description:')[1].trim();
                    }
                    
                    commands.push(cmd);
                }
            }
            
            if (commands.length > 0) {
                config.commands = commands;
            }
        }

        return config;
    }

    /**
     * 查找错误行号
     */
    private static findErrorLine(content: string, errorMessage: string): number | undefined {
        const lineMatch = errorMessage.match(/line\s+(\d+)/i);
        if (lineMatch) {
            return parseInt(lineMatch[1], 10);
        }
        return undefined;
    }
}
