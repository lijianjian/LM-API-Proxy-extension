// Logger utility for VS Code LM API Proxy
import * as vscode from 'vscode';

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * Logger class for managing output
 */
export class Logger {
    private outputChannel: vscode.OutputChannel;
    private currentLogLevel: LogLevel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('LM Proxy');
        
        // Get log level from configuration
        const config = vscode.workspace.getConfiguration('lmApiProxy');
        this.currentLogLevel = config.get<LogLevel>('logLevel') ?? LogLevel.INFO;

        this.outputChannel.appendLine(
            this.formatMessage('INFO', `Logger initialized with log level: ${LogLevel[this.currentLogLevel]}`)
        );
        
        if (this.currentLogLevel > LogLevel.DEBUG) {
            this.outputChannel.appendLine(
                this.formatMessage('INFO', 'For detailed request/response logs, set "lmApiProxy.logLevel": 0 in settings.json')
            );
        }
    }

    /**
     * Format log message with timestamp and level
     */
    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    /**
     * Log debug message
     */
    public debug(message: string, ...args: any[]): void {
        if (this.currentLogLevel <= LogLevel.DEBUG) {
            const fullMessage = args.length > 0 
                ? `${message} ${JSON.stringify(args, null, 2)}`
                : message;
            this.outputChannel.appendLine(this.formatMessage('DEBUG', fullMessage));
        }
    }

    /**
     * Log info message
     */
    public info(message: string): void {
        if (this.currentLogLevel <= LogLevel.INFO) {
            this.outputChannel.appendLine(this.formatMessage('INFO', message));
        }
    }

    /**
     * Log warning message
     */
    public warn(message: string, ...args: any[]): void {
        if (this.currentLogLevel <= LogLevel.WARN) {
            const fullMessage = args.length > 0 
                ? `${message} ${JSON.stringify(args, null, 2)}`
                : message;
            this.outputChannel.appendLine(this.formatMessage('WARN', fullMessage));
        }
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error | any, ...args: any[]): void {
        if (this.currentLogLevel <= LogLevel.ERROR) {
            let fullMessage = message;
            
            if (error) {
                if (error instanceof Error) {
                    fullMessage += `\n  Error: ${error.message}\n  Stack: ${error.stack}`;
                } else {
                    fullMessage += `\n  ${JSON.stringify(error, null, 2)}`;
                }
            }
            
            if (args.length > 0) {
                fullMessage += `\n  Additional info: ${JSON.stringify(args, null, 2)}`;
            }
            
            this.outputChannel.appendLine(this.formatMessage('ERROR', fullMessage));
        }
    }

    /**
     * Log request details (only in DEBUG mode)
     */
    public logRequest(method: string, path: string, body: any, headers?: any): void {
        if (this.currentLogLevel <= LogLevel.DEBUG) {
            const details = {
                method,
                path,
                body: this.sanitizeForLog(body),
                headers: headers ? this.sanitizeHeaders(headers) : undefined
            };
            this.outputChannel.appendLine(
                this.formatMessage('DEBUG', `Request:\n${JSON.stringify(details, null, 2)}`)
            );
        }
    }

    /**
     * Log response details (only in DEBUG mode)
     */
    public logResponse(statusCode: number, body: any): void {
        if (this.currentLogLevel <= LogLevel.DEBUG) {
            const details = {
                statusCode,
                body: this.sanitizeForLog(body)
            };
            this.outputChannel.appendLine(
                this.formatMessage('DEBUG', `Response:\n${JSON.stringify(details, null, 2)}`)
            );
        }
    }

    /**
     * Log API error with full context
     */
    public logApiError(context: {
        operation: string;
        model?: string;
        requestBody?: any;
        error: Error | any;
        additionalInfo?: any;
    }): void {
        let fullMessage = `API Error in ${context.operation}`;
        
        if (context.model) {
            fullMessage += `\n  Model: ${context.model}`;
        }
        
        if (context.requestBody) {
            fullMessage += `\n  Request Body: ${JSON.stringify(this.sanitizeForLog(context.requestBody), null, 2)}`;
        }
        
        if (context.error) {
            if (context.error instanceof Error) {
                fullMessage += `\n  Error: ${context.error.message}`;
                fullMessage += `\n  Stack: ${context.error.stack}`;
            } else {
                fullMessage += `\n  Error: ${JSON.stringify(context.error, null, 2)}`;
            }
        }
        
        if (context.additionalInfo) {
            fullMessage += `\n  Additional Info: ${JSON.stringify(context.additionalInfo, null, 2)}`;
        }
        
        this.outputChannel.appendLine(this.formatMessage('ERROR', fullMessage));
    }

    /**
     * Sanitize data for logging (truncate long strings, hide sensitive data)
     */
    private sanitizeForLog(data: any, maxLength: number = 1000): any {
        if (data === null || data === undefined) {
            return data;
        }

        if (typeof data === 'string') {
            return data.length > maxLength 
                ? data.substring(0, maxLength) + `... (${data.length - maxLength} more chars)`
                : data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeForLog(item, maxLength));
        }

        if (typeof data === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(data)) {
                // Hide potential sensitive fields
                if (key.toLowerCase().includes('token') || 
                    key.toLowerCase().includes('key') || 
                    key.toLowerCase().includes('secret')) {
                    sanitized[key] = '***REDACTED***';
                } else {
                    sanitized[key] = this.sanitizeForLog(value, maxLength);
                }
            }
            return sanitized;
        }

        return data;
    }

    /**
     * Sanitize headers for logging
     */
    private sanitizeHeaders(headers: any): any {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase().includes('auth') || 
                key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('key')) {
                sanitized[key] = '***REDACTED***';
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    /**
     * Show output channel
     */
    public show(preserveFocus: boolean = false): void {
        this.outputChannel.show(preserveFocus);
    }

    /**
     * Clear output channel
     */
    public clear(): void {
        this.outputChannel.clear();
    }

    /**
     * Update log level
     */
    public setLogLevel(level: LogLevel): void {
        this.currentLogLevel = level;
        this.info(`Log level changed to: ${LogLevel[level]}`);
    }

    /**
     * Get current log level
     */
    public getLogLevel(): LogLevel {
        return this.currentLogLevel;
    }
}

// Singleton logger instance
export const logger = new Logger();
