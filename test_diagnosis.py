import requests
import json
import time

def test_server_connection():
    """测试服务器连接和基本功能"""
    base_url = "http://127.0.0.1:3000"
    
    print("🔍 开始测试 VS Code LM API Proxy...")
    print(f"基础URL: {base_url}")
    print("💡 提示: 服务器已绑定到所有网络接口(0.0.0.0)，可从其他设备访问")
    print("-" * 50)
    
    # 1. 测试健康检查
    print("1. 测试健康检查...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   状态码: {response.status_code}")
        print(f"   响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                health_data = response.json()
                print(f"   ✅ 健康检查成功: {health_data}")
            except json.JSONDecodeError:
                print(f"   ❌ 响应不是有效的JSON:")
                print(f"   响应内容: {response.text[:200]}...")
                return False
        else:
            print(f"   ❌ 健康检查失败: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ 无法连接到服务器。请确保:")
        print("      - VS Code扩展已启动")
        print("      - 代理服务器已运行")
        print("      - 端口3000未被占用")
        return False
    except requests.exceptions.Timeout:
        print("   ❌ 请求超时")
        return False
    except Exception as e:
        print(f"   ❌ 未知错误: {e}")
        return False
    
    print()
    
    # 2. 测试模型列表
    print("2. 测试模型列表...")
    try:
        response = requests.get(f"{base_url}/v1/models", timeout=10)
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            try:
                models_data = response.json()
                print(f"   ✅ 获取模型成功:")
                if 'data' in models_data and models_data['data']:
                    for model in models_data['data'][:3]:  # 只显示前3个
                        print(f"      - {model.get('id', 'unknown')} ({model.get('vendor', 'unknown')})")
                    if len(models_data['data']) > 3:
                        print(f"      ... 总共 {len(models_data['data'])} 个模型")
                else:
                    print("      ⚠️  未找到可用模型")
            except json.JSONDecodeError:
                print(f"   ❌ 响应不是有效的JSON:")
                print(f"   响应内容: {response.text[:200]}...")
                return False
        else:
            print(f"   ❌ 获取模型失败: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"   ❌ 获取模型时出错: {e}")
        return False
    
    print()
    
    # 3. 测试简单聊天
    print("3. 测试聊天补全...")
    try:
        chat_data = {
            "messages": [
                {"role": "user", "content": "Hello! Please respond with 'Test successful' if you can see this."}
            ],
            "max_tokens": 50
        }
        
        response = requests.post(
            f"{base_url}/v1/chat/completions", 
            json=chat_data, 
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            try:
                chat_result = response.json()
                if 'choices' in chat_result and chat_result['choices']:
                    content = chat_result['choices'][0]['message']['content']
                    print(f"   ✅ 聊天测试成功!")
                    print(f"   响应: {content[:100]}...")
                else:
                    print(f"   ❌ 响应格式不正确: {chat_result}")
                    return False
            except json.JSONDecodeError:
                print(f"   ❌ 响应不是有效的JSON:")
                print(f"   响应内容: {response.text[:200]}...")
                return False
        else:
            print(f"   ❌ 聊天测试失败 (状态码: {response.status_code})")
            try:
                error_data = response.json()
                print(f"   错误信息: {error_data}")
            except:
                print(f"   错误响应: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"   ❌ 聊天测试时出错: {e}")
        return False
    
    print()
    print("🎉 所有测试通过! 代理服务器工作正常。")
    print()
    print("🌐 网络访问信息:")
    print("• 本地访问: http://127.0.0.1:3000")
    print("• 网络访问: http://[您的IP地址]:3000")
    print("• 获取本机IP: ipconfig (Windows) 或 ifconfig (Linux/Mac)")
    print("• 确保防火墙允许端口3000的入站连接")
    return True

def check_prerequisites():
    """检查前置条件"""
    print("🔧 检查前置条件...")
    print("-" * 50)
    
    # 检查是否可以导入requests
    try:
        import requests
        print("✅ requests库已安装")
    except ImportError:
        print("❌ 缺少requests库，请运行: pip install requests")
        return False
    
    print("✅ 前置条件检查完成")
    print()
    return True

if __name__ == "__main__":
    if not check_prerequisites():
        exit(1)
    
    print("请确保:")
    print("1. VS Code已启动并加载了扩展")
    print("2. 已运行命令 'Start LM API Proxy Server'")
    print("3. GitHub Copilot扩展已激活")
    print()
    
    input("按回车键开始测试...")
    print()
    
    if test_server_connection():
        print("\n🚀 代理服务器已准备就绪，可以开始使用!")
    else:
        print("\n❌ 测试失败，请检查上述错误信息")
