import { useAppStore } from '../store/appStore';

export function getIdeContext(): string {
    const appStore = useAppStore();
    let contextStr = '--- IDE Context ---\n\n';

    // 1. Workspace Variables
    const variables = appStore.workspaceVariables;
    const varNames = Object.keys(variables);
    if (varNames.length > 0) {
        contextStr += 'Active Variables:\n';
        for (const name of varNames) {
            const v = variables[name];
            // Adapt properties based on how workspace variables are formatted in the backend
            const vType = v?.type || typeof v;
            const vSize = v?.size || v?.length || 'unknown size';
            contextStr += `- ${name}: ${vType} (Size: ${vSize})\n`;
        }
    } else {
        contextStr += 'Active Variables: None\n';
    }

    contextStr += '\n';

    // 2. Active File Code
    const activeTab = appStore.activeTab;
    if (activeTab) {
        const activeFile = appStore.openFiles.find(f => f.path === activeTab);
        if (activeFile && activeFile.content) {
            contextStr += `Active File: ${activeFile.name}\n`;
            contextStr += '```' + (activeFile.language || 'julia') + '\n';
            contextStr += activeFile.content;
            contextStr += '\n```\n';
        } else {
            contextStr += `Active File: ${activeTab} (No content loaded)\n`;
        }
    } else {
        contextStr += 'Active File: None\n';
    }

    contextStr += '\n--- End IDE Context ---\n';

    return contextStr;
}
