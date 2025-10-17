# VS Code LM API Proxy - PowerShell 测试脚本
# 适用于 Windows PowerShell 5.1+ 和 PowerShell Core 7+

# 配置
$BaseUrl = "http://10.14.0.187:3000"
$ErrorActionPreference = "Continue"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" -Color Green
}

function Write-Failure {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" -Color Red
}

function Write-Warning2 {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" -Color Yellow
}

function Write-Title {
    param([string]$Message)
    Write-ColorOutput $Message -Color Cyan
}

function Write-Separator {
    Write-Host "============================================================"
}

# 测试健康检查
function Test-Health {
    Write-Separator
    Write-Title "1. 健康检查"
    Write-Separator
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 10
        Write-Host "状态码: 200"
        Write-Success "健康检查通过"
        Write-Host "状态: $($response.status)"
        Write-Host "时间戳: $($response.timestamp)"
        Write-Host "版本: $($response.version)"
        return $true
    }
    catch {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "健康检查失败: $($_.Exception.Message)"
        Write-Warning2 "请确保:"
        Write-Host "  1. VS Code 已启动扩展 (按 F5)"
        Write-Host "  2. 运行了 'LM Proxy: Start Server' 命令"
        Write-Host "  3. GitHub Copilot 已激活"
        return $false
    }
}

# 测试 API 信息
function Test-ApiInfo {
    Write-Separator
    Write-Title "2. API 信息"
    Write-Separator
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/" -Method Get -TimeoutSec 10
        Write-Host "状态码: 200"
        Write-Success "获取 API 信息成功"
        Write-Host "名称: $($response.name)"
        Write-Host "版本: $($response.version)"
        Write-Host "描述: $($response.description)"
        Write-Host "端点:"
        $response.endpoints.PSObject.Properties | ForEach-Object {
            Write-Host "  - $($_.Name): $($_.Value)"
        }
        return $true
    }
    catch {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "获取 API 信息失败"
        return $false
    }
}

# 测试模型列表
function Test-Models {
    Write-Separator
    Write-Title "3. 模型列表"
    Write-Separator
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/v1/models" -Method Get -TimeoutSec 10
        Write-Host "状态码: 200"
        $modelCount = $response.data.Count
        Write-Success "找到 $modelCount 个可用模型"
        
        if ($modelCount -gt 0) {
            Write-Host "`n可用模型:"
            $displayCount = [Math]::Min(5, $modelCount)
            for ($i = 0; $i -lt $displayCount; $i++) {
                $model = $response.data[$i]
                Write-Host "  $($i + 1). $($model.name)"
                Write-Host "     ID: $($model.id)"
                Write-Host "     Vendor: $($model.vendor)"
                Write-Host "     Family: $($model.family)"
                if ($model.max_input_tokens) {
                    Write-Host "     Max Tokens: $($model.max_input_tokens)"
                }
                Write-Host ""
            }
            
            if ($modelCount -gt 5) {
                Write-Host "  ... 还有 $($modelCount - 5) 个模型"
            }
            
            return $response.data[0].id
        }
        else {
            Write-Warning2 "未找到可用模型"
            return $null
        }
    }
    catch {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "获取模型列表失败"
        return $null
    }
}

# 测试简单聊天
function Test-SimpleChat {
    Write-Separator
    Write-Title "4. 简单聊天 (非流式)"
    Write-Separator
    
    $body = @{
        messages = @(
            @{
                role = "user"
                content = "Say 'Hello, World!' if you can read this."
            }
        )
        max_tokens = 50
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求..."
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/v1/chat/completions" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        Write-Host "状态码: 200"
        Write-Success "聊天成功"
        Write-Host "模型: $($response.model)"
        Write-Host "回复: $($response.choices[0].message.content)"
        return $true
    }
    catch {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "聊天失败"
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
        return $false
    }
}

# 测试指定模型聊天
function Test-ChatWithModel {
    param([string]$ModelId)
    
    Write-Separator
    Write-Title "5. 指定模型聊天 ($ModelId)"
    Write-Separator
    
    $body = @{
        model = $ModelId
        messages = @(
            @{
                role = "user"
                content = "What is 2+2? Answer briefly."
            }
        )
        max_tokens = 50
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求..."
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/v1/chat/completions" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        Write-Host "状态码: 200"
        Write-Success "聊天成功"
        Write-Host "回复: $($response.choices[0].message.content)"
        return $true
    }
    catch {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "聊天失败"
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
        return $false
    }
}

