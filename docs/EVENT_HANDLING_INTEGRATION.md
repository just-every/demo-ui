# Event Handling Integration Guide for Demo Systems

This guide explains how to integrate the comprehensive event handling and display system from `@just-every/demo-ui` into your demo applications.

## Overview

The event handling system provides a unified way to process and display various types of events from `runTask`:
- **LLM Requests** - Track all AI model calls
- **Conversation Messages** - Display streaming chat messages
- **MetaMemory Events** - Track memory operations and thread management
- **MetaCognition Events** - Monitor strategy adjustments and reasoning
- **Custom Events** - Handle task-specific data (images, iterations, etc.)

## Quick Start

### 1. Basic Integration

```typescript
import { 
  useTaskEventProcessors,
  Conversation,
  LLMRequestLog,
  CognitionView
} from '@just-every/demo-ui';

function MyDemoApp() {
  const { 
    processEvent, 
    messages, 
    llmRequests, 
    memoryData, 
    cognitionData
  } = useTaskEventProcessors();

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
      <Conversation messages={messages} />
      <LLMRequestLog requests={llmRequests} />
      <CognitionView data={cognitionData} />
      <MemoryView data={memoryData} messages={messages} />
    </div>
  );
}
```

### 2. With Custom Events

For tasks that generate custom data (like images or design iterations):

```typescript
import { 
  useTaskEventProcessorsWithCustom,
  ImageGalleryView,
  DesignIterationsView
} from '@just-every/demo-ui';

function DesignDemoApp() {
  const { 
    processEvent,
    messages,
    llmRequests,
    customProcessors
  } = useTaskEventProcessorsWithCustom({
    'image_generated': {
      eventType: 'image_generated',
      maxHistory: 100,
      reducer: (state, event) => ({
        ...state,
        images: [...(state.images || []), event.data],
        latestImage: event.data
      })
    },
    'design_iteration': {
      eventType: 'design_iteration',
      subtypes: ['new_version', 'feedback', 'approval']
    }
  });

  // ... WebSocket setup ...

  return (
    <>
      <Conversation messages={messages} />
      
      {customProcessors?.image_generated && (
        <ImageGalleryView
          images={customProcessors.image_generated.state.images}
          latestImage={customProcessors.image_generated.state.latestImage}
          columns={3}
          imageSize="medium"
        />
      )}
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
function ComprehensiveDemoApp() {
  const [activeTab, setActiveTab] = useState<'chat' | 'requests' | 'memory' | 'cognition'>('chat');
  
  const { 
    processEvent,
    messages,
    llmRequests,
    memoryData,
    cognitionData,
    reset
  } = useTaskEventProcessors();

  // Add user message before starting task
  const startTask = async (prompt: string) => {
    reset(); // Clear previous data
    
    // Add user message to conversation
    const { addUserMessage } = taskProcessor;
    addUserMessage(prompt);
    
    // Start the task
    await runTask(prompt);
  };

  return (
    <div>
      <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
      
      {activeTab === 'chat' && <Conversation messages={messages} />}
      {activeTab === 'requests' && <LLMRequestLog requests={llmRequests} />}
      {activeTab === 'memory' && <MemoryView data={memoryData} />}
      {activeTab === 'cognition' && <CognitionView data={cognitionData} />}
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
  const { processEvent, messages, llmRequests } = useTaskEventProcessors();

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
  const { processEvent } = useTaskEventProcessors();

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
  const { processEvent, messages } = useTaskEventProcessors();
  
  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('demo_messages', JSON.stringify(messages));
  }, [messages]);
  
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
const { processEvent } = useTaskEventProcessors();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  processEvent(data); // Handles all event types automatically
};
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

## Examples Repository

For complete working examples, see:
- `/demo-ui/src/examples/taskEventProcessorExample.tsx` - Basic integration
- `/ensemble/demo/` - Request demo with streaming
- `/task/demo/` - Full task runner with all event types

Each example demonstrates different integration patterns and use cases.