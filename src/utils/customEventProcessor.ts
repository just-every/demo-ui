/**
 * Generic custom event processor for task-specific data
 * Allows tasks to define their own event types and collect custom data
 */

export interface CustomEvent<T = any> {
    type: string;
    subtype?: string;
    data: T;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface CustomEventProcessorOptions<T = any> {
    // Event type to track (e.g., 'design_event', 'image_generated')
    eventType: string;
    // Optional subtypes to filter (e.g., ['thumbnail', 'full_size'])
    subtypes?: string[];
    // Max events to keep in history (0 = unlimited)
    maxHistory?: number;
    // Custom reducer to process events into state
    reducer?: (state: T, event: CustomEvent) => T;
    // Initial state
    initialState?: T;
}

export class CustomEventProcessor<T = any> {
    private eventType: string;
    private subtypes?: string[];
    private maxHistory: number;
    private events: CustomEvent[] = [];
    private state: T;
    private reducer?: (state: T, event: CustomEvent) => T;
    private latestBySubtype: Map<string, CustomEvent> = new Map();

    constructor(options: CustomEventProcessorOptions<T>) {
        this.eventType = options.eventType;
        this.subtypes = options.subtypes;
        this.maxHistory = options.maxHistory || 0;
        this.reducer = options.reducer;
        this.state = options.initialState || ({} as T);
    }

    /**
     * Process a custom event
     */
    processEvent(event: CustomEvent): {
        state: T;
        events: CustomEvent[];
        latest: CustomEvent | null;
        latestBySubtype: Map<string, CustomEvent>;
    } {
        // Filter by event type
        if (event.type !== this.eventType) {
            return this.getProcessedData();
        }

        // Filter by subtype if specified
        if (this.subtypes && event.subtype && !this.subtypes.includes(event.subtype)) {
            return this.getProcessedData();
        }

        // Add to history
        this.events.push(event);

        // Maintain max history limit
        if (this.maxHistory > 0 && this.events.length > this.maxHistory) {
            this.events = this.events.slice(-this.maxHistory);
        }

        // Update latest by subtype
        if (event.subtype) {
            this.latestBySubtype.set(event.subtype, event);
        }

        // Apply custom reducer if provided
        if (this.reducer) {
            this.state = this.reducer(this.state, event);
        } else {
            // Default behavior: store latest data
            this.state = event.data as T;
        }

        return this.getProcessedData();
    }

    /**
     * Get all processed data
     */
    getProcessedData() {
        return {
            state: this.state,
            events: [...this.events],
            latest: this.events.length > 0 ? this.events[this.events.length - 1] : null,
            latestBySubtype: new Map(this.latestBySubtype)
        };
    }

    /**
     * Get events filtered by subtype
     */
    getEventsBySubtype(subtype: string): CustomEvent[] {
        return this.events.filter(e => e.subtype === subtype);
    }

    /**
     * Get latest event
     */
    getLatest(): CustomEvent | null {
        return this.events.length > 0 ? this.events[this.events.length - 1] : null;
    }

    /**
     * Get latest event by subtype
     */
    getLatestBySubtype(subtype: string): CustomEvent | null {
        return this.latestBySubtype.get(subtype) || null;
    }

    /**
     * Get current state
     */
    getState(): T {
        return this.state;
    }

    /**
     * Reset the processor
     */
    reset() {
        this.events = [];
        this.latestBySubtype.clear();
        this.state = {} as T;
    }
}

/**
 * Example: Image generation event processor
 */
export interface ImageData {
    url: string;
    prompt: string;
    size?: string;
    style?: string;
}

export function createImageEventProcessor() {
    return new CustomEventProcessor<{
        images: ImageData[];
        latestImage: ImageData | null;
        imagesByPrompt: Map<string, ImageData[]>;
    }>({
        eventType: 'image_generated',
        maxHistory: 100,
        initialState: {
            images: [],
            latestImage: null,
            imagesByPrompt: new Map()
        },
        reducer: (state, event) => {
            const imageData = event.data as ImageData;
            
            // Add to images array
            const images = [...state.images, imageData];
            
            // Group by prompt
            const imagesByPrompt = new Map(state.imagesByPrompt);
            const promptImages = imagesByPrompt.get(imageData.prompt) || [];
            imagesByPrompt.set(imageData.prompt, [...promptImages, imageData]);
            
            return {
                images,
                latestImage: imageData,
                imagesByPrompt
            };
        }
    });
}

/**
 * Example: Design iteration event processor
 */
export interface DesignIterationData {
    version: number;
    description: string;
    imageUrl?: string;
    feedback?: string;
    approved?: boolean;
}

export function createDesignIterationProcessor() {
    return new CustomEventProcessor<{
        iterations: DesignIterationData[];
        currentVersion: number;
        approvedVersion?: DesignIterationData;
    }>({
        eventType: 'design_iteration',
        maxHistory: 50,
        initialState: {
            iterations: [],
            currentVersion: 0
        },
        reducer: (state, event) => {
            const iteration = event.data as DesignIterationData;
            const iterations = [...state.iterations, iteration];
            
            return {
                iterations,
                currentVersion: iteration.version,
                approvedVersion: iteration.approved ? iteration : state.approvedVersion
            };
        }
    });
}

/**
 * Create a custom event processor
 */
export function createCustomEventProcessor<T = any>(options: CustomEventProcessorOptions<T>) {
    return new CustomEventProcessor<T>(options);
}