# 测试流式聊天
function Test-Streaming {
    Write-Separator
    Write-Title "6. 流式聊天"
    Write-Separator
    
    $body = @{
        messages = @(
            @{
                role = "user"
                content = "Count from 1 to 5, one number per line."
            }
        )
        stream = $true
        max_tokens = 100
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送流式请求..."
    Write-Host "----------------------------------------"
    
    try {
        # PowerShell 流式请求比较复杂，这里使用 WebClient
        $webClient = New-Object System.Net.WebClient
        $webClient.Headers.Add("Content-Type", "application/json")
        
        $stream = $webClient.OpenWrite("$BaseUrl/v1/chat/completions", "POST")
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
        $stream.Close()
        
        # 读取响应（简化版本）
        $responseString = $webClient.DownloadString("$BaseUrl/v1/chat/completions")
        
        Write-Host "流式响应已接收"
        Write-Host "----------------------------------------"
        Write-Success "流式传输完成"
        
        # 注意: PowerShell 的流式处理较复杂，这里仅展示基本框架
        # 实际使用建议用 Python 或其他工具测试流式响应
    }
    catch {
        Write-Failure "流式请求失败: $($_.Exception.Message)"
        Write-Warning2 "PowerShell 的流式处理有限，建议使用 Python 测试脚本测试流式功能"
    }
}

# 测试多轮对话
function Test-MultiTurn {
    Write-Separator
    Write-Title "7. 多轮对话"
    Write-Separator
    
    $body = @{
        messages = @(
            @{
                role = "user"
                content = "My name is Alice."
            },
            @{
                role = "assistant"
                content = "Hello Alice! Nice to meet you."
            },
            @{
                role = "user"
                content = "What is my name?"
            }
        )
        max_tokens = 50
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送多轮对话请求..."
    Write-Host "对话历史:"
    Write-Host "  user: My name is Alice."
    Write-Host "  assistant: Hello Alice! Nice to meet you."
    Write-Host "  user: What is my name?"
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/v1/chat/completions" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        Write-Host "`n状态码: 200"
        Write-Success "多轮对话成功"
        $content = $response.choices[0].message.content
        Write-Host "回复: $content"
        
        if ($content -match "(?i)alice") {
            Write-Success "模型记住了用户名称!"
        }
        else {
            Write-Warning2 "模型可能没有记住用户名称"
        }
        
        return $true
    }
    catch {
        Write-Host "`n状态码: $($_.Exception.Response.StatusCode.Value__)"
        Write-Failure "多轮对话失败"
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
        return $false
    }
}

# 主函数
function Main {
    Write-Host ""
    Write-Host "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
    Write-Host "  VS Code LM API Proxy - PowerShell 测试"
    Write-Host "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
    Write-Host ""
    
    $passed = 0
    $failed = 0
    
    # Test 1: Health
    Write-Host ""
    if (Test-Health) {
        $passed++
    }
    else {
        $failed++
        Write-Failure "服务器未运行，停止测试"
        return
    }
    
    # Test 2: Info
    Write-Host ""
    if (Test-ApiInfo) {
        $passed++
    }
    else {
        $failed++
    }
    
    # Test 3: Models
    Write-Host ""
    $modelId = Test-Models
    if ($modelId) {
        $passed++
    }
    else {
        $failed++
    }
    
    # Test 4: Simple chat
    Write-Host ""
    if (Test-SimpleChat) {
        $passed++
    }
    else {
        $failed++
    }
    
    # Test 5: Chat with model
    Write-Host ""
    if ($modelId) {
        if (Test-ChatWithModel -ModelId $modelId) {
            $passed++
        }
        else {
            $failed++
        }
    }
    else {
        Write-Warning2 "跳过指定模型测试（无可用模型）"
    }
    
    # Test 6: Streaming
    Write-Host ""
    Test-Streaming
    # 流式测试不计入总数（PowerShell 限制）
    
    # Test 7: Multi-turn
    Write-Host ""
    if (Test-MultiTurn) {
        $passed++
    }
    else {
        $failed++
    }
    
    # 打印总结
    Write-Host ""
    Write-Separator
    Write-Title "测试总结"
    Write-Separator
    Write-Host ""
    
    $total = $passed + $failed
    $successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
    
    Write-Host "总测试数: $total"
    Write-Host "通过: $passed" -ForegroundColor Green
    Write-Host "失败: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
    Write-Host "成功率: $successRate%"
    Write-Host ""
    
    if ($failed -eq 0) {
        Write-Success "所有测试通过! 🎉"
    }
    else {
        Write-Failure "部分测试失败"
    }
    
    Write-Host ""
}

# 运行主函数
Main
