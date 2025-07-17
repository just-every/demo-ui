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
  const { state, processEvent, addUserMessage } = useTaskState();

  return (
    <Conversation
      taskState={state}
      isLoading={state.isLoading}
    />
  );
}
```

### With Memory Visualization

```tsx
import { Conversation, MemoryView, useTaskState } from '@just-every/demo-ui';

function ChatWithMemory() {
  const { state, processEvent } = useTaskState();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Conversation
        taskState={state}
        isLoading={state.isLoading}
        className="chat-main"
      />
      <MemoryView
        memoryData={state.memoryData}
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
  isLoading?: boolean;
  isCompact?: boolean;
  emptyMessage?: string;
  className?: string;
  containerClassName?: string;
  messageClassName?: string;
  autoScroll?: boolean;
  maxHeight?: string;
  urlMappings?: UrlMapping[];
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

## Additional Components

### `<Header />`

A customizable header component with tab navigation support.

```tsx
interface HeaderTab {
  id: string;
  label: string;
  count?: number;
}

<Header 
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  className="custom-header"
/>
```

### `<CostView />`

Displays cost tracking information for LLM usage.

```tsx
<CostView 
  costHistory={costHistory}
  costByModel={costByModel}
  totalCost={totalCost}
/>
```

### `<MarkdownViewer />`

Renders markdown content with support for syntax highlighting and file expansion.

```tsx
<MarkdownViewer 
  filePath="/path/to/file.md"
  onFileExpand={handleFileExpand}
/>
```

### `<MessageImages />`

Extracts and displays images from message content with lightbox support.

```tsx
<MessageImages 
  content={messageContent}
  urlMappings={urlMappings}
/>
```

## Hooks

### `useTaskState`

The main hook for managing conversation state and WebSocket events.

```tsx
const { state, processEvent, reset, addUserMessage } = useTaskState(options);

// state includes:
interface TaskState {
  llmRequests: LLMRequestData[];
  messages: ResponseOutputEvent[];
  requestAgents: Map<string, any>;
  totalCost: number;
  totalTokens: number;
  memoryData: MetaMemoryEventData;
  cognitionData: MetaCognitionEventData;
  isLoading: boolean;
  runningTasks: Map<string, { taskId: string; startTime: Date }>;
  runningRequests: Map<string, { requestId: string; startTime: Date }>;
}
```

## Streaming Events

The library now supports real-time streaming of messages through WebSocket events:

- **message_start**: Begins a new message stream
- **message_delta**: Adds content chunks to the message
- **tool_start**: Begins a tool call
- **tool_delta**: Updates tool arguments during execution
- **response_output**: Final complete message

Messages appear immediately when streaming starts and update in real-time as content arrives.

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- Mobile: Responsive design for all screen sizes
- WebSocket: Required for real-time features

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT © Just Every Team