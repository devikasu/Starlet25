// File export utilities for extracted text

export interface ExportOptions {
  format: 'txt' | 'json' | 'md';
  includeMetadata?: boolean;
  includeProcessed?: boolean;
}

export interface ExportData {
  text: string;
  url: string;
  title: string;
  timestamp: number;
  processed?: any;
}

export interface Summary {
  text: string;
  keyPoints: string[];
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  type: 'definition' | 'concept' | 'fact' | 'process';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export function exportText(data: ExportData, options: ExportOptions): string {
  switch (options.format) {
    case 'txt':
      return exportAsText(data, options);
    case 'json':
      return exportAsJson(data, options);
    case 'md':
      return exportAsMarkdown(data, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

function exportAsText(data: ExportData, options: ExportOptions): string {
  let content = '';
  
  if (options.includeMetadata) {
    content += `Title: ${data.title}\n`;
    content += `URL: ${data.url}\n`;
    content += `Extracted: ${new Date(data.timestamp).toISOString()}\n`;
    content += '\n'.repeat(2);
  }
  
  content += data.text;
  
  if (options.includeProcessed && data.processed) {
    content += '\n\n---\n\n';
    content += `Word Count: ${data.processed.wordCount}\n`;
    content += `Character Count: ${data.processed.characterCount}\n`;
    content += `Reading Time: ${data.processed.estimatedReadingTime} minutes\n`;
    content += `Language: ${data.processed.language}\n`;
    if (data.processed.keywords.length > 0) {
      content += `Keywords: ${data.processed.keywords.join(', ')}\n`;
    }
  }
  
  return content;
}

function exportAsJson(data: ExportData, options: ExportOptions): string {
  const exportData: any = {
    text: data.text,
    url: data.url,
    title: data.title,
    timestamp: data.timestamp
  };
  
  if (options.includeProcessed && data.processed) {
    exportData.processed = data.processed;
  }
  
  return JSON.stringify(exportData, null, 2);
}

function exportAsMarkdown(data: ExportData, options: ExportOptions): string {
  let content = '';
  
  if (options.includeMetadata) {
    content += `# ${data.title}\n\n`;
    content += `**Source:** [${data.url}](${data.url})\n\n`;
    content += `**Extracted:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
    content += '---\n\n';
  }
  
  // Convert text to markdown (basic conversion)
  const markdownText = data.text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return '';
      if (trimmed.length < 50 && !trimmed.includes('.')) return `## ${trimmed}`;
      return trimmed;
    })
    .filter(line => line.length > 0)
    .join('\n\n');
  
  content += markdownText;
  
  if (options.includeProcessed && data.processed) {
    content += '\n\n---\n\n';
    content += '## Text Analysis\n\n';
    content += `- **Word Count:** ${data.processed.wordCount}\n`;
    content += `- **Character Count:** ${data.processed.characterCount}\n`;
    content += `- **Reading Time:** ${data.processed.estimatedReadingTime} minutes\n`;
    content += `- **Language:** ${data.processed.language.toUpperCase()}\n`;
    if (data.processed.hasCode) content += '- **Contains Code**\n';
    if (data.processed.hasLinks) content += '- **Contains Links**\n';
    if (data.processed.keywords.length > 0) {
      content += `- **Keywords:** ${data.processed.keywords.join(', ')}\n`;
    }
  }
  
  return content;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFilename(title: string, format: string): string {
  const sanitizedTitle = title
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
  
  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitizedTitle}_${timestamp}.${format}`;
}

export function downloadAsTxt(summary: Summary, flashcards: Flashcard[], title: string = 'Study Material'): void {
  let content = '';
  
  // Header
  content += `${title}\n`;
  content += '='.repeat(title.length) + '\n\n';
  
  // Summary section
  content += 'SUMMARY\n';
  content += '-'.repeat(8) + '\n';
  content += summary.text + '\n\n';
  
  // Key points
  if (summary.keyPoints.length > 0) {
    content += 'KEY POINTS:\n';
    summary.keyPoints.forEach((point, index) => {
      content += `${index + 1}. ${point}\n`;
    });
    content += '\n';
  }
  
  // Topics and metadata
  content += `Topics: ${summary.topics.join(', ')}\n`;
  content += `Difficulty: ${summary.difficulty}\n`;
  content += `Confidence: ${Math.round(summary.confidence * 100)}%\n\n`;
  
  // Flashcards section
  content += 'FLASHCARDS\n';
  content += '-'.repeat(11) + '\n\n';
  
  flashcards.forEach((card, index) => {
    content += `Card ${index + 1} (${card.type.toUpperCase()})\n`;
    content += `Difficulty: ${card.difficulty}\n`;
    if (card.tags.length > 0) {
      content += `Tags: ${card.tags.join(', ')}\n`;
    }
    content += `\nQ: ${card.question}\n`;
    content += `A: ${card.answer}\n`;
    content += '\n' + '-'.repeat(40) + '\n\n';
  });
  
  // Footer
  content += `Generated on: ${new Date().toLocaleString()}\n`;
  content += `Total flashcards: ${flashcards.length}\n`;
  
  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
