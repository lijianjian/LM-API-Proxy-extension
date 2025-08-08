# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Overview

This VS Code extension wraps the VS Code Language Model API (LM API) as a local HTTP proxy server. The extension provides access to GitHub Copilot's backend models (gpt-4o, gpt-4o-mini, claude-3.5-sonnet, etc.) through a standardized HTTP API that other programs on the same machine can call.

## Key Features

- HTTP proxy server for VS Code Language Model API
- Support for multiple LM models available through GitHub Copilot
- RESTful API endpoints for chat completions
- Authentication and security for local access
- Configuration management for server settings

## Technical Stack

- TypeScript
- VS Code Extension API
- Express.js for HTTP server
- VS Code Language Model API (vscode.lm namespace)
