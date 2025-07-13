# Infinite - AI-Powered Document Creation Platform

An intelligent document creation platform that leverages OpenAI's file API to generate comprehensive learning content from uploaded documents and prompts.

## 🚀 Features

### 📁 Unified File Upload & Content Creation
- **Seamless Integration**: Single interface for file uploads, prompts, or both
- **Smart File Processing**: PDFs, DOCs, TXT files analyzed with OpenAI's latest file input API
- **Auto-generated Titles**: Intelligent title generation from file names or prompt content
- **Drag & Drop Interface**: Modern, intuitive file upload with real-time feedback

### 🤖 Advanced AI Content Generation
- **Multi-modal Analysis**: Process text and visual elements from PDF pages
- **File + Prompt Combination**: Upload files and add specific focus areas or questions
- **Fallback Processing**: Graceful handling when AI services are unavailable
- **Rich Formatting**: Generated content includes diagrams, callouts, and interactive elements

### 📝 Dynamic Document Management
- **Real-time Editing**: Block-based and full-text editing modes with live preview
- **Interactive Components**: Embedded diagrams, image galleries, toggles, and page cards
- **Version Control**: Automatic saving and change tracking
- **Cloud Storage**: Firebase integration with offline support

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Firebase project (for data storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd infinite
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_config
# ... other Firebase config variables
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage

### Unified Page Creation

The new unified interface supports three content creation modes seamlessly:

#### 1. **Files Only** - Upload and Analyze
1. Navigate to `/new` in the application
2. Drag and drop files (PDFs, DOCs, etc.) into the upload area
3. Click "Create Page" - AI automatically analyzes files and generates content
4. Title is auto-generated from file names

#### 2. **Prompt Only** - Traditional AI Generation  
1. Navigate to `/new` in the application
2. Enter your learning prompt in the text area
3. Click "Create Page" - AI generates content based on prompt
4. Title is auto-generated from prompt content

#### 3. **Files + Prompt** - Combined Analysis
1. Upload files to analyze
2. Add specific instructions or focus areas in the prompt
3. AI analyzes files with your specific requirements
4. Creates enhanced content combining file analysis with prompt guidance

### Smart Features
- **Auto-generated Titles**: No manual title entry needed
- **Dynamic Placeholders**: Interface adapts based on whether files are uploaded
- **Quick Templates**: Pre-built prompts for common use cases (hidden when files are uploaded)
- **Real-time Preview**: See title preview as you type or upload files

### File Support & Processing
- **Supported Types**: PDF, DOC, DOCX, TXT, and more
- **Size Limits**: 32MB per file, up to 5 files per page  
- **AI Processing**: Uses OpenAI's file input API for optimal analysis
- **Automatic Upload**: Files uploaded to OpenAI Files API automatically
- **Fallback Support**: Base64 processing if OpenAI upload fails

## 🏗️ Architecture

### Frontend Components
- **FileUpload.tsx**: Drag-and-drop file upload with validation
- **CreatePageWithFiles.tsx**: Main page creation interface
- **BlockBasedEditor.tsx**: Interactive content editing system

### API Routes
- **`/api/upload-file`**: Handles file uploads to various storage methods
- **`/api/process-files`**: Processes files with OpenAI and generates content

### AI Integration
Uses OpenAI's responses API with file input support:
```typescript
const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [{
        role: 'user',
        content: [
            { type: 'input_file', file_id: 'file-abc123' },
            { type: 'input_text', text: 'Analyze this document...' }
        ]
    }]
});
```

## 📚 Documentation

- [File Upload System Documentation](docs/FILE_UPLOAD_SYSTEM.md)
- [Block-Based Editor Guide](docs/BLOCK_BASED_EDITOR.md)
- [AI Content Generation](docs/AI_CONTENT_GENERATION.md)

## 🛠️ Development

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **AI**: OpenAI GPT-4o with file inputs
- **File Handling**: react-dropzone
- **Markdown**: MDX with syntax highlighting

### Key Dependencies
```json
{
  "next": "^15.3.4",
  "openai": "^4.0.0",
  "react-dropzone": "^14.0.0",
  "firebase": "^10.0.0",
  "next-mdx-remote": "^5.0.0"
}
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
