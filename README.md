# Ensemble Conversation UI

A reusable React component library for building conversation interfaces with Ensemble-based applications.

## Features

- 🎨 **Customizable UI Components** - Message display, input area, tool calls, thinking indicators
- 🔌 **Ensemble Integration** - Built-in support for Ensemble WebSocket events
- 🎭 **Theming Support** - Default and glassmorphism themes, plus custom theming
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🛠️ **TypeScript Support** - Full type definitions included
- ⚡ **Performance Optimized** - Efficient rendering and scroll handling

## Installation

```bash
npm install @just-every/demo-ui
# or
yarn add @just-every/demo-ui
```

## Quick Start

### Basic Usage

```tsx
import { Conversation, useConversation } from '@just-every/demo-ui';
import '@just-every/demo-ui/styles';

function ChatApp() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useConversation();

  return (
    <Conversation
      messages={messages}
      onSendMessage={sendMessage}
      onStopStreaming={stopStreaming}
      isStreaming={isStreaming}
    />
  );
}
```

### Advanced Customization

```tsx
import { Conversation, ConversationTheme } from '@just-every/demo-ui';

const customTheme: ConversationTheme = {
  primaryColor: '#4a9eff',
  backgroundColor: '#0f0f0f',
  glassmorphism: true,
};

function CustomChat() {
  return (
    <Conversation
      messages={messages}
      theme={customTheme}
      headerContent={<CustomHeader />}
      sidebarContent={<CustomSidebar />}
      footerContent={<CustomFooter />}
      renderCustomMessage={(message) => {
        // Custom message rendering
        if (message.role === 'system') {
          return <SystemMessage {...message} />;
        }
        return null; // Use default rendering
      }}
      enableFollowUpSuggestions
      followUpSuggestion="What else would you like to know?"
      onFollowUpClick={(suggestion) => {
        // Handle follow-up click
      }}
    />
  );
}
```

## Components

### `<Conversation />`

The main conversation component that includes messages, input, and optional sidebar.

```tsx
interface ConversationProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  inputPlaceholder?: string;
  showTimestamps?: boolean;
  showModelInfo?: boolean;
  theme?: ConversationTheme;
  className?: string;
  style?: React.CSSProperties;
  renderCustomMessage?: (message: Message) => React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  enableFollowUpSuggestions?: boolean;
  followUpSuggestion?: string;
  onFollowUpClick?: (suggestion: string) => void;
}
```

### `<Message />`

Individual message component for custom implementations.

```tsx
interface MessageProps {
  message: Message;
  showTimestamp?: boolean;
  showModelInfo?: boolean;
  theme?: ConversationTheme;
  renderCustomContent?: (message: Message) => React.ReactNode;
}
```

### `<ConversationInput />`

Standalone input component for custom layouts.

```tsx
interface ConversationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  theme?: ConversationTheme;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}
```

## Hooks

### `useConversation()`

Manages conversation state and actions.

```tsx
const {
  messages,
  isStreaming,
  sendMessage,
  stopStreaming,
  clearMessages,
  updateMessage,
  deleteMessage,
} = useConversation();
```

## Message Types

```tsx
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking_content?: string;
  model?: string;
  modelClass?: string;
  tools?: ToolCall[];
  streaming?: boolean;
  timestamp?: Date;
  id?: string;
}

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  result?: {
    output?: string;
    error?: string;
  };
}
```

## Theming

### Using Built-in Themes

```tsx
// Default theme
<Conversation messages={messages} />

// Glassmorphism theme
<Conversation 
  messages={messages} 
  theme={{ glassmorphism: true }} 
/>
```

### Custom Theme

```tsx
const customTheme: ConversationTheme = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  surfaceColor: '#f3f4f6',
  borderColor: '#e5e7eb',
  textColor: '#111827',
  userMessageBackground: '#3b82f6',
  assistantMessageBackground: '#f3f4f6',
  fontFamily: '"Inter", sans-serif',
  borderRadius: '12px',
  glassmorphism: false,
};
```

### CSS Variables

You can also customize the appearance using CSS variables:

```css
.ensemble-conversation {
  --conversation-bg: #ffffff;
  --conversation-text: #000000;
  --conversation-border: #e5e7eb;
  --conversation-primary: #3b82f6;
  /* ... and more */
}
```

## Examples

### Simple Chat Interface

```tsx
import { Conversation, useConversation } from '@just-every/demo-ui';

function SimpleChat() {
  const conversation = useConversation();

  // Simulate assistant response
  const handleSend = async (content: string) => {
    conversation.sendMessage(content);
    
    // Simulate streaming response
    const assistantMessage = {
      id: 'assistant-' + Date.now(),
      role: 'assistant' as const,
      content: '',
      streaming: true,
    };
    
    conversation.messages.push(assistantMessage);
    
    // Simulate streaming
    const response = "This is a simulated response...";
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      conversation.updateMessage(assistantMessage.id, {
        content: response.slice(0, i + 1),
      });
    }
    
    conversation.updateMessage(assistantMessage.id, {
      streaming: false,
    });
  };

  return (
    <Conversation
      messages={conversation.messages}
      onSendMessage={handleSend}
      isStreaming={conversation.isStreaming}
    />
  );
}
```

### With Tool Calls

```tsx
const messageWithTools: Message = {
  role: 'assistant',
  content: 'I'll help you with that calculation.',
  tools: [
    {
      id: 'call-123',
      function: {
        name: 'calculate',
        arguments: '{"expression": "2 + 2"}',
      },
      result: {
        output: '4',
      },
    },
  ],
};
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © Ensemble Team