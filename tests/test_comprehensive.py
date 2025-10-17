#!/usr/bin/env python3
"""
VS Code LM API Proxy - 综合测试脚本
测试改进后的扩展功能
"""

import requests
import json
import time
import sys


BASE_URL = "http://10.14.0.187:3000"


def print_section(title):
    """打印分节标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_health():
    """测试健康检查端点"""
    print_section("1. 健康检查")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 健康检查成功")
            print(f"   状态: {data.get('status')}")
            print(f"   时间戳: {data.get('timestamp')}")
            print(f"   版本: {data.get('version')}")
            return True
        else:
            print(f"❌ 健康检查失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        print("\n请确保:")
        print("1. VS Code 已启动扩展 (按 F5)")
        print("2. 运行了 'LM Proxy: Start Server' 命令")
        print("3. GitHub Copilot 已激活")
        return False


def test_root_endpoint():
    """测试根端点"""
    print_section("2. API 信息")
    try:
        response = requests.get(BASE_URL, timeout=5)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 获取 API 信息成功")
            print(f"   名称: {data.get('name')}")
            print(f"   版本: {data.get('version')}")
            print(f"   描述: {data.get('description')}")
            print("   端点:")
            for name, path in data.get('endpoints', {}).items():
                print(f"     - {name}: {path}")
            return True
        else:
            print(f"❌ 获取 API 信息失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def test_models():
    """测试模型列表端点"""
    print_section("3. 模型列表")
    try:
        response = requests.get(f"{BASE_URL}/v1/models", timeout=10)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('data', [])
            print(f"✅ 找到 {len(models)} 个可用模型")
            
            if models:
                print("\n可用模型:")
                for i, model in enumerate(models[:5], 1):  # 只显示前5个
                    print(f"   {i}. {model.get('name', 'N/A')}")
                    print(f"      ID: {model.get('id')}")
                    print(f"      Vendor: {model.get('vendor')}")
                    print(f"      Family: {model.get('family')}")
                    if model.get('max_input_tokens'):
                        print(f"      Max Tokens: {model.get('max_input_tokens')}")
                    print()
                
                if len(models) > 5:
                    print(f"   ... 还有 {len(models) - 5} 个模型")
                
                return models[0].get('id') if models else None
            else:
                print("⚠️  未找到可用模型")
                return None
        else:
            print(f"❌ 获取模型列表失败: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return None


def test_chat_simple():
    """测试简单聊天补全"""
    print_section("4. 简单聊天补全 (非流式)")
    try:
        data = {
            "messages": [
                {"role": "user", "content": "Say 'Hello, World!' if you can read this."}
            ],
            "max_tokens": 50
        }
        
        print("发送请求...")
        print(f"消息: {data['messages'][0]['content']}")
        
        response = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print("✅ 聊天补全成功")
                print(f"   模型: {result.get('model')}")
                print(f"   回复: {content}")
                return True
            else:
                print(f"❌ 响应格式不正确: {result}")
                return False
        else:
            print(f"❌ 聊天补全失败 ({response.status_code})")
            print(f"   错误: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def test_chat_with_model(model_id):
    """测试指定模型的聊天补全"""
    print_section(f"5. 指定模型聊天 ({model_id})")
    try:
        data = {
            "model": model_id,
            "messages": [
                {"role": "user", "content": "What is 2+2? Answer briefly."}
            ],
            "max_tokens": 50
        }
        
        print("发送请求...")
        print(f"模型: {model_id}")
        print(f"消息: {data['messages'][0]['content']}")
        
        response = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print("✅ 聊天补全成功")
                print(f"   回复: {content}")
                return True
            else:
                print(f"❌ 响应格式不正确: {result}")
                return False
        else:
            print(f"❌ 聊天补全失败 ({response.status_code})")
            print(f"   错误: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def test_streaming():
    """测试流式聊天补全"""
    print_section("6. 流式聊天补全")
    try:
        data = {
            "messages": [
                {"role": "user", "content": "Count from 1 to 5, one number per line."}
            ],
            "stream": True,
            "max_tokens": 100
        }
        
        print("发送流式请求...")
        print(f"消息: {data['messages'][0]['content']}")
        print("\n流式响应:")
        print("-" * 40)
        
        response = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30,
            stream=True
        )
        
        if response.status_code == 200:
            chunk_count = 0
            full_content = ""
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]  # Remove 'data: ' prefix
                        
                        if data_str == '[DONE]':
                            print("\n" + "-" * 40)
                            print("✅ 流式传输完成")
                            print(f"   总块数: {chunk_count}")
                            print(f"   完整内容: {full_content}")
                            return True
                        
                        try:
                            chunk = json.loads(data_str)
                            if 'choices' in chunk and len(chunk['choices']) > 0:
                                delta = chunk['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    print(content, end='', flush=True)
                                    full_content += content
                                    chunk_count += 1
                        except json.JSONDecodeError:
                            pass
            
            print(f"\n❌ 流未正常结束")
            return False
        else:
            print(f"❌ 流式请求失败 ({response.status_code})")
            print(f"   错误: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def test_multi_turn():
    """测试多轮对话"""
    print_section("7. 多轮对话")
    try:
        data = {
            "messages": [
                {"role": "user", "content": "My name is Alice."},
                {"role": "assistant", "content": "Hello Alice! Nice to meet you."},
                {"role": "user", "content": "What's my name?"}
            ],
            "max_tokens": 50
        }
        
        print("发送多轮对话请求...")
        print("对话历史:")
        for msg in data['messages']:
            print(f"   {msg['role']}: {msg['content']}")
        
        response = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\n状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print("✅ 多轮对话成功")
                print(f"   回复: {content}")
                
                # Check if the assistant remembered the name
                if 'alice' in content.lower():
                    print("   ✅ 模型记住了用户名称!")
                else:
                    print("   ⚠️  模型可能没有记住用户名称")
                
                return True
            else:
                print(f"❌ 响应格式不正确: {result}")
                return False
        else:
            print(f"❌ 多轮对话失败 ({response.status_code})")
            print(f"   错误: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def run_all_tests():
    """运行所有测试"""
    print("\n" + "🚀" * 30)
    print("  VS Code LM API Proxy - 综合测试")
    print("🚀" * 30)
    
    results = {
        "health": False,
        "root": False,
        "models": None,
        "chat_simple": False,
        "chat_with_model": False,
        "streaming": False,
        "multi_turn": False,
    }
    
    # Test 1: Health check
    results["health"] = test_health()
    if not results["health"]:
        print("\n⚠️  服务器未运行，停止测试")
        return results
    
    time.sleep(0.5)
    
    # Test 2: Root endpoint
    results["root"] = test_root_endpoint()
    time.sleep(0.5)
    
    # Test 3: Models
    model_id = test_models()
    results["models"] = model_id is not None
    time.sleep(0.5)
    
    # Test 4: Simple chat
    results["chat_simple"] = test_chat_simple()
    time.sleep(0.5)
    
    # Test 5: Chat with specific model
    if model_id:
        results["chat_with_model"] = test_chat_with_model(model_id)
        time.sleep(0.5)
    
    # Test 6: Streaming
    results["streaming"] = test_streaming()
    time.sleep(0.5)
    
    # Test 7: Multi-turn conversation
    results["multi_turn"] = test_multi_turn()
    
    # Print summary
    print_section("测试总结")
    
    total_tests = len([k for k in results.keys() if k != "models"])
    passed_tests = sum(1 for k, v in results.items() if k != "models" and v)
    
    print(f"\n总测试数: {total_tests}")
    print(f"通过: {passed_tests}")
    print(f"失败: {total_tests - passed_tests}")
    print(f"成功率: {(passed_tests / total_tests * 100):.1f}%\n")
    
    for test_name, result in results.items():
        if test_name == "models":
            status = "✅ 通过" if result else "❌ 失败"
            print(f"  {status}  - {test_name.replace('_', ' ').title()}")
        else:
            status = "✅ 通过" if result else "❌ 失败"
            print(f"  {status}  - {test_name.replace('_', ' ').title()}")
    
    if passed_tests == total_tests:
        print("\n🎉 所有测试通过! 扩展工作正常!")
    else:
        print("\n⚠️  部分测试失败，请检查错误信息")
    
    return results


if __name__ == "__main__":
    try:
        results = run_all_tests()
        
        # Exit with appropriate code
        total_tests = len([k for k in results.keys() if k != "models"])
        passed_tests = sum(1 for k, v in results.items() if k != "models" and v)
        
        sys.exit(0 if passed_tests == total_tests else 1)
        
    except KeyboardInterrupt:
        print("\n\n❌ 测试被用户中断")
        sys.exit(1)
