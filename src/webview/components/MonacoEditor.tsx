import * as React from 'react';

// Monaco Editor 的动态导入
let MonacoEditor: any = null;

interface MonacoEditorProps {
    defaultValue?: string;
    value?: string;
    language?: string;
    theme?: string;
    onChange?: (value: string | undefined) => void;
    height?: string;
    options?: any;
}

export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
    defaultValue = '',
    value,
    language = 'markdown',
    theme = 'vs-dark',
    onChange,
    height = '100%',
    options = {}
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<any>(null);
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        const loadMonaco = async () => {
            try {
                // 动态导入 Monaco
                const monacoReact = await import('@monaco-editor/react');
                MonacoEditor = monacoReact.default;
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load Monaco Editor:', error);
            }
        };

        loadMonaco();
    }, []);

    const handleEditorChange = (newValue: string | undefined) => {
        onChange?.(newValue);
    };

    const editorOptions = {
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        ...options
    };

    if (!isLoaded || !MonacoEditor) {
        return (
            <div 
                ref={containerRef}
                style={{
                    height: typeof height === 'string' && height.endsWith('%') 
                        ? `calc(${height} - 40px)` 
                        : height || '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1e1e1e',
                    color: '#cccccc',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                }}
            >
                🔄 正在加载编辑器...
            </div>
        );
    }

    return (
        <div style={{ height: typeof height === 'string' && height.endsWith('%') ? `calc(${height} - 40px)` : height || '400px' }}>
            <MonacoEditor
                height="100%"
                language={language}
                theme={theme}
                value={value}
                defaultValue={defaultValue}
                onChange={handleEditorChange}
                options={editorOptions}
                loading={<div style={{ color: '#cccccc', padding: '20px' }}>🔄 加载 Monaco Editor...</div>}
            />
        </div>
    );
};
