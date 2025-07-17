# Event Handling Integration Guide for Demo Systems

This guide explains how to integrate the comprehensive event handling and display system from `@just-every/demo-ui` into your demo applications.

## Overview

The event handling system provides a unified way to process and display various types of events from `runTask`:
- **LLM Requests** - Track all AI model calls
- **Conversation Messages** - Display streaming chat messages
- **MetaMemory Events** - Track memory operations and thread management
- **MetaCognition Events** - Monitor strategy adjustments and reasoning
- **Custom Events** - Handle task-specific data (images, iterations, etc.)

### Available Hooks

- **`useTaskState`** (Recommended) - Unified hook that manages all event processors and provides a single state object
- **`useCustomEventProcessor`** - For handling custom event types
- **`useMetaMemoryProcessor`** - For handling memory events only
- **`useMetaCognitionProcessor`** - For handling cognition events only
- **`useTaskEventProcessor`** - For handling core task events only

## Quick Start

### 1. Basic Integration with useTaskState (Recommended)

```typescript
import { 
  useTaskState,
  Conversation,
  LLMRequestLog,
  CognitionView,
  MemoryView
} from '@just-every/demo-ui';

function MyDemoApp() {
  const { 
    state,
    processEvent,
    reset,
    addUserMessage
  } = useTaskState();

  // Connect to WebSocket and process events
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      processEvent(data); // Automatically routes to correct processor
    };

    return () => ws.close();
  }, [processEvent]);

  return (
    <div>
      <Conversation 
        taskState={state}
        isLoading={state.isLoading}
      />
      <LLMRequestLog requests={state.llmRequests} />
      <CognitionView data={state.cognitionData} />
      <MemoryView data={state.memoryData} messages={state.messages} />
    </div>
  );
}
```

### 2. With Custom Events

For tasks that generate custom data (like images or design iterations), you can combine `useTaskState` with custom event processors:

```typescript
import { 
  useTaskState,
  useCustomEventProcessor,
  useImageGallery,
  Conversation,
  ImageGalleryView,
  DesignIterationsView
} from '@just-every/demo-ui';

function DesignDemoApp() {
  const { state, processEvent: processTaskEvent } = useTaskState();
  
  // Use predefined image gallery hook
  const imageGallery = useImageGallery();
  
  // Or create custom processor
  const designProcessor = useCustomEventProcessor({
    eventType: 'design_iteration',
    subtypes: ['new_version', 'feedback', 'approval'],
    initialState: {
      iterations: [],
      currentVersion: 0
    },
    reducer: (state, event) => {
      // Custom logic for your events
      return state;
    }
  });

  // Process all events
  const processEvent = (event: any) => {
    // Route to task processor
    processTaskEvent(event);
    
    // Route to custom processors
    if (event.type === 'image_generated') {
      imageGallery.processEvent(event);
    } else if (event.type === 'design_iteration') {
      designProcessor.processEvent(event);
    }
  };

  return (
    <>
      <Conversation taskState={state} />
      
      <ImageGalleryView
        images={imageGallery.state.images}
        latestImage={imageGallery.state.latestImage}
        columns={3}
        imageSize="medium"
      />
      
      {/* Custom view for design iterations */}
      <DesignIterationsView
        iterations={designProcessor.state.iterations}
        currentVersion={designProcessor.state.currentVersion}
      />
    </>
  );
}
```

## Event Types Reference

### Standard Events (Handled Automatically)

#### 1. Provider Stream Events
```typescript
// From @just-every/ensemble
{
  type: 'stream_start' | 'message_delta' | 'tool_start' | 'tool_done' | 'stream_end',
  content?: string,
  model?: string,
  tool_call?: ToolCall
}
```

#### 2. Task Events
```typescript
// From @just-every/task
{
  type: 'task_complete' | 'task_fatal_error',
  finalState: { ... },
  result?: any,
  error?: string
}
```

#### 3. MetaMemory Events
```typescript
{
  type: 'metamemory_event',
  operation: 'tagging_start' | 'thread_updated' | 'conversation_compacted',
  data: {
    messageId?: string,
    threadId?: string,
    tags?: string[],
    messageCount?: number
  }
}
```

#### 4. MetaCognition Events
```typescript
{
  type: 'metacognition_event',
  operation: 'analysis_start' | 'analysis_complete',
  data: {
    trigger?: string,
    reasoning?: string,
    adjustments?: string[],
    thoughtContent?: string
  }
}
```

