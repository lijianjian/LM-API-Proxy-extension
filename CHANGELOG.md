# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-01-15

### Added

- **Anthropic API Support**: Complete implementation of Anthropic Messages API format
  - New `/v1/messages` endpoint for Anthropic compatibility
  - Bidirectional conversion between Anthropic and VS Code LM API formats
  - Support for streaming with Server-Sent Events
  - Full error mapping to Anthropic error format
  - Support for Claude 3 and later models

- **Documentation**:
  - Comprehensive CONTRIBUTING.md with contribution guidelines
  - DEVELOPMENT.md with setup and architecture documentation
  - docs/TROUBLESHOOTING.md with FAQ and common solutions
  - docs/ANTHROPIC_API.md with Anthropic integration guide
  - Bilingual README.md (English and Chinese)
  - GitHub issue and PR templates

- **Project Structure**:
  - tests/ directory with organized test files
    - test_anthropic.py - Anthropic API test suite
    - test_comprehensive.py - OpenAI API test suite
    - README.md with testing guidelines
  - docs/ directory with comprehensive documentation
    - README.md - Documentation index
    - QUICK_REFERENCE.md - API quick reference
    - TEST_COMMANDS.md - Test command examples

- **Community Support**:
  - CODE_OF_CONDUCT.md for community standards
  - LICENSE file (MIT License)
  - Issue templates (bug reports, feature requests)
  - Pull request template with checklist
  - package.json with repository and author metadata

### Changed

- Updated server version to 0.0.3
- IP configuration updated to 10.14.0.187:3000
- Improved README with feature badges and structured sections
- Enhanced package.json with keywords and repository information

### Fixed

- TypeScript compilation issues in converter implementations
- Error handling improvements in async operations

### Tested

- ✅ All 5 Anthropic API tests passing
- ✅ All OpenAI API tests passing
- ✅ Manual integration testing completed
- ✅ Streaming functionality verified

## [0.0.2] - 2025-01-10

### Added

- **OpenAI API Support**: Chat completions endpoint
  - `/v1/chat/completions` endpoint
  - Stream and non-stream support
  - System prompt and multi-turn conversation support
  - Error handling and validation

- **Core Features**:
  - Language Model Manager for model selection
  - Logger utility with 4 log levels (DEBUG, INFO, WARN, ERROR)
  - VS Code extension commands for server control
  - Configuration settings for port and log level

## [0.0.1] - 2025-01-01

### Initial Release

- Basic VS Code extension structure
- HTTP proxy server foundation
- Express.js setup
- VS Code API integration

---

## Unreleased

### Planned

- [ ] Support for additional AI providers (Google Gemini, etc.)
- [ ] Caching layer for improved performance
- [ ] Rate limiting and quota management
- [ ] WebSocket support for real-time connections
- [ ] Database persistence for usage logs
- [ ] Dashboard UI for monitoring
- [ ] Docker containerization
- [ ] Kubernetes deployment guides
- [ ] CI/CD pipeline automation
- [ ] Performance benchmarking tools

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.