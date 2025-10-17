// Anthropic API format converter for VS Code Language Model API
import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * Anthropic Messages API Request format
 * https://docs.anthropic.com/claude/reference/messages_post
 */
export interface AnthropicMessagesRequest {
    model: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string | Array<{
            type: 'text' | 'image';
            text?: string;
            source?: any;
        }>;
    }>;
    max_tokens: number;
    metadata?: {
        user_id?: string;
    };
    stop_sequences?: string[];
    stream?: boolean;
    system?: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
}

/**
 * Anthropic Messages API Response format
 */
export interface AnthropicMessagesResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
        type: 'text';
        text: string;
    }>;
    model: string;
    stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
    stop_sequence?: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

/**
 * Anthropic Stream Event types
 */
export type AnthropicStreamEvent =
    | {
          type: 'message_start';
          message: Partial<AnthropicMessagesResponse>;
      }
    | {
          type: 'content_block_start';
          index: number;
          content_block: {
              type: 'text';
              text: string;
          };
      }
    | {
          type: 'content_block_delta';
          index: number;
          delta: {
              type: 'text_delta';
              text: string;
          };
      }
    | {
          type: 'content_block_stop';
          index: number;
      }
    | {
          type: 'message_delta';
          delta: {
              stop_reason: string;
              stop_sequence?: string | null;
          };
          usage: {
              output_tokens: number;
          };
      }
    | {
          type: 'message_stop';
      }
    | {
          type: 'ping';
      };

/**
 * Convert Anthropic request to VS Code LM API format
 */
export async function convertAnthropicRequestToVSCodeRequest(
    request: AnthropicMessagesRequest,
    model: vscode.LanguageModelChat
): Promise<{
    messages: vscode.LanguageModelChatMessage[];
    options: vscode.LanguageModelChatRequestOptions;
}> {
    logger.debug('Converting Anthropic request to VS Code format', { request });

    // Validate messages
    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
    }

    // Validate max_tokens (required for Anthropic API)
    if (!request.max_tokens || request.max_tokens <= 0) {
        throw new Error('max_tokens is required and must be greater than 0');
    }

    // Convert messages
    const vsCodeMessages: vscode.LanguageModelChatMessage[] = [];

    // Add system message if present
    if (request.system) {
        vsCodeMessages.push(vscode.LanguageModelChatMessage.User(request.system));
    }

    for (const msg of request.messages) {
        // Extract text content
        let content: string;
        if (typeof msg.content === 'string') {
            content = msg.content;
        } else if (Array.isArray(msg.content)) {
            // Extract text from content blocks
            const textBlocks = msg.content.filter((block) => block.type === 'text' && block.text);
            content = textBlocks.map((block) => block.text).join('\n');
        } else {
            throw new Error('Message content must be a string or array');
        }

        if (!content) {
            throw new Error('Message content must not be empty');
        }

        switch (msg.role) {
            case 'user':
                vsCodeMessages.push(vscode.LanguageModelChatMessage.User(content));
                break;

            case 'assistant':
                vsCodeMessages.push(vscode.LanguageModelChatMessage.Assistant(content));
                break;

            default:
                logger.warn(`Unknown message role: ${msg.role}, treating as user`);
                vsCodeMessages.push(vscode.LanguageModelChatMessage.User(content));
        }
    }

    // Build options
    const options: vscode.LanguageModelChatRequestOptions = {};

    // Note: VS Code LM API doesn't support all Anthropic parameters
    // Temperature, top_p, top_k are handled internally by the model
    if (request.temperature !== undefined) {
        logger.debug(`temperature requested: ${request.temperature} (may not be fully supported)`);
    }

    if (request.top_p !== undefined) {
        logger.debug(`top_p requested: ${request.top_p} (may not be fully supported)`);
    }

    logger.debug('Converted to VS Code format', {
        messageCount: vsCodeMessages.length,
        options,
    });

    return { messages: vsCodeMessages, options };
}

/**
 * Convert VS Code response to Anthropic format
 */