### Custom Events (Define Your Own)

```typescript
{
  type: 'your_event_type',
  subtype?: 'optional_subtype',
  data: {
    // Your custom data structure
  },
  timestamp: Date.now(),
  metadata?: { ... }
}
```

## Advanced Integration Patterns

### Pattern 1: Tab-Based UI with All Event Types

```typescript
import { useTaskState, TabGroup, TabPanel } from '@just-every/demo-ui';

function ComprehensiveDemoApp() {
  const [activeTab, setActiveTab] = useState<'chat' | 'requests' | 'memory' | 'cognition'>('chat');
  
  const { 
    state,
    processEvent,
    reset,
    addUserMessage
  } = useTaskState();

  // Add user message before starting task
  const startTask = async (prompt: string) => {
    reset(); // Clear previous data
    addUserMessage(prompt); // Add user message to conversation
    
    // Start the task
    await runTask(prompt);
  };

  const tabs = [
    { id: 'chat', label: 'Conversation' },
    { id: 'requests', label: 'LLM Requests' },
    { id: 'memory', label: 'Memory' },
    { id: 'cognition', label: 'Cognition' }
  ];

  return (
    <div>
      <TabGroup 
        tabs={tabs}
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />
      
      <TabPanel value={activeTab} tabValue="chat">
        <Conversation taskState={state} />
      </TabPanel>
      
      <TabPanel value={activeTab} tabValue="requests">
        <LLMRequestLog requests={state.llmRequests} />
      </TabPanel>
      
      <TabPanel value={activeTab} tabValue="memory">
        <MemoryView data={state.memoryData} messages={state.messages} />
      </TabPanel>
      
      <TabPanel value={activeTab} tabValue="cognition">
        <CognitionView data={state.cognitionData} />
      </TabPanel>
    </div>
  );
}
```

### Pattern 2: Custom Event Rendering

```typescript
import { CustomEventView } from '@just-every/demo-ui';

function CustomDemoApp() {
  const { state, events, processEvent } = useCustomEventProcessor({
    eventType: 'analysis_result',
    maxHistory: 20
  });

  return (
    <CustomEventView
      events={events}
      state={state}
      renderEvent={(event) => (
        <div className="analysis-result">
          <h4>{event.data.title}</h4>
          <p>{event.data.summary}</p>
          <pre>{JSON.stringify(event.data.metrics, null, 2)}</pre>
        </div>
      )}
      renderState={(state) => (
        <div className="current-analysis">
          <h3>Latest Analysis</h3>
          {/* Custom state rendering */}
        </div>
      )}
    />
  );
}
```

### Pattern 3: Real-time Updates with SSE

```typescript
function SSEDemoApp() {
  const { state, processEvent } = useTaskState();

  const runTaskWithSSE = async (prompt: string) => {
    const response = await fetch('/api/task/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            processEvent(event);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  };

  return (
    // UI components
  );
}
```

## Creating Custom Event Processors

### Example: Progress Tracking

```typescript
const progressProcessor = createCustomEventProcessor({
  eventType: 'progress_update',
  initialState: {
    steps: [],
    currentStep: 0,
    totalSteps: 0,
    isComplete: false
  },
  reducer: (state, event) => {
    const { step, total, status } = event.data;
    
    return {
      steps: [...state.steps, { step, status, timestamp: event.timestamp }],
      currentStep: step,
      totalSteps: total,
      isComplete: step === total && status === 'complete'
    };
  }
});

// Usage in component
function ProgressView() {
  const { state } = progressProcessor;
  
  return (
    <div>
      <ProgressBar value={state.currentStep} max={state.totalSteps} />
      <div>Step {state.currentStep} of {state.totalSteps}</div>
    </div>
  );
}
```

### Example: Multi-Modal Results

```typescript
const multiModalProcessor = createCustomEventProcessor({
  eventType: 'multimodal_result',
  subtypes: ['text', 'image', 'audio', 'video'],
  reducer: (state, event) => {
    const { subtype, data } = event;
    
    return {
      ...state,
      [subtype]: [...(state[subtype] || []), data]
    };
  }
});
```

## Best Practices

### 1. Event Naming Conventions

```typescript
// Good: Descriptive, consistent naming
'image_generated'
'design_iteration_updated'
'analysis_complete'

// Avoid: Generic or ambiguous names
'update'
'data'
'event'
```

