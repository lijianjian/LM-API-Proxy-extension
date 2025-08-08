import express from 'express';
import cors from 'cors';
import * as vscode from 'vscode';
import { Server } from 'http';

export interface ChatCompletionRequest {
    model?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        name?: string;
    }>;
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
}

export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class LmApiProxyServer {
    private server: Server | undefined;
    private app: express.Express;
    private port: number;

    constructor(port: number = 3000) {
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        // Enable CORS if configured
        const config = vscode.workspace.getConfiguration('lmApiProxy');
        if (config.get('allowCors', true)) {
            this.app.use(cors({
                origin: '*',
                methods: ['GET', 'POST', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization']
            }));
        }

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`[LM API Proxy] ${req.method} ${req.path}`);
            next();
        });

        // Global error handler
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('[LM API Proxy] Unhandled error:', err);
            res.status(500).json({
                error: {
                    message: 'Internal server error',
                    type: 'api_error'
                }
            });
        });
    }

    private setupRoutes() {
        // Root endpoint with API information
        this.app.get('/', (req, res) => {
            res.json({
                name: 'VS Code LM API Proxy',
                version: '0.0.1',
                endpoints: {
                    health: '/health',
                    models: '/v1/models',
                    chat: '/v1/chat/completions'
                },
                documentation: 'See README.md for usage examples'
            });
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // List available models
        this.app.get('/v1/models', async (req, res) => {
            try {
                const models = await vscode.lm.selectChatModels({});
                const response = {
                    object: 'list',
                    data: models.map(model => ({
                        id: model.id,
                        object: 'model',
                        name: model.name,
                        vendor: model.vendor,
                        family: model.family,
                        version: model.version,
                        max_input_tokens: model.maxInputTokens
                    }))
                };
                res.json(response);
            } catch (error) {
                console.error('[LM API Proxy] Error listing models:', error);
                res.status(500).json({ 
                    error: {
                        message: 'Failed to list models',
                        type: 'api_error'
                    }
                });
            }
        });

        // Chat completions endpoint
        this.app.post('/v1/chat/completions', async (req, res) => {
            try {
                const requestBody: ChatCompletionRequest = req.body;
                
                // Debug: 打印请求体用于调试
                console.log('[LM API Proxy] Received request body:');
                console.log(JSON.stringify(requestBody, null, 2));
                
                if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
                    return res.status(400).json({
                        error: {
                            message: 'Missing or invalid messages array',
                            type: 'invalid_request_error'
                        }
                    });
                }

                // Select model
                let models: vscode.LanguageModelChat[];
                if (requestBody.model) {
                    // Try to find specific model
                    models = await vscode.lm.selectChatModels({
                        vendor: 'copilot',
                        id: requestBody.model
                    });
                    
                    if (models.length === 0) {
                        // Try by family
                        models = await vscode.lm.selectChatModels({
                            vendor: 'copilot',
                            family: requestBody.model
                        });
                    }
                } else {
                    // Use default Copilot model
                    models = await vscode.lm.selectChatModels({
                        vendor: 'copilot'
                    });
                }

                if (models.length === 0) {
                    return res.status(404).json({
                        error: {
                            message: 'No available models found',
                            type: 'model_not_found'
                        }
                    });
                }

                const model = models[0];

                // Convert messages to VS Code format
                const vsCodeMessages: vscode.LanguageModelChatMessage[] = [];
                
                for (const msg of requestBody.messages) {
                    // Validate message content
                    if (!msg.content || typeof msg.content !== 'string') {
                        return res.status(400).json({
                            error: {
                                message: 'Message content must be a non-empty string',
                                type: 'invalid_request_error'
                            }
                        });
                    }

                    try {
                        switch (msg.role) {
                            case 'user':
                                vsCodeMessages.push(vscode.LanguageModelChatMessage.User(
                                    msg.content, 
                                    msg.name || undefined
                                ));
                                break;
                            case 'assistant':
                                vsCodeMessages.push(vscode.LanguageModelChatMessage.Assistant(
                                    msg.content, 
                                    msg.name || undefined
                                ));
                                break;
                            case 'system':
                                // System messages are typically handled as user messages in VS Code LM API
                                vsCodeMessages.push(vscode.LanguageModelChatMessage.User(
                                    `System: ${msg.content}`,
                                    undefined
                                ));
                                break;
                            default:
                                // Skip unknown roles or add as user message
                                vsCodeMessages.push(vscode.LanguageModelChatMessage.User(
                                    msg.content, 
                                    msg.name || undefined
                                ));
                                break;
                        }
                    } catch (msgError) {
                        console.error('[LM API Proxy] Error creating message:', msgError);
                        return res.status(400).json({
                            error: {
                                message: 'Failed to create chat message',
                                type: 'invalid_request_error'
                            }
                        });
                    }
                }

                // Ensure we have at least one message
                if (vsCodeMessages.length === 0) {
                    return res.status(400).json({
                        error: {
                            message: 'At least one valid message is required',
                            type: 'invalid_request_error'
                        }
                    });
                }

                // Prepare request options
                const options: vscode.LanguageModelChatRequestOptions = {};
                if (requestBody.max_tokens) {
                    // Note: VS Code LM API may not support all OpenAI parameters
                    // We'll include what we can
                }

                // Handle streaming
                if (requestBody.stream) {
                    return this.handleStreamingRequest(model, vsCodeMessages, options, res);
                } else {
                    return this.handleNonStreamingRequest(model, vsCodeMessages, options, res);
                }

            } catch (error) {
                console.error('[LM API Proxy] Error in chat completion:', error);
                
                if (error instanceof vscode.LanguageModelError) {
                    let statusCode = 500;
                    let errorType = 'api_error';
                    
                    // Check error using the error name/code pattern
                    if (error.name === 'Blocked' || error.message.includes('blocked')) {
                        statusCode = 400;
                        errorType = 'content_filter';
                    } else if (error.name === 'NoPermissions' || error.message.includes('permission')) {
                        statusCode = 403;
                        errorType = 'insufficient_quota';
                    } else if (error.name === 'NotFound' || error.message.includes('not found')) {
                        statusCode = 404;
                        errorType = 'model_not_found';
                    }
                    
                    return res.status(statusCode).json({
                        error: {
                            message: error.message,
                            type: errorType
                        }
                    });
                }

                res.status(500).json({
                    error: {
                        message: 'Internal server error',
                        type: 'api_error'
                    }
                });
            }
        });
    }

    private async handleNonStreamingRequest(
        model: vscode.LanguageModelChat,
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        res: express.Response
    ) {
        try {
            console.log(`[LM API Proxy] Sending request to model: ${model.id}`);
            console.log(`[LM API Proxy] Messages count: ${messages.length}`);
            
            // Validate inputs
            if (!messages || messages.length === 0) {
                throw new Error('No messages provided');
            }

            const response = await model.sendRequest(messages, options);
            let content = '';
            
            for await (const fragment of response.text) {
                content += fragment;
            }

            console.log(`[LM API Proxy] Response received, length: ${content.length}`);

            const chatResponse: ChatCompletionResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: model.id,
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: content.trim()
                    },
                    finish_reason: 'stop'
                }],
                usage: {
                    prompt_tokens: 0, // VS Code LM API doesn't provide token counts
                    completion_tokens: 0,
                    total_tokens: 0
                }
            };

            res.json(chatResponse);
        } catch (error) {
            console.error('[LM API Proxy] Error in handleNonStreamingRequest:', error);
            throw error; // Re-throw to be handled by the main catch block
        }
    }

    private async handleStreamingRequest(
        model: vscode.LanguageModelChat,
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        res: express.Response
    ) {
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        try {
            const response = await model.sendRequest(messages, options);
            
            for await (const fragment of response.text) {
                const streamChunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model.id,
                    choices: [{
                        index: 0,
                        delta: {
                            content: fragment
                        },
                        finish_reason: null
                    }]
                };

                res.write(`data: ${JSON.stringify(streamChunk)}\n\n`);
            }

            // Send final chunk
            const finalChunk = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model.id,
                choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                }]
            };

            res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();

        } catch (error) {
            console.error('[LM API Proxy] Streaming error:', error);
            res.write(`data: {"error": {"message": "Stream error", "type": "api_error"}}\n\n`);
            res.end();
        }
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, '0.0.0.0', () => {
                    console.log(`[LM API Proxy] Server started on http://0.0.0.0:${this.port}`);
                    console.log(`[LM API Proxy] Accessible from any network interface`);
                    resolve();
                });

                this.server.on('error', (error: any) => {
                    if (error.code === 'EADDRINUSE') {
                        reject(new Error(`Port ${this.port} is already in use`));
                    } else {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('[LM API Proxy] Server stopped');
                    this.server = undefined;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    public isRunning(): boolean {
        return this.server !== undefined;
    }

    public getPort(): number {
        return this.port;
    }

    public updatePort(newPort: number): void {
        this.port = newPort;
    }
}
