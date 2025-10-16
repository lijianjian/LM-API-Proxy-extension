#!/bin/bash
# VS Code LM API Proxy - Shell 测试脚本 (Bash)
# 适用于 Linux / macOS

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL="http://10.14.0.187:3000"

# 打印分隔线
print_separator() {
    echo "============================================================"
}

# 打印标题
print_title() {
    echo -e "${BLUE}$1${NC}"
}

# 打印成功
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 打印错误
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 测试健康检查
test_health() {
    print_separator
    print_title "1. 健康检查"
    print_separator
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_success "健康检查通过"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        print_error "健康检查失败"
        echo "$body"
        return 1
    fi
}

# 测试 API 信息
test_info() {
    print_separator
    print_title "2. API 信息"
    print_separator
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_success "获取 API 信息成功"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        print_error "获取 API 信息失败"
        echo "$body"
        return 1
    fi
}

# 测试模型列表
test_models() {
    print_separator
    print_title "3. 模型列表"
    print_separator
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/models" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        model_count=$(echo "$body" | jq '.data | length' 2>/dev/null)
        print_success "找到 $model_count 个可用模型"
        echo "$body" | jq '.data[] | {id: .id, name: .name, vendor: .vendor, family: .family}' 2>/dev/null || echo "$body"
        
        # 返回第一个模型 ID
        echo "$body" | jq -r '.data[0].id' 2>/dev/null
        return 0
    else
        print_error "获取模型列表失败"
        echo "$body"
        return 1
    fi
}

# 测试简单聊天
test_simple_chat() {
    print_separator
    print_title "4. 简单聊天 (非流式)"
    print_separator
    
    payload='{
        "messages": [
            {"role": "user", "content": "Say \"Hello, World!\" if you can read this."}
        ],
        "max_tokens": 50
    }'
    
    echo "发送请求..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$BASE_URL/v1/chat/completions" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        content=$(echo "$body" | jq -r '.choices[0].message.content' 2>/dev/null)
        model=$(echo "$body" | jq -r '.model' 2>/dev/null)
        
        print_success "聊天成功"
        echo "模型: $model"
        echo "回复: $content"
        return 0
    else
        print_error "聊天失败"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# 测试指定模型聊天
test_chat_with_model() {
    local model_id=$1
    
    print_separator
    print_title "5. 指定模型聊天 ($model_id)"
    print_separator
    
    payload=$(cat <<EOF
{
    "model": "$model_id",
    "messages": [
        {"role": "user", "content": "What is 2+2? Answer briefly."}
    ],
    "max_tokens": 50
}
EOF
)
    
    echo "发送请求..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$BASE_URL/v1/chat/completions" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        content=$(echo "$body" | jq -r '.choices[0].message.content' 2>/dev/null)
        print_success "聊天成功"
        echo "回复: $content"
        return 0
    else
        print_error "聊天失败"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# 测试流式聊天
test_streaming() {
    print_separator
    print_title "6. 流式聊天"
    print_separator
    
    payload='{
        "messages": [
            {"role": "user", "content": "Count from 1 to 5, one number per line."}
        ],
        "stream": true,
        "max_tokens": 100
    }'
    
    echo "发送流式请求..."
    echo "----------------------------------------"
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$BASE_URL/v1/chat/completions" 2>/dev/null | while IFS= read -r line; do
        if [[ $line == data:* ]]; then
            data="${line#data: }"
            if [ "$data" != "[DONE]" ]; then
                content=$(echo "$data" | jq -r '.choices[0].delta.content // empty' 2>/dev/null)
                if [ -n "$content" ]; then
                    echo -n "$content"
                fi
            fi
        fi
    done
    
    echo ""
    echo "----------------------------------------"
    print_success "流式传输完成"
}

# 测试多轮对话
test_multi_turn() {
    print_separator
    print_title "7. 多轮对话"
    print_separator
    
    payload='{
        "messages": [
            {"role": "user", "content": "My name is Alice."},
            {"role": "assistant", "content": "Hello Alice! Nice to meet you."},
            {"role": "user", "content": "What is my name?"}
        ],
        "max_tokens": 50
    }'
    
    echo "发送多轮对话请求..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$BASE_URL/v1/chat/completions" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "状态码: $http_code"
    
    if [ "$http_code" = "200" ]; then
        content=$(echo "$body" | jq -r '.choices[0].message.content' 2>/dev/null)
        print_success "多轮对话成功"
        echo "回复: $content"
        
        if [[ $content == *"Alice"* ]] || [[ $content == *"alice"* ]]; then
            print_success "模型记住了用户名称!"
        else
            print_warning "模型可能没有记住用户名称"
        fi
        return 0
    else
        print_error "多轮对话失败"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# 主函数
main() {
    echo ""
    echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
    echo "  VS Code LM API Proxy - Shell 测试"
    echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
    echo ""
    
    # 检查 jq 是否安装
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，JSON 输出可能不美观"
        echo "安装方法: sudo apt install jq (Ubuntu) 或 brew install jq (macOS)"
        echo ""
    fi
    
    # 运行测试
    local passed=0
    local failed=0
    
    # Test 1: Health
    if test_health; then
        ((passed++))
    else
        ((failed++))
        print_error "服务器未运行，停止测试"
        exit 1
    fi
    
    echo ""
    
    # Test 2: Info
    if test_info; then
        ((passed++))
    else
        ((failed++))
    fi
    
    echo ""
    
    # Test 3: Models
    model_id=$(test_models)
    if [ $? -eq 0 ]; then
        ((passed++))
    else
        ((failed++))
    fi
    
    echo ""
    
    # Test 4: Simple chat
    if test_simple_chat; then
        ((passed++))
    else
        ((failed++))
    fi
    
    echo ""
    
    # Test 5: Chat with model
    if [ -n "$model_id" ]; then
        if test_chat_with_model "$model_id"; then
            ((passed++))
        else
            ((failed++))
        fi
    else
        print_warning "跳过指定模型测试（无可用模型）"
    fi
    
    echo ""
    
    # Test 6: Streaming
    test_streaming
    ((passed++))
    
    echo ""
    
    # Test 7: Multi-turn
    if test_multi_turn; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 打印总结
    echo ""
    print_separator
    print_title "测试总结"
    print_separator
    echo ""
    echo "总测试数: $((passed + failed))"
    echo "通过: $passed"
    echo "失败: $failed"
    echo "成功率: $(awk "BEGIN {printf \"%.1f\", ($passed/($passed+$failed))*100}")%"
    echo ""
    
    if [ $failed -eq 0 ]; then
        print_success "所有测试通过! 🎉"
    else
        print_error "部分测试失败"
    fi
    
    echo ""
}

# 运行主函数
main
