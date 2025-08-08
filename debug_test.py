import requests
import json

def test_simple_request():
    """测试最简单的请求格式"""
    url = "http://127.0.0.1:3000/v1/chat/completions"
    
    print("🧪 测试简单聊天请求...")
    
    # 最简单的请求
    simple_data = {
        "messages": [
            {"role": "user", "content": "Hello"}
        ]
    }
    
    print("发送数据:")
    print(json.dumps(simple_data, indent=2))
    print("-" * 40)
    
    try:
        response = requests.post(
            url, 
            json=simple_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print("-" * 40)
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ 成功响应:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
            except json.JSONDecodeError as e:
                print("❌ JSON解析错误:")
                print(f"错误: {e}")
                print(f"原始响应内容: {response.text[:500]}...")
        else:
            print("❌ 请求失败:")
            try:
                error = response.json()
                print(json.dumps(error, indent=2, ensure_ascii=False))
            except:
                print(f"原始错误响应: {response.text[:500]}...")
                
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败 - 确保服务器正在运行")
    except requests.exceptions.Timeout:
        print("❌ 请求超时")
    except Exception as e:
        print(f"❌ 未知错误: {e}")

def test_with_model():
    """测试指定模型的请求"""
    url = "http://127.0.0.1:3000/v1/chat/completions"
    
    print("\n🧪 测试指定模型请求...")
    
    # 先获取可用模型
    try:
        models_response = requests.get("http://127.0.0.1:3000/v1/models", timeout=10)
        if models_response.status_code == 200:
            models = models_response.json()
            if models.get('data') and len(models['data']) > 0:
                model_id = models['data'][0]['id']
                print(f"使用模型: {model_id}")
                
                data_with_model = {
                    "model": model_id,
                    "messages": [
                        {"role": "user", "content": "Hi, please respond briefly."}
                    ],
                    "max_tokens": 50
                }
                
                print("发送数据:")
                print(json.dumps(data_with_model, indent=2))
                print("-" * 40)
                
                response = requests.post(
                    url, 
                    json=data_with_model,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
                
                print(f"状态码: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        print("✅ 成功响应:")
                        if 'choices' in result and result['choices']:
                            print(f"回复: {result['choices'][0]['message']['content']}")
                        else:
                            print("未找到回复内容")
                    except json.JSONDecodeError:
                        print("❌ JSON解析错误")
                        print(f"响应内容: {response.text[:200]}...")
                else:
                    print("❌ 请求失败")
                    print(f"响应: {response.text[:200]}...")
            else:
                print("❌ 没有可用模型")
        else:
            print("❌ 无法获取模型列表")
    except Exception as e:
        print(f"❌ 测试指定模型时出错: {e}")

if __name__ == "__main__":
    print("🔧 VS Code LM API Proxy 调试测试")
    print("=" * 50)
    
    # 测试1: 最简单的请求
    test_simple_request()
    
    # 测试2: 指定模型的请求
    test_with_model()
    
    print("\n" + "=" * 50)
    print("测试完成")