export async function convertVSCodeResponseToAnthropic(
    vsCodeResponse: vscode.LanguageModelChatResponse,
    requestId: string,
    modelId: string
): Promise<AnthropicMessagesResponse> {
    let fullText = '';

    // Collect all text fragments asynchronously
    for await (const fragment of vsCodeResponse.text) {
        fullText += fragment;
    }

    logger.debug('Converting VS Code response to Anthropic format', {
        requestId,
        modelId,
        textLength: fullText.length,
    });

    return {
        id: requestId,
        type: 'message',
        role: 'assistant',
        content: [
            {
                type: 'text',
                text: fullText,
            },
        ],
        model: modelId,
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
            input_tokens: 0, // VS Code API doesn't provide this
            output_tokens: 0, // VS Code API doesn't provide this
        },
    };
}

/**
 * Convert VS Code streaming response to Anthropic SSE format
 */
export async function* convertVSCodeStreamToAnthropic(
    vsCodeResponse: vscode.LanguageModelChatResponse,
    requestId: string,
    modelId: string
): AsyncGenerator<string> {
    logger.debug('Starting Anthropic stream conversion', { requestId, modelId });

    let isFirstChunk = true;
    let contentBlockStarted = false;

    try {
        // Send message_start event
        const messageStart: AnthropicStreamEvent = {
            type: 'message_start',
            message: {
                id: requestId,
                type: 'message',
                role: 'assistant',
                model: modelId,
                usage: {
                    input_tokens: 0,
                    output_tokens: 0,
                },
            },
        };
        yield `event: message_start\ndata: ${JSON.stringify(messageStart)}\n\n`;

        // Send content_block_start event
        const blockStart: AnthropicStreamEvent = {
            type: 'content_block_start',
            index: 0,
            content_block: {
                type: 'text',
                text: '',
            },
        };
        yield `event: content_block_start\ndata: ${JSON.stringify(blockStart)}\n\n`;
        contentBlockStarted = true;

        // Stream text deltas
        for await (const fragment of vsCodeResponse.text) {
            const delta: AnthropicStreamEvent = {
                type: 'content_block_delta',
                index: 0,
                delta: {
                    type: 'text_delta',
                    text: fragment,
                },
            };
            yield `event: content_block_delta\ndata: ${JSON.stringify(delta)}\n\n`;
            isFirstChunk = false;
        }

        // Send content_block_stop event
        const blockStop: AnthropicStreamEvent = {
            type: 'content_block_stop',
            index: 0,
        };
        yield `event: content_block_stop\ndata: ${JSON.stringify(blockStop)}\n\n`;

        // Send message_delta event
        const messageDelta: AnthropicStreamEvent = {
            type: 'message_delta',
            delta: {
                stop_reason: 'end_turn',
                stop_sequence: null,
            },
            usage: {
                output_tokens: 0,
            },
        };
        yield `event: message_delta\ndata: ${JSON.stringify(messageDelta)}\n\n`;

        // Send message_stop event
        const messageStop: AnthropicStreamEvent = {
            type: 'message_stop',
        };
        yield `event: message_stop\ndata: ${JSON.stringify(messageStop)}\n\n`;

        logger.debug('Anthropic stream conversion completed', { requestId });
    } catch (error: any) {
        logger.error('Error in Anthropic stream conversion', error);
        throw error;
    }
}

/**
 * Generate a unique request ID for Anthropic format
 */
export function generateAnthropicRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `msg_${timestamp}_${random}`;
}

/**
 * Handle VS Code API errors and convert to Anthropic error format
 */
export function handleVSCodeErrorForAnthropic(error: any): {
    status: number;
    body: {
        type: 'error';
        error: {
            type: string;
            message: string;
        };
    };
} {
    logger.error('VS Code API error (Anthropic format)', error);

    let status = 500;
    let errorType = 'api_error';
    let message = 'Internal server error';

    if (error instanceof vscode.LanguageModelError) {
        switch (error.name) {
            case 'NotFound':
                status = 404;
                errorType = 'not_found_error';
                message = 'Model not found';
                break;

            case 'NoPermissions':
                status = 403;
                errorType = 'permission_error';
                message = 'No permissions to access the language model';
                break;

            case 'Blocked':
                status = 400;
                errorType = 'invalid_request_error';
                message = 'Request was blocked by content filtering';
                break;

            default:
                message = error.message || 'Language model error';
        }
    } else if (error.message) {
        status = 400;
        errorType = 'invalid_request_error';
        message = error.message;
    }

    return {
        status,
        body: {
            type: 'error',
            error: {
                type: errorType,
                message,
            },
        },
    };
}
