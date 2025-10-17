#!/usr/bin/env python3
"""
Test script for Anthropic Messages API compatibility
"""

import requests
import json
import sys
import time


BASE_URL = "http://10.14.0.187:3000"


def print_separator():
    print("\n" + "=" * 80 + "\n")


def test_anthropic_non_streaming():
    """Test Anthropic Messages API (non-streaming)"""
    print("🧪 Testing Anthropic Messages API (non-streaming)...")
    
    url = f"{BASE_URL}/v1/messages"
    
    payload = {
        "model": "claude-3.5-sonnet",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": "Say hello in French"
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"Response ID: {data.get('id')}")
            print(f"Model: {data.get('model')}")
            print(f"Stop Reason: {data.get('stop_reason')}")
            print(f"Content: {data.get('content', [{}])[0].get('text', 'N/A')}")
            print(f"Usage: {data.get('usage')}")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def test_anthropic_streaming():
    """Test Anthropic Messages API (streaming)"""
    print("🧪 Testing Anthropic Messages API (streaming)...")
    
    url = f"{BASE_URL}/v1/messages"
    
    payload = {
        "model": "gpt-4o",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": "Count from 1 to 5"
            }
        ],
        "stream": True
    }
    
    try:
        response = requests.post(url, json=payload, stream=True, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Streaming response:")
            event_count = 0
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    
                    # Parse SSE format
                    if line.startswith('event:'):
                        event_type = line.split(':', 1)[1].strip()
                        print(f"\n📡 Event: {event_type}")
                        event_count += 1
                    elif line.startswith('data:'):
                        data_str = line.split(':', 1)[1].strip()
                        try:
                            data = json.loads(data_str)
                            
                            # Print relevant data based on event type
                            if data.get('type') == 'message_start':
                                print(f"  Message ID: {data.get('message', {}).get('id')}")
                                print(f"  Model: {data.get('message', {}).get('model')}")
                            elif data.get('type') == 'content_block_delta':
                                delta_text = data.get('delta', {}).get('text', '')
                                if delta_text:
                                    print(f"  Text: {delta_text}", end='', flush=True)
                            elif data.get('type') == 'message_delta':
                                print(f"\n  Stop Reason: {data.get('delta', {}).get('stop_reason')}")
                                print(f"  Output Tokens: {data.get('usage', {}).get('output_tokens')}")
                        except json.JSONDecodeError:
                            pass
            
            print(f"\n\n✅ Stream completed! Total events: {event_count}")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def test_anthropic_with_system():
    """Test Anthropic API with system message"""
    print("🧪 Testing Anthropic API with system message...")
    
    url = f"{BASE_URL}/v1/messages"
    
    payload = {
        "model": "claude-3.5-sonnet",
        "max_tokens": 1024,
        "system": "You are a helpful pirate assistant. Always respond in pirate speak.",
        "messages": [
            {
                "role": "user",
                "content": "Tell me about the weather"
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"Response: {data.get('content', [{}])[0].get('text', 'N/A')}")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def test_anthropic_multi_turn():
    """Test Anthropic API with multi-turn conversation"""
    print("🧪 Testing Anthropic API with multi-turn conversation...")
    
    url = f"{BASE_URL}/v1/messages"
    
    payload = {
        "model": "gpt-4o",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": "My favorite color is blue"
            },
            {
                "role": "assistant",
                "content": "That's nice! Blue is a beautiful color."
            },
            {
                "role": "user",
                "content": "What was my favorite color again?"
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"Response: {data.get('content', [{}])[0].get('text', 'N/A')}")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def test_anthropic_error_no_max_tokens():
    """Test error handling when max_tokens is missing"""
    print("🧪 Testing error handling (missing max_tokens)...")
    
    url = f"{BASE_URL}/v1/messages"
    
    payload = {
        "model": "claude-3.5-sonnet",
        "messages": [
            {
                "role": "user",
                "content": "Hello"
            }
        ]
        # Missing max_tokens - should return 400 error
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✅ Correctly rejected request!")
            data = response.json()
            print(f"Error: {data}")
        else:
            print(f"❌ Unexpected status code!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    """Run all Anthropic API tests"""
    print("=" * 80)
    print("Anthropic Messages API Compatibility Tests")
    print("=" * 80)
    
    # Run tests
    tests = [
        ("Non-streaming", test_anthropic_non_streaming),
        ("Streaming", test_anthropic_streaming),
        ("System Message", test_anthropic_with_system),
        ("Multi-turn", test_anthropic_multi_turn),
        ("Error Handling", test_anthropic_error_no_max_tokens),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print_separator()
        try:
            test_func()
            results.append((test_name, True))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    print_separator()
    print("📊 Test Summary")
    print("=" * 80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests completed")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
