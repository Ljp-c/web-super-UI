(()=>{

    let SysPrompt = `你是一个通过语音驱动的人工智能机械臂的调度模块中使用到的LLM，你会接收到语音转文字模块提供的用户输入，但可能识别的内容不完全正确；你应该尽力解读用户的意图，并将其转换为机械臂的VLA小模型拟执行的动作指令，并将其使用如下描述的JSON格式来进行分析。
输入示例：
请帮我叠衣服
输入示例：
{"thinking":"用户期望我叠衣服，这需要我操纵机械臂来叠衣服","actions":[{"node":"arm","task":"叠衣服","possibility":0.8}]}
Schema:
{"thinking":{"type":"string","description": "关于用户这个命令的一部分思考信息，可以辅助后文决策"},"actions":{"type":"array","description": "调度系统决定让各个组件执行的动作合集","items": {"type":"object","description": "具体的一个动作","properties": {"node":{"type":"string","description": "执行节点，例如arm表示机械臂"},"task":{"type":"string","description": "以最简单轻量化的方式向VLA子模型提供的语言文本描述"},"possibility":{"type":"number","description": "你认为这个任务能否执行，如果小于0.7，则在下文再创建一个更靠谱的任务"}}}}}`

    let postData = {
        "messages": [
            {
            "content": SysPrompt,
            "role": "system"
            }
        ],
        "model": "deepseek-chat",
        "thinking": {
            "type": "disabled"
        },
        "frequency_penalty": 0,
        "max_tokens": 4096,
        "presence_penalty": 0,
        "response_format": {
            "type": "json_object"
        },
        "stop": null,
        "stream": false,
        "stream_options": null,
        "temperature": 1,
        "top_p": 1,
        "tools": null,
        "tool_choice": "none",
        "logprobs": false,
        "top_logprobs": null
    }

    let API_KEY = (() => {
        // 浏览器环境：尝试从 localStorage 读取
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = window.localStorage.getItem("API_KEY");
            if (stored !== null) return stored;  // 允许空字符串作为有效值
        }
        // Node.js 环境：尝试从 process.env 读取
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
        throw new Error("No API Key Provided");
    })();

    let BaseURL = "https://api.deepseek.com/chat/completions";

    const ipmi_ask = ((payload)=>{
        return fetch(BaseURL,{
            "method":"POST",
            "headers":{
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                "Authorization":`Bearer ${API_KEY}`
            },
            "body":JSON.stringify(payload)
        })
    })

    var ai_ask = ((text)=>{
        return new Promise((r,j)=>{
            postData.messages.push({
                "content":text,
                "role":"user"
            })
            ipmi_ask(postData).then((v)=>{
                v.json().then((d)=>{
                    console.log(d)
                    let response = d['choices'][0]['message']['content'];
                    let reply = {}
                    try{
                        reply = JSON.parse(response)
                    }catch(err){
                        j(err)
                    }
                    r(reply)
                })
            })
        })
    });
    globalThis['ai_ask'] = ai_ask;
})()