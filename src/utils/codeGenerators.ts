/**
 * Generate TypeScript/JavaScript code for Ensemble request
 */
export const generateRequestCode = (options: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    tools?: boolean;
    stream?: boolean;
    language?: 'typescript' | 'javascript';
}): string => {
    const { model, messages, temperature, maxTokens, tools, stream = true, language = 'typescript' } = options;
    
    const imports = language === 'typescript' 
        ? `import { ensembleRequest, type Message } from '@just-every/ensemble';`
        : `import { ensembleRequest } from '@just-every/ensemble';`;
    
    const messagesCode = JSON.stringify(messages, null, 2);
    const optionsLines = [];
    
    if (temperature !== undefined) optionsLines.push(`temperature: ${temperature}`);
    if (maxTokens !== undefined) optionsLines.push(`max_tokens: ${maxTokens}`);
    if (tools) optionsLines.push(`tools: true`);
    
    const optionsCode = optionsLines.length > 0 
        ? `,\n    ${optionsLines.join(',\n    ')}`
        : '';

    return `${imports}

const messages${language === 'typescript' ? ': Message[]' : ''} = ${messagesCode};

${stream ? '// Stream the response' : '// Get the response'}
const response = await ensembleRequest({
    model: '${model}',
    messages${optionsCode}
});

${stream ? `// Handle streaming events
for await (const event of response) {
    switch (event.type) {
        case 'message_delta':
            process.stdout.write(event.content);
            break;
        case 'tool_start':
            console.log('\\nTool called:', event.tool.function.name);
            break;
        case 'stream_end':
            console.log('\\nStream completed');
            break;
    }
}` : `// Process the response
console.log(response.content);`}`;
};

/**
 * Generate code for embedding creation
 */
export const generateEmbedCode = (options: {
    texts: string[];
    model: string;
    dimensions?: number;
    language?: 'typescript' | 'javascript';
}): string => {
    const { texts, model, dimensions } = options;
    
    const imports = `import { ensembleEmbed } from '@just-every/ensemble';`;
    const textsCode = JSON.stringify(texts, null, 2);
    const dimensionsLine = dimensions ? `\n    dimensions: ${dimensions},` : '';

    return `${imports}

const texts = ${textsCode};

const embeddings = await ensembleEmbed(texts, {
    model: '${model}'${dimensionsLine}
});

// Process embeddings
embeddings.forEach((embedding, index) => {
    console.log(\`Text: \${texts[index]}\`);
    console.log(\`Embedding dimensions: \${embedding.length}\`);
    console.log('---');
});`;
};

/**
 * Generate HTML demo code
 */
export const generateHTMLDemo = (options: {
    title: string;
    wsUrl: string;
    features?: string[];
}): string => {
    const { title, wsUrl, features = [] } = options;
    
    const hasAudio = features.includes('audio');
    const hasTools = features.includes('tools');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #0f0f0f;
            color: #e0e0e0;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
        }
        .user { border-left: 3px solid #4a9eff; }
        .assistant { border-left: 3px solid #10b981; }
        input, button {
            padding: 10px;
            margin: 5px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div id="messages"></div>
    
    <div style="margin-top: 20px;">
        <input type="text" id="messageInput" placeholder="Type your message..." style="width: 70%;" />
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        const ws = new WebSocket('${wsUrl}');
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'message_delta':
                    // Handle streaming message
                    appendToLastMessage(data.content);
                    break;
                case 'stream_end':
                    // Message complete
                    finalizeLastMessage();
                    break;${hasTools ? `
                case 'tool_start':
                    // Tool execution started
                    appendToolCall(data.tool);
                    break;` : ''}${hasAudio ? `
                case 'audio_chunk':
                    // Handle audio data
                    handleAudioChunk(data.data);
                    break;` : ''}
            }
        };
        
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            // Display user message
            addMessage('user', message);
            
            // Send to server
            ws.send(JSON.stringify({
                type: 'message',
                content: message
            }));
            
            messageInput.value = '';
        }
        
        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}\`;
            messageDiv.textContent = content;
            messagesDiv.appendChild(messageDiv);
        }
        
        function appendToLastMessage(content) {
            const messages = messagesDiv.getElementsByClassName('message');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.classList.contains('assistant')) {
                lastMessage.textContent += content;
            } else {
                addMessage('assistant', content);
            }
        }
        
        function finalizeLastMessage() {
            // Add any finalization logic here
        }
        
        // Enter key to send
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>`;
};