### 2. Error Handling

```typescript
const robustEventProcessor = () => {
  const { processEvent } = useTaskState();

  const safeProcessEvent = (event: any) => {
    try {
      // Validate event structure
      if (!event || typeof event.type !== 'string') {
        console.warn('Invalid event structure:', event);
        return;
      }
      
      processEvent(event);
    } catch (error) {
      console.error('Error processing event:', error);
      // Optionally show user notification
    }
  };

  return safeProcessEvent;
};
```

### 3. Performance Optimization

```typescript
// Limit history for better performance
const optimizedProcessor = createCustomEventProcessor({
  eventType: 'frequent_event',
  maxHistory: 100, // Keep only last 100 events
  reducer: (state, event) => {
    // Avoid deep cloning large objects
    return {
      ...state,
      latest: event.data,
      count: (state.count || 0) + 1
    };
  }
});
```

### 4. State Persistence

```typescript
function PersistentDemoApp() {
  const { state, processEvent } = useTaskState();
  
  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('demo_messages', JSON.stringify(state.messages));
  }, [state.messages]);
  
  // Restore on mount
  useEffect(() => {
    const saved = localStorage.getItem('demo_messages');
    if (saved) {
      const messages = JSON.parse(saved);
      // Restore messages if needed
    }
  }, []);
}
```

## Troubleshooting

### Common Issues

1. **Events not being processed**
   - Check event type matches processor configuration
   - Verify WebSocket connection is established
   - Ensure processEvent is called with valid event structure

2. **UI not updating**
   - Confirm you're using the returned state from hooks
   - Check React component re-rendering
   - Verify event processor is updating state correctly

3. **Memory leaks**
   - Set maxHistory limits for high-frequency events
   - Clean up WebSocket connections in useEffect cleanup
   - Reset processors when starting new tasks

### Debug Mode

```typescript
// Enable debug logging
const debugProcessor = createCustomEventProcessor({
  eventType: 'my_event',
  reducer: (state, event) => {
    console.log('[DEBUG] Processing event:', event);
    const newState = { ...state, /* updates */ };
    console.log('[DEBUG] New state:', newState);
    return newState;
  }
});
```

## Migration Guide

### From Direct WebSocket Handling

Before:
```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'llm_request') {
    setLLMRequests(prev => [...prev, data]);
  } else if (data.type === 'stream_start') {
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
  }
  // ... more conditions
};
```

After:
```typescript
const { processEvent } = useTaskState();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  processEvent(data); // Handles all event types automatically
};
```

### From Individual Processors to useTaskState

The new `useTaskState` hook provides a more integrated experience:

Before (using individual processors):
```typescript
const taskProcessor = useTaskEventProcessor();
const memoryProcessor = useMetaMemoryProcessor();
const cognitionProcessor = useMetaCognitionProcessor();

// Had to manage routing manually
const processEvent = (event) => {
  switch (event.type) {
    case 'metamemory_event':
      memoryProcessor.processEvent(event);
      break;
    case 'metacognition_event':
      cognitionProcessor.processEvent(event);
      break;
    default:
      taskProcessor.processEvent(event);
  }
};

// Had to pass individual data
<Conversation messages={taskProcessor.messages} />
<MemoryView data={memoryProcessor.data} />
```

After:
```typescript
const { state, processEvent } = useTaskState();

// Automatic routing and unified state
<Conversation taskState={state} />
<MemoryView data={state.memoryData} />
```

### From Custom State Management

Before:
```typescript
const [images, setImages] = useState([]);
const [latestImage, setLatestImage] = useState(null);

// Manual event handling
if (event.type === 'image_generated') {
  setImages(prev => [...prev, event.data]);
  setLatestImage(event.data);
}
```

After:
```typescript
const imageGallery = useImageGallery();

// Automatic event handling
imageGallery.processEvent(event);

// Access processed data
<ImageGalleryView 
  images={imageGallery.state.images}
  latestImage={imageGallery.state.latestImage}
/>
```

## Integration Patterns

The library provides several integration patterns:

1. **Direct WebSocket Integration**: Process raw WebSocket events using `processEvent`
2. **Hook-based State Management**: Use `useTaskState` for automatic state management
3. **Custom Event Processors**: Extend functionality with custom event handlers
4. **Memory and Cognition Integration**: Built-in support for meta-events

For implementation details, refer to the source code and type definitions included with the package.