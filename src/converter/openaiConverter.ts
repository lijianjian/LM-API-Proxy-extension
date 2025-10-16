// OpenAI API format converter for VS Code Language Model API
import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * OpenAI Chat Completion Request format
 */
export interface OpenAIChatCompletionRequest {
    model?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        name?: string;
    }>;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
}

/**
 * OpenAI Chat Completion Response format
 */
export interface OpenAIChatCompletionResponse {
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
        finish_reason: string | null;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * OpenAI Chat Completion Stream Chunk format
 */
export interface OpenAIChatCompletionChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: 'assistant';
            content?: string;
        };
        finish_reason: string | null;
    }>;
}

/**
 * Convert OpenAI request to VS Code LM API format
 */
export async function convertOpenAIRequestToVSCodeRequest(
    request: OpenAIChatCompletionRequest,
    model: vscode.LanguageModelChat
): Promise<{
    messages: vscode.LanguageModelChatMessage[];
    options: vscode.LanguageModelChatRequestOptions;
}> {
    logger.debug('Converting OpenAI request to VS Code format', { request });

    // Validate messages
    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
    }

    // Convert messages
    const vsCodeMessages: vscode.LanguageModelChatMessage[] = [];

    for (const msg of request.messages) {
        if (!msg.content || typeof msg.content !== 'string') {
            throw new Error('Message content must be a non-empty string');
        }

        switch (msg.role) {
            case 'user':
                vsCodeMessages.push(
                    vscode.LanguageModelChatMessage.User(msg.content, msg.name)
                );
                break;

            case 'assistant':
                vsCodeMessages.push(
                    vscode.LanguageModelChatMessage.Assistant(msg.content, msg.name)
                );
                break;

            case 'system':
                // VS Code LM API doesn't have dedicated system messages
                // Convert to user message with "System:" prefix
                vsCodeMessages.push(
                    vscode.LanguageModelChatMessage.User(`System: ${msg.content}`)
                );
                break;

            default:
                logger.warn(`Unknown message role: ${msg.role}, treating as user`);
                vsCodeMessages.push(
                    vscode.LanguageModelChatMessage.User(msg.content, msg.name)
                );
                break;
        }
    }

    // Convert options
    const options: vscode.LanguageModelChatRequestOptions = {};

    // Note: VS Code LM API doesn't support all OpenAI parameters
    // We can only pass what the API supports
    if (request.max_tokens) {
        // VS Code LM API doesn't have direct max_tokens support in options
        // This is handled internally by the model
        logger.debug(`max_tokens requested: ${request.max_tokens} (may not be fully supported)`);
    }

    logger.debug('Converted to VS Code format', {
        messageCount: vsCodeMessages.length,
        options,
    });

    return { messages: vsCodeMessages, options };
}

/**
 * Convert VS Code LM API response to OpenAI format (non-streaming)
 */
export async function convertVSCodeResponseToOpenAI(
    response: vscode.LanguageModelChatResponse,
    model: vscode.LanguageModelChat,
    requestId: string
): Promise<OpenAIChatCompletionResponse> {
    logger.debug('Converting VS Code response to OpenAI format');

    // Collect all text fragments
    let content = '';
    for await (const fragment of response.text) {
        content += fragment;
    }

    const now = Math.floor(Date.now() / 1000);

    const openAIResponse: OpenAIChatCompletionResponse = {
        id: requestId,
        object: 'chat.completion',
        created: now,
        model: model.id,
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: content.trim(),
                },
                finish_reason: 'stop',
            },
        ],
        usage: {
            prompt_tokens: 0, // VS Code LM API doesn't provide token counts
            completion_tokens: 0,
            total_tokens: 0,
        },
    };

    logger.debug('Converted to OpenAI format', {
        contentLength: content.length,
        model: model.id,
    });

    return openAIResponse;
}

/**
 * Convert VS Code LM API streaming response to OpenAI format
 */
export async function* convertVSCodeStreamToOpenAI(
    response: vscode.LanguageModelChatResponse,
    model: vscode.LanguageModelChat,
    requestId: string
): AsyncGenerator<OpenAIChatCompletionChunk> {
    logger.debug('Converting VS Code stream to OpenAI format');

    const now = Math.floor(Date.now() / 1000);
    let isFirstChunk = true;

    try {
        for await (const fragment of response.text) {
            const chunk: OpenAIChatCompletionChunk = {
                id: requestId,
                object: 'chat.completion.chunk',
                created: now,
                model: model.id,
                choices: [
                    {
                        index: 0,
                        delta: isFirstChunk
                            ? { role: 'assistant', content: fragment }
                            : { content: fragment },
                        finish_reason: null,
                    },
                ],
            };

            isFirstChunk = false;
            yield chunk;
        }

        // Send final chunk with finish_reason
        const finalChunk: OpenAIChatCompletionChunk = {
            id: requestId,
            object: 'chat.completion.chunk',
            created: now,
            model: model.id,
            choices: [
                {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                },
            ],
        };

        yield finalChunk;

        logger.debug('Stream conversion completed');
    } catch (error) {
        logger.error('Error in stream conversion', error as Error);
        throw error;
    }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
    return `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Handle VS Code Language Model errors and convert to OpenAI error format
 */
export function handleVSCodeError(error: vscode.LanguageModelError): {
    statusCode: number;
    errorResponse: {
        error: {
            message: string;
            type: string;
            code?: string;
        };
    };
} {
    logger.error('VS Code LM API error', error, {
        name: error.name,
        code: error.code,
        cause: error.cause,
    });

    let statusCode = 500;
    let errorType = 'api_error';
    let errorCode: string | undefined;

    switch (error.name) {
        case 'Blocked':
            statusCode = 400;
            errorType = 'content_filter';
            errorCode = 'content_filter';
            break;

        case 'NoPermissions':
            statusCode = 403;
            errorType = 'insufficient_quota';
            errorCode = 'insufficient_quota';
            break;

        case 'NotFound':
            statusCode = 404;
            errorType = 'model_not_found';
            errorCode = 'model_not_found';
            break;

        case 'InvalidMessageFormat':
        case 'InvalidModel':
            statusCode = 400;
            errorType = 'invalid_request_error';
            errorCode = 'invalid_request';
            break;

        case 'ChatQuotaExceeded':
            statusCode = 429;
            errorType = 'rate_limit_exceeded';
            errorCode = 'rate_limit_exceeded';
            break;

        default:
            // Check message for additional clues
            if (error.message.includes('blocked') || error.message.includes('content')) {
                statusCode = 400;
                errorType = 'content_filter';
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                statusCode = 403;
                errorType = 'insufficient_quota';
            } else if (error.message.includes('not found')) {
                statusCode = 404;
                errorType = 'model_not_found';
            }
            break;
    }

    return {
        statusCode,
        errorResponse: {
            error: {
                message: error.message || 'An unknown error occurred',
                type: errorType,
                code: errorCode,
            },
        },
    };
}
