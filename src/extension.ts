import * as vscode from 'vscode';
import { LmApiProxyServer } from './server/server';
import { logger, LogLevel } from './utils/logger';
import { modelManager } from './model/manager';

let proxyServer: LmApiProxyServer | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    logger.info('LM API Proxy extension activated');

    // Initialize model manager
    modelManager.initialize(context.globalState);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'lmApiProxy.status';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    const startCommand = vscode.commands.registerCommand('lmApiProxy.start', async () => {
        await startProxyServer();
    });

    const stopCommand = vscode.commands.registerCommand('lmApiProxy.stop', async () => {
        await stopProxyServer();
    });

    const statusCommand = vscode.commands.registerCommand('lmApiProxy.status', async () => {
        showStatus();
    });

    // Register model selection command
    const selectModelCommand = vscode.commands.registerCommand('lmApiProxy.selectModel', async () => {
        await modelManager.selectModel();
    });

    // Register log level command
    const setLogLevelCommand = vscode.commands.registerCommand('lmApiProxy.setLogLevel', async () => {
        const items = [
            { label: 'DEBUG (0)', description: 'Show all logs including detailed debug information', level: LogLevel.DEBUG },
            { label: 'INFO (1)', description: 'Show informational messages and above', level: LogLevel.INFO },
            { label: 'WARN (2)', description: 'Show warnings and errors only', level: LogLevel.WARN },
            { label: 'ERROR (3)', description: 'Show errors only', level: LogLevel.ERROR },
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select log level',
            title: 'LM API Proxy - Log Level',
        });

        if (selected) {
            logger.setLogLevel(selected.level);
            const config = vscode.workspace.getConfiguration('lmApiProxy');
            await config.update('logLevel', selected.level, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Log level set to: ${selected.label}`);
        }
    });

    // Register show/clear output commands
    const showOutputCommand = vscode.commands.registerCommand('lmApiProxy.showOutput', () => {
        logger.show();
    });

    const clearOutputCommand = vscode.commands.registerCommand('lmApiProxy.clearOutput', () => {
        logger.clear();
        logger.info('Output cleared');
    });

    context.subscriptions.push(
        startCommand,
        stopCommand,
        statusCommand,
        selectModelCommand,
        setLogLevelCommand,
        showOutputCommand,
        clearOutputCommand
    );

    // Listen for configuration changes
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('lmApiProxy')) {
            handleConfigurationChange();
        }
    });
    context.subscriptions.push(configChangeListener);

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('lmApiProxy');
    if (config.get('autoStart', false)) {
        startProxyServer();
    }
}

export function deactivate() {
    if (proxyServer) {
        proxyServer.stop();
        proxyServer = undefined;
    }
    logger.info('LM API Proxy extension deactivated');
}

async function startProxyServer(): Promise<void> {
    if (proxyServer && proxyServer.isRunning()) {
        vscode.window.showInformationMessage('LM API Proxy server is already running');
        return;
    }

    try {
        // Check if Language Model API is available
        const models = await vscode.lm.selectChatModels({});
        if (models.length === 0) {
            vscode.window.showWarningMessage(
                'No language models are available. Make sure GitHub Copilot is enabled and you have appropriate permissions.',
                'Learn More'
            ).then(selection => {
                if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/copilot/copilot-chat'));
                }
            });
            return;
        }

        const config = vscode.workspace.getConfiguration('lmApiProxy');
        const port = config.get('port', 3000);

        proxyServer = new LmApiProxyServer(port);
        await proxyServer.start();

        updateStatusBar();
        
        const message = `LM API Proxy server started on port ${port} (accessible from all network interfaces)`;
        vscode.window.showInformationMessage(message, 'Open Local', 'Copy Local URL', 'Show Network Info').then(selection => {
            if (selection === 'Open Local') {
                vscode.env.openExternal(vscode.Uri.parse(`http://127.0.0.1:${port}/health`));
            } else if (selection === 'Copy Local URL') {
                vscode.env.clipboard.writeText(`http://127.0.0.1:${port}`);
                vscode.window.showInformationMessage('Local server URL copied to clipboard');
            } else if (selection === 'Show Network Info') {
                vscode.window.showInformationMessage(
                    `Server is accessible from:\n• Local: http://127.0.0.1:${port}\n• Network: http://[YOUR_IP]:${port}\n• All interfaces: http://0.0.0.0:${port}`,
                    { modal: false }
                );
            }
        });

        logger.info(message);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to start LM API Proxy server: ${errorMessage}`);
        logger.error('Failed to start proxy server', error as Error);
        updateStatusBar();
    }
}

async function stopProxyServer(): Promise<void> {
    if (!proxyServer || !proxyServer.isRunning()) {
        vscode.window.showInformationMessage('LM API Proxy server is not running');
        return;
    }

    try {
        await proxyServer.stop();
        proxyServer = undefined;
        updateStatusBar();
        vscode.window.showInformationMessage('LM API Proxy server stopped');
        logger.info('LM API Proxy server stopped');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to stop LM API Proxy server: ${errorMessage}`);
        logger.error('Failed to stop proxy server', error as Error);
    }
}

function showStatus(): void {
    if (proxyServer && proxyServer.isRunning()) {
        const port = proxyServer.getPort();
        const message = `LM API Proxy server is running on port ${port} (all interfaces)`;
        
        vscode.window.showInformationMessage(message, 'Open Local', 'Copy Local URL', 'Show Network Access', 'Stop Server').then(selection => {
            if (selection === 'Open Local') {
                vscode.env.openExternal(vscode.Uri.parse(`http://127.0.0.1:${port}/health`));
            } else if (selection === 'Copy Local URL') {
                vscode.env.clipboard.writeText(`http://127.0.0.1:${port}`);
                vscode.window.showInformationMessage('Local URL copied to clipboard');
            } else if (selection === 'Show Network Access') {
                vscode.window.showInformationMessage(
                    `Access the API from:\n• Local: http://127.0.0.1:${port}\n• Network: http://[YOUR_IP_ADDRESS]:${port}\n• Any interface: http://0.0.0.0:${port}`,
                    { modal: false }
                );
            } else if (selection === 'Stop Server') {
                stopProxyServer();
            }
        });
    } else {
        vscode.window.showInformationMessage('LM API Proxy server is not running', 'Start Server').then(selection => {
            if (selection === 'Start Server') {
                startProxyServer();
            }
        });
    }
}

function updateStatusBar(): void {
    if (proxyServer && proxyServer.isRunning()) {
        statusBarItem.text = `$(server) LM Proxy:${proxyServer.getPort()}`;
        statusBarItem.tooltip = 'LM API Proxy server is running - Click for details';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '$(server) LM Proxy:Off';
        statusBarItem.tooltip = 'LM API Proxy server is stopped - Click to start';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

async function handleConfigurationChange(): Promise<void> {
    const config = vscode.workspace.getConfiguration('lmApiProxy');
    const newPort = config.get('port', 3000);
    
    if (proxyServer && proxyServer.getPort() !== newPort) {
        if (proxyServer.isRunning()) {
            const restartConfirm = await vscode.window.showInformationMessage(
                'Port configuration changed. Restart the server to apply changes?',
                'Restart',
                'Later'
            );
            
            if (restartConfirm === 'Restart') {
                await stopProxyServer();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
                await startProxyServer();
            }
        } else {
            proxyServer.updatePort(newPort);
        }
    }
}
