# Starlet25 - Chrome Extension

A Chrome extension that extracts main page text while avoiding navigation elements, footers, and sidebars, then generates summaries and flashcards for learning.

## Features

- **Smart Text Extraction**: Automatically identifies and extracts main content from web pages
- **Navigation Filtering**: Avoids navbars, footers, sidebars, ads, and other non-content elements
- **Multiple Content Sources**: Prioritizes semantic HTML elements (main, article) with fallback to largest text container
- **Real-time Updates**: Monitors page changes for Single Page Applications (SPAs)
- **Text Processing**: Analyzes content with word count, reading time, language detection, and keyword extraction
- **AI-Powered Summarization**: Generates intelligent summaries with key points and topic identification
- **Flashcard Generation**: Creates interactive flashcards for learning (definition, concept, fact, process types)
- **Text Storage**: Stores extracted text with metadata (URL, title, timestamp)
- **Copy to Clipboard**: Easy copying of extracted text
- **Export Capabilities**: Save content in TXT, JSON, or Markdown formats
- **Clean UI**: Modern, responsive popup interface with interactive flashcard viewer

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Starlet25
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the build output

## Usage

1. **Automatic Extraction**: The extension automatically extracts text when you visit a webpage
2. **Manual Extraction**: Click the extension icon and press "Extract Current Page"
3. **View Summaries**: See AI-generated summaries with key points and difficulty assessment
4. **Study Flashcards**: Click "View Flashcards" to study generated learning cards
5. **View History**: See recently extracted texts with summaries and flashcard counts
6. **Copy Text**: Click "Copy" on any extracted text to copy it to clipboard
7. **Clear History**: Use "Clear All" to remove stored texts

## How It Works

### Content Script (`src/content/contentScript.ts`)
- Runs on every webpage
- Identifies main content using semantic HTML elements
- Removes navigation, ads, and other non-content elements
- Sends extracted text to background script
- Monitors page changes for SPAs

### Background Script (`src/background/background.ts`)
- Receives extracted text from content scripts
- Processes text with analytics (word count, reading time, etc.)
- Generates summaries and flashcards using offline AI logic
- Stores text in Chrome's local storage
- Manages communication between content scripts and popup

### Text Processor (`src/utils/textProcessor.ts`)
- Analyzes extracted text for statistics
- Detects language, code blocks, and links
- Extracts keywords and generates reading time estimates
- Provides formatting utilities

### Summarizer (`src/utils/summarizer.ts`)
- Generates intelligent summaries from extracted text
- Identifies topics and assesses content difficulty
- Creates flashcards of different types:
  - **Definition cards**: Technical term explanations
  - **Concept cards**: Conceptual understanding questions
  - **Fact cards**: Factual information recall
  - **Process cards**: Step-by-step procedure questions
- Uses offline logic with technical term recognition

### Popup (`src/popup/popup.tsx`)
- React-based user interface
- Displays current page text, summaries, and extraction history
- Provides manual extraction controls
- Shows flashcard counts and allows launching flashcard viewer

### Flashcard Viewer (`src/components/FlashcardViewer.tsx`)
- Interactive flashcard study interface
- Question/answer flip functionality
- Progress tracking with visual indicators
- Difficulty and type color coding
- Navigation between cards

## Text Extraction Strategy

1. **Priority Elements**: Looks for semantic HTML elements in order:
   - `<main>`
   - `<article>`
   - `[role="main"]`
   - `.main-content`, `.content`, `.post-content`, etc.

2. **Fallback**: If no semantic elements found, identifies the largest text container

3. **Filtering**: Removes common non-content elements:
   - Navigation: `nav`, `.nav`, `.navbar`, `[role="navigation"]`
   - Headers/Footers: `header`, `footer`, `.header`, `.footer`
   - Sidebars: `aside`, `.sidebar`
   - Ads: `.ad`, `.advertisement`, `.ads`
   - Social: `.social-share`, `.share-buttons`
   - Comments: `.comments`, `.comment-section`
   - And many more...

4. **Text Cleaning**: Removes extra whitespace and short navigation lines

## Summarization & Flashcard Features

### Summary Generation
- **Intelligent Summaries**: Extracts key sentences and generates coherent summaries
- **Topic Identification**: Automatically detects programming, APIs, databases, frameworks, etc.
- **Difficulty Assessment**: Rates content as easy, medium, or hard based on complexity
- **Confidence Scoring**: Provides confidence levels for generated summaries
- **Key Points Extraction**: Identifies and lists important concepts

### Flashcard Types
- **Definition Cards**: "What is [technical term]?" with contextual definitions
- **Concept Cards**: "Explain the concept of [concept]" with detailed explanations
- **Fact Cards**: "What is [fact]?" for factual information recall
- **Process Cards**: "What are the steps to [process]?" for procedural learning

### Technical Term Recognition
Recognizes 50+ technical terms including:
- Programming concepts: function, class, method, object, array, string
- Development tools: API, database, framework, library, module
- Software concepts: authentication, encryption, caching, scaling
- And many more...

## Development

### Project Structure
```
Starlet25/
├── src/
│   ├── content/
│   │   └── contentScript.ts    # Content script for text extraction
│   ├── background/
│   │   └── background.ts       # Background script for processing
│   ├── popup/
│   │   └── popup.tsx          # React popup component
│   ├── components/
│   │   └── FlashcardViewer.tsx # Interactive flashcard component
│   ├── utils/
│   │   ├── textProcessor.ts    # Text analysis and processing
│   │   ├── summarizer.ts       # Summary and flashcard generation
│   │   └── fileExport.ts       # Export utilities
│   ├── main.tsx               # React entry point
│   └── index.css              # Tailwind CSS
├── public/
│   └── icon.png               # Extension icon
├── manifest.json              # Chrome extension manifest
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite build configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build extension for production
- `npm run preview` - Preview built extension

### Technologies Used
- **TypeScript** - Type-safe JavaScript
- **React** - User interface framework
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool
- **Chrome Extension APIs** - Browser extension functionality

## Permissions

- `activeTab` - Access to current tab for text extraction
- `storage` - Store extracted text locally

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## Future Enhancements

- **GPT API Integration**: Upgrade to OpenAI GPT for more sophisticated summarization
- **Spaced Repetition**: Implement spaced repetition algorithm for flashcards
- **Export to Anki**: Direct export to Anki flashcard software
- **Voice Reading**: Text-to-speech for extracted content
- **Collaborative Learning**: Share flashcards and summaries with others

## License

MIT License