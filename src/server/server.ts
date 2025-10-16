// HTTP Server for VS Code Language Model API Proxy
import express from 'express';
import cors from 'cors';
import * as vscode from 'vscode';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { modelManager } from '../model/manager';
import {
    OpenAIChatCompletionRequest,
    convertOpenAIRequestToVSCodeRequest,
    convertVSCodeResponseToOpenAI,
    convertVSCodeStreamToOpenAI,
    generateRequestId,
    handleVSCodeError,
} from '../converter/openaiConverter';

/**
 * LM API Proxy Server
 */
export class LmApiProxyServer {
    private server: Server | undefined;
    private app: express.Express;
    private port: number;

    constructor(port: number = 3000) {
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        logger.info('LM API Proxy Server initialized');
    }

    /**
     * Setup Express middleware
     */
    private setupMiddleware(): void {
        // Enable CORS if configured
        const config = vscode.workspace.getConfiguration('lmApiProxy');
        if (config.get('allowCors', true)) {
            this.app.use(
                cors({
                    origin: '*',
                    methods: ['GET', 'POST', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                })
            );
            logger.info('CORS enabled for all origins');
        }

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path}`, {
                headers: req.headers,
                body: req.body,
            });
            next();
        });

        // Global error handler
        this.app.use(
            (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
                logger.error('Unhandled error in Express', err);
                res.status(500).json({
                    error: {
                        message: 'Internal server error',
                        type: 'api_error',
                    },
                });
            }
        );
    }

    /**
     * Setup API routes
     */
    private setupRoutes(): void {
        // Root endpoint - API information
        this.app.get('/', (req, res) => {
            res.json({
                name: 'VS Code LM API Proxy',
                version: '0.0.2',
                description: 'OpenAI-compatible proxy for VS Code Language Model API',
                endpoints: {
                    health: '/health',
                    models: '/v1/models',
                    chat: '/v1/chat/completions',
                },
                documentation: 'https://github.com/lijianjian/LM-API-Proxy-extension',
            });
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '0.0.2',
            });
        });

        // List available models endpoint
        this.app.get('/v1/models', async (req, res) => {
            try {
                logger.info('Listing available models');
                const models = await modelManager.getAvailableModels();

                const response = {
                    object: 'list',
                    data: models.map((model) => ({
                        id: model.id,
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: model.vendor || 'vscode',
                        name: model.name,
                        vendor: model.vendor,
                        family: model.family,
                        version: model.version,
                        max_input_tokens: model.maxInputTokens,
                    })),
                };

                logger.info(`Found ${models.length} available models`);
                res.json(response);
            } catch (error) {
                logger.error('Failed to list models', error as Error);
                res.status(500).json({
                    error: {
                        message: 'Failed to list models',
                        type: 'api_error',
                    },
                });
            }
        });

        // Chat completions endpoint (OpenAI compatible)
        this.app.post('/v1/chat/completions', async (req, res) => {
            const requestId = generateRequestId();
            logger.info(`Chat completion request started: ${requestId}`);

            try {
                const requestBody: OpenAIChatCompletionRequest = req.body;

                logger.debug('Request body', requestBody);

                // Validate request
                if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
                    logger.warn('Invalid request: missing messages array');
                    return res.status(400).json({
                        error: {
                            message: 'Missing or invalid messages array',
                            type: 'invalid_request_error',
                        },
                    });
                }

                if (requestBody.messages.length === 0) {
                    logger.warn('Invalid request: empty messages array');
                    return res.status(400).json({
                        error: {
                            message: 'Messages array must not be empty',
                            type: 'invalid_request_error',
                        },
                    });
                }

                // Get model
                let model: vscode.LanguageModelChat;

                if (requestBody.model) {
                    logger.info(`Requesting specific model: ${requestBody.model}`);

                    // Try to find by ID first
                    const modelById = await modelManager.getModelById(requestBody.model);
                    if (modelById) {
                        model = modelById;
                    } else {
                        // Try by vendor/family
                        const modelByVendor = await modelManager.getModelByVendorFamily(
                            'copilot',
                            requestBody.model
                        );
                        if (modelByVendor) {
                            model = modelByVendor;
                        } else {
                            logger.warn(`Model not found: ${requestBody.model}`);
                            return res.status(404).json({
                                error: {
                                    message: `Model not found: ${requestBody.model}`,
                                    type: 'model_not_found',
                                },
                            });
                        }
                    }
                } else {
                    // Use default model
                    logger.info('Using default model');
                    model = await modelManager.getDefaultModel();
                }

                logger.info(`Using model: ${model.id}`);

                // Convert request
                const { messages, options } = await convertOpenAIRequestToVSCodeRequest(
                    requestBody,
                    model
                );

                logger.debug(`Converted ${messages.length} messages`);

                // Handle streaming vs non-streaming
                if (requestBody.stream) {
                    logger.info('Handling streaming request');
                    await this.handleStreamingRequest(
                        model,
                        messages,
                        options,
                        requestId,
                        res
                    );
                } else {
                    logger.info('Handling non-streaming request');
                    await this.handleNonStreamingRequest(
                        model,
                        messages,
                        options,
                        requestId,
                        res
                    );
                }

                logger.info(`Chat completion request completed: ${requestId}`);
            } catch (error) {
                logger.error(`Chat completion request failed: ${requestId}`, error as Error);

                if (error instanceof vscode.LanguageModelError) {
                    const { statusCode, errorResponse } = handleVSCodeError(error);
                    return res.status(statusCode).json(errorResponse);
                }

                res.status(500).json({
                    error: {
                        message: error instanceof Error ? error.message : 'Internal server error',
                        type: 'api_error',
                    },
                });
            }
        });
    }

    /**
     * Handle non-streaming chat completion request
     */
    private async handleNonStreamingRequest(
        model: vscode.LanguageModelChat,
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        requestId: string,
        res: express.Response
    ): Promise<void> {
        try {
            logger.debug('Sending request to VS Code LM API');

            const response = await model.sendRequest(messages, options);
            const openAIResponse = await convertVSCodeResponseToOpenAI(
                response,
                model,
                requestId
            );

            logger.debug('Sending response to client', {
                contentLength: openAIResponse.choices[0].message.content.length,
            });

            res.json(openAIResponse);
        } catch (error) {
            logger.error('Error in non-streaming request', error as Error);
            throw error;
        }
    }

    /**
     * Handle streaming chat completion request
     */
    private async handleStreamingRequest(
        model: vscode.LanguageModelChat,
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        requestId: string,
        res: express.Response
    ): Promise<void> {
        try {
            logger.debug('Setting up streaming response');

            // Set headers for SSE (Server-Sent Events)
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no', // Disable nginx buffering
            });

            const response = await model.sendRequest(messages, options);
            const stream = convertVSCodeStreamToOpenAI(response, model, requestId);

            for await (const chunk of stream) {
                const data = JSON.stringify(chunk);
                res.write(`data: ${data}\n\n`);
                logger.debug('Sent chunk', { chunkSize: data.length });
            }

            res.write('data: [DONE]\n\n');
            res.end();

            logger.debug('Streaming completed');
        } catch (error) {
            logger.error('Error in streaming request', error as Error);

            // Send error in SSE format
            const errorData = JSON.stringify({
                error: {
                    message: error instanceof Error ? error.message : 'Stream error',
                    type: 'api_error',
                },
            });
            res.write(`data: ${errorData}\n\n`);
            res.end();
        }
    }

    /**
     * Start the server
     */
    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, '0.0.0.0', () => {
                    logger.info(`Server started on http://0.0.0.0:${this.port}`);
                    logger.info('Accessible from any network interface');
                    resolve();
                });

                this.server.on('error', (error: any) => {
                    if (error.code === 'EADDRINUSE') {
                        logger.error(`Port ${this.port} is already in use`);
                        reject(new Error(`Port ${this.port} is already in use`));
                    } else {
                        logger.error('Server error', error);
                        reject(error);
                    }
                });
            } catch (error) {
                logger.error('Failed to start server', error as Error);
                reject(error);
            }
        });
    }

    /**
     * Stop the server
     */
    public async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('Server stopped');
                    this.server = undefined;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Check if server is running
     */
    public isRunning(): boolean {
        return this.server !== undefined;
    }

    /**
     * Get server port
     */
    public getPort(): number {
        return this.port;
    }

    /**
     * Update server port (requires restart)
     */
    public updatePort(newPort: number): void {
        this.port = newPort;
        logger.info(`Port updated to ${newPort} (restart required)`);
    }
}
