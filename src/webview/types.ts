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
