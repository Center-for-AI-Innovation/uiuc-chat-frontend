// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    serviceURI: string
    grammars: SpeechGrammarList
    
    start(): void
    stop(): void
    abort(): void
    
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  }

  const SpeechRecognition: {
    prototype: SpeechRecognition
    new(): SpeechRecognition
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
    readonly interpretation: any
    readonly emma: Document
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly length: number
    readonly isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
  }

  interface SpeechGrammarList {
    readonly length: number
    item(index: number): SpeechGrammar
    [index: number]: SpeechGrammar
    addFromURI(src: string, weight?: number): void
    addFromString(string: string, weight?: number): void
  }

  interface SpeechGrammar {
    src: string
    weight: number
  }
}

export {}
