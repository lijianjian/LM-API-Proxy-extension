// Model Manager for VS Code Language Model API
import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * Model information structure
 */
export interface ModelInfo {
    id: string;
    name: string;
    vendor: string;
    family: string;
    version?: string;
    maxInputTokens?: number;
}

/**
 * Model Manager class
 */
export class ModelManager {
    private selectedModelId: string | null = null;
    private globalState: vscode.Memento | undefined;

    /**
     * Initialize model manager with global state
     */
    public initialize(globalState: vscode.Memento): void {
        this.globalState = globalState;
        // Load saved model selection
        this.selectedModelId = globalState.get<string>('selectedModelId') || null;
        logger.info(`ModelManager initialized with model: ${this.selectedModelId || 'default'}`);
    }

    /**
     * Get all available models
     */
    public async getAvailableModels(): Promise<ModelInfo[]> {
        try {
            const models = await vscode.lm.selectChatModels({});
            
            const modelInfos: ModelInfo[] = models.map(model => ({
                id: model.id,
                name: model.name,
                vendor: model.vendor,
                family: model.family,
                version: model.version,
                maxInputTokens: model.maxInputTokens,
            }));

            logger.debug('Available models:', modelInfos);
            return modelInfos;
        } catch (error) {
            logger.error('Failed to get available models', error as Error);
            throw error;
        }
    }

    /**
     * Get specific model by ID
     */
    public async getModelById(modelId: string): Promise<vscode.LanguageModelChat | null> {
        try {
            const models = await vscode.lm.selectChatModels({ id: modelId });
            
            if (models.length === 0) {
                logger.warn(`Model not found: ${modelId}`);
                return null;
            }

            logger.debug(`Found model: ${modelId}`);
            return models[0];
        } catch (error) {
            logger.error(`Failed to get model: ${modelId}`, error as Error);
            return null;
        }
    }

    /**
     * Get model by vendor and family
     */
    public async getModelByVendorFamily(vendor: string, family?: string): Promise<vscode.LanguageModelChat | null> {
        try {
            const selector: any = { vendor };
            if (family) {
                selector.family = family;
            }

            const models = await vscode.lm.selectChatModels(selector);
            
            if (models.length === 0) {
                logger.warn(`Model not found for vendor: ${vendor}, family: ${family}`);
                return null;
            }

            logger.debug(`Found model: ${models[0].id}`);
            return models[0];
        } catch (error) {
            logger.error(`Failed to get model for vendor: ${vendor}`, error as Error);
            return null;
        }
    }

    /**
     * Get default or selected model
     */
    public async getDefaultModel(): Promise<vscode.LanguageModelChat> {
        try {
            // If user has selected a model, try to use it
            if (this.selectedModelId) {
                const model = await this.getModelById(this.selectedModelId);
                if (model) {
                    return model;
                }
            }

            // Otherwise, use default Copilot model
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            
            if (models.length === 0) {
                throw new Error('No language models available. Please ensure GitHub Copilot is enabled.');
            }

            logger.info(`Using default model: ${models[0].id}`);
            return models[0];
        } catch (error) {
            logger.error('Failed to get default model', error as Error);
            throw error;
        }
    }

    /**
     * Select and save model preference
     */
    public async selectModel(): Promise<void> {
        try {
            const models = await this.getAvailableModels();
            
            if (models.length === 0) {
                vscode.window.showWarningMessage('No language models available');
                return;
            }

            const items = models.map(model => ({
                label: model.name,
                description: `${model.vendor} - ${model.family}`,
                detail: model.id,
                modelId: model.id,
            }));

            // Add default option
            items.unshift({
                label: 'Default (Auto-select)',
                description: 'Use default Copilot model',
                detail: 'auto',
                modelId: '',
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a language model',
                title: 'LM API Proxy - Model Selection',
            });

            if (selected) {
                if (selected.modelId === '') {
                    this.selectedModelId = null;
                    await this.globalState?.update('selectedModelId', null);
                    vscode.window.showInformationMessage('Using default model selection');
                    logger.info('Model selection cleared, using default');
                } else {
                    this.selectedModelId = selected.modelId;
                    await this.globalState?.update('selectedModelId', selected.modelId);
                    vscode.window.showInformationMessage(`Selected model: ${selected.label}`);
                    logger.info(`Model selected: ${selected.label} (${selected.modelId})`);
                }
            }
        } catch (error) {
            logger.error('Failed to select model', error as Error);
            vscode.window.showErrorMessage('Failed to select model');
        }
    }

    /**
     * Get currently selected model ID
     */
    public getSelectedModelId(): string | null {
        return this.selectedModelId;
    }

    /**
     * Count tokens for text (approximation)
     */
    public async countTokens(model: vscode.LanguageModelChat, text: string): Promise<number> {
        try {
            const tokenCount = await model.countTokens(text);
            return tokenCount;
        } catch (error) {
            logger.warn('Failed to count tokens, using approximation', error);
            // Rough approximation: 1 token ≈ 4 characters
            return Math.ceil(text.length / 4);
        }
    }
}

// Singleton instance
export const modelManager = new ModelManager();
