// Browser-safe exports only - excludes server-side utilities
// Core UI Components
export { GlassButton } from './components/GlassButton';
export { GlassCard } from './components/GlassCard';
export { Card } from './components/Card';
export { GlassInput } from './components/GlassInput';
export { Modal } from './components/Modal';

// Demo Components
export { default as DemoHeader } from './components/DemoHeader';
export { Header, type HeaderProps, type HeaderTab } from './components/Header';
export { default as LLMRequestLog } from './components/LLMRequestLog';
export { CostView } from './components/CostView';
export type { CostViewProps } from './components/CostView';

// Status and Feedback Components
export { default as ErrorMessage } from './components/ErrorMessage';
export { StatusIndicator } from './components/StatusIndicator';
export { ProgressBar } from './components/ProgressBar';
export { ConnectionStatus } from './components/ConnectionStatus';
export { StatsGrid } from './components/StatsGrid';
export { ModelSelector } from './components/ModelSelector';
export { NoContent } from './components/NoContent';

// Message and Conversation Components
export { Message, type MessageData, type UrlMapping } from './components/Message';
export { MessageAvatar } from './components/MessageAvatar';
export { MessageContent } from './components/MessageContent';
export { MessageMetadata } from './components/MessageMetadata';
export { MessageImages } from './components/MessageImages';
export { ToolCall, type ToolCallData } from './components/ToolCall';
export { TypingIndicator } from './components/TypingIndicator';
export { Conversation } from './components/Conversation';
export { ConversationInput } from './components/ConversationInput';
export { MemoryTagGraph } from './components/MemoryTagGraph';
export { TagIntroduction } from './components/TagIntroduction';

// Audio Components
export { AudioVisualizer } from './components/AudioVisualizer';
export { AudioVisualizerTime } from './components/AudioVisualizerTime';
export { AudioVisualizerFreq } from './components/AudioVisualizerFreq';
export { AudioPlayer } from './components/AudioPlayer';
export { AudioRecorder, type AudioRecorderConfig } from './components/AudioRecorder';
export { AudioProgressBar } from './components/AudioProgressBar';

// Settings and Form Components
export { SettingsPanel } from './components/SettingsPanel';
export { SettingsGrid } from './components/SettingsGrid';
export { AdvancedSettings } from './components/AdvancedSettings';
export { SliderSetting } from './components/SliderSetting';
export { ToggleSetting } from './components/ToggleSetting';
export { FormTextarea } from './components/FormTextarea';
export { FormSelect, type SelectOption, type SelectGroup, type SelectItem } from './components/FormSelect';

// Modal and Code Components
export { EnhancedModal } from './components/EnhancedModal';
export { TabGroup, TabPanel, type Tab } from './components/TabGroup';
export { CodeDisplay } from './components/CodeDisplay';
export { CodeModal, type CodeTab } from './components/CodeModal';
export { ShowCodeButton } from './components/ShowCodeButton';

// Task Event Components
export { CognitionView, type CognitionViewProps } from './components/CognitionView';
export { MemoryView, type MemoryViewProps } from './components/MemoryView';
export { 
    CustomEventView, 
    ImageGalleryView, 
    DesignIterationsView,
    type CustomEventViewProps,
    type ImageGalleryViewProps,
    type DesignIterationsViewProps
} from './components/CustomEventView';

// Embedding and Search Components
export { EmbeddingItem, type EmbeddingData } from './components/EmbeddingItem';
export { EmbeddingsList } from './components/EmbeddingsList';
export { SearchInput } from './components/SearchInput';
export { SearchResults, type SearchResult } from './components/SearchResults';
export { SimilarityBar } from './components/SimilarityBar';
export { AnalysisDisplay } from './components/AnalysisDisplay';

// Hooks
export { useAutoScroll } from './hooks/useAutoScroll';
export { useWebSocketMessage, type WebSocketMessage, type MessageHandler } from './hooks/useWebSocketMessage';
export { useWebSocketAudio, type WebSocketAudioState, type WebSocketAudioOptions, type AudioChunk } from './hooks/useWebSocketAudio';
export { useCopyToClipboard } from './hooks/useCopyToClipboard';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useDebounce } from './hooks/useDebounce';
export { useTaskEventProcessor } from './hooks/useTaskEventProcessor';
export { 
    useMetaMemoryProcessor, 
    useMetaCognitionProcessor
} from './hooks/useMetaEventProcessors';
export { 
    useCustomEventProcessor,
    useMultipleCustomEventProcessors,
    useImageGallery,
    useDesignIterations,
    type UseCustomEventProcessorReturn
} from './hooks/useCustomEventProcessor';
export { useTaskState, type TaskState } from './hooks/useTaskState';

// Utilities (browser-safe only)
export * from './utils/formatters';
export * from './utils/codeGenerators';

// Import styles
import './components/style.scss';