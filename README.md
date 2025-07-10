# @just-every/demo-ui

A comprehensive React component library for building rich conversation interfaces with Ensemble-based AI applications.

## Features

- 🎨 **Rich UI Components** - Conversation view, messages, tool calls, thinking indicators, and more
- 📊 **Memory Visualization** - Interactive memory tag graph showing conversation threads and topics
- 🔌 **Ensemble Integration** - Built-in support for Ensemble WebSocket events and meta-events
- 🎭 **Glassmorphism Theme** - Beautiful glass-effect UI with customizable styling
- 🧠 **Meta-Event Processing** - Support for memory, cognition, and custom event streams
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🛠️ **TypeScript Support** - Full type definitions included
- ⚡ **Performance Optimized** - Efficient rendering, auto-scrolling, and dynamic loading

## Installation

```bash
npm install @just-every/demo-ui
# or
yarn add @just-every/demo-ui
```

## Quick Start

### Basic Usage

```tsx
import { Conversation, useTaskState } from '@just-every/demo-ui';
import '@just-every/demo-ui/dist/styles.css';

function ChatApp() {
  const taskState = useTaskState({
    taskId: 'chat-session',
    agentName: 'assistant'
  });

  return (
    <Conversation
      taskState={taskState}
      isStreaming={taskState.isStreaming}
    />
  );
}
```

### With Memory Visualization

```tsx
import { Conversation, MemoryView, useTaskState } from '@just-every/demo-ui';

function ChatWithMemory() {
  const taskState = useTaskState({
    taskId: 'chat-session',
    enableMetaMemory: true,
    enableMetaCognition: true
  });

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Conversation
        taskState={taskState}
        isStreaming={taskState.isStreaming}
        className="chat-main"
      />
      <MemoryView
        memoryData={taskState.memoryData}
        className="memory-sidebar"
      />
    </div>
  );
}
```

## Core Components

### `<Conversation />`

The main conversation component with integrated memory tag visualization.

```tsx
interface ConversationProps {
  taskState: TaskState;
  isStreaming?: boolean;
  isCompact?: boolean;
  emptyMessage?: string;
  className?: string;
  containerClassName?: string;
  messageClassName?: string;
  autoScroll?: boolean;
  maxHeight?: string;
}
```

### `<Message />`

Individual message component with support for tool calls, thinking content, and metadata.

```tsx
interface MessageProps {
  message: MessageData;
  className?: string;
  isCompact?: boolean;
}
```

### `<MemoryTagGraph />`

Interactive visualization of conversation memory tags and threads.

```tsx
interface MemoryTagGraphProps {
  messages: ResponseOutputEvent[];
  memoryData: MetaMemoryEventData;
  messagePositions: number[];
  fullHeight: number;
  className?: string;
  onWidthChange?: (width: number) => void;
}
```

### `<MemoryView />`

Sidebar component for viewing and managing conversation memory.

```tsx
interface MemoryViewProps {
  memoryData: MetaMemoryEventData;
  className?: string;
}
```

## Hooks

### `useTaskState()`

Core hook for managing conversation state with Ensemble integration.

```tsx
const taskState = useTaskState({
  taskId: string;
  agentName?: string;
  enableMetaMemory?: boolean;
  enableMetaCognition?: boolean;
  onEvent?: (event: ResponseOutputEvent) => void;
});

// Returns:
interface TaskState {
  messages: ResponseOutputEvent[];
  isStreaming: boolean;
  memoryData: MetaMemoryEventData;
  cognitionData: MetaCognitionEventData;
  customEvents: Map<string, any>;
  requestAgents: Map<string, Set<string>>;
  requests: Map<string, LLMRequest>;
}
```

## Key Types

```tsx
interface MessageData {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking_content?: string;
  model?: string;
  modelClass?: string;
  tools?: ToolCall[];
  streaming?: boolean;
  timestamp?: string;
  thread?: string;
  tags?: string[];
  agents?: string[];
  metadata?: {
    summary?: string;
    topic_tags?: string[];
  };
  color?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
  result?: ToolResult;
}

interface ResponseOutputEvent {
  task_id: string;
  event: string;
  timestamp: string;
  sequence_number: number;
  request_id?: string;
  message: {
    id?: string;
    role: string;
    content?: string;
    tool_calls?: ToolCall[];
  };
}
```

## Styling

The library uses a glassmorphism theme by default with extensive CSS variables for customization:

```css
/* Import the styles */
import '@just-every/demo-ui/dist/styles.css';

/* Override CSS variables */
:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --surface-glass: rgba(255, 255, 255, 0.05);
  --border-glass: rgba(255, 255, 255, 0.1);
  --accent-primary: #4a9eff;
  --text-primary: rgba(255, 255, 255, 0.95);
  /* ... many more available */
}
```

## Advanced Features

### Memory Tag Visualization

The `MemoryTagGraph` component provides an interactive visualization of conversation threads:
- **Dynamic Width**: Automatically adjusts based on the number of overlapping conversation threads
- **Tag Alignment**: Connectors align with tag headers for clear visual hierarchy
- **Interactive**: Click on nodes to navigate to specific messages

### Meta-Event Processing

Support for Ensemble meta-events enables advanced features:
- **Memory Events**: Track conversation topics, summaries, and relationships
- **Cognition Events**: Monitor AI reasoning and decision-making processes
- **Custom Events**: Extend with your own event processors

### Event Processors

```tsx
// Custom event processor example
const customProcessor = (event: ResponseOutputEvent) => {
  if (event.event === 'custom.analysis') {
    return {
      type: 'analysis',
      data: JSON.parse(event.message.content || '{}')
    };
  }
  return null;
};
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- Mobile: Responsive design for all screen sizes

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT © Just Every Team