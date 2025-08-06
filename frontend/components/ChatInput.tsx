import { ChevronDown, Check, ArrowUpIcon, Paperclip, Image } from 'lucide-react';
import { memo, useCallback, useMemo, useState, useRef } from 'react';
import { Textarea } from '@/frontend/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from '@/frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import useAutoResizeTextarea from '@/hooks/useAutoResizeTextArea';
import { UseChatHelpers, useCompletion } from '@ai-sdk/react';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router';
import { createMessage, createThread } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { AI_MODELS, AIModel, getModelConfig } from '@/lib/models';
import KeyPrompt from '@/frontend/components/KeyPrompt';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { StopIcon } from './ui/icons';
import { toast } from 'sonner';
import { useMessageSummary } from '../hooks/useMessageSummary';

interface ChatInputProps {
  threadId: string;
  input: UseChatHelpers['input'];
  status: UseChatHelpers['status'];
  setInput: UseChatHelpers['setInput'];
  append: UseChatHelpers['append'];
  stop: UseChatHelpers['stop'];
  sendMessage?: (message: any, options?: any) => void;
}

interface StopButtonProps {
  stop: UseChatHelpers['stop'];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}


function PureChatInput({
  threadId,
  input,
  status,
  setInput,
  append,
  stop,
}: ChatInputProps) {
  const canChat = useAPIKeyStore((state) => state.hasRequiredKeys());

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });

  const navigate = useNavigate();
  const { id } = useParams();

  // Add attachment state and file input ref
  const [attachment, setAttachment] = useState<{ name: string; data: string; type: 'image' | 'audio' | 'pdf' | 'text' | 'code' | 'data' | 'file'; extractedText?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = useMemo(
    () => (!input.trim() && !attachment) || status === 'streaming' || status === 'submitted',
    [input, status, attachment]
  );

  const { complete } = useMessageSummary();

  // PDF text extraction function
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      // Check if PDF.js is available
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `\n\n--- Page ${i} ---\n${pageText}`;
        }

        return fullText;
      } else {
        throw new Error('PDF.js not loaded');
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return `[Error: Could not extract text from PDF: ${error}]`;
    }
  };

  // Helper function to determine file type based on MIME type and extension
  const determineFileType = (file: File): 'image' | 'audio' | 'pdf' | 'text' | 'code' | 'data' | 'file' => {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('audio/')) {
      return 'audio';
    } else if (file.type === 'application/pdf') {
      return 'pdf';
    } else if (file.type.startsWith('text/')) {
      return 'text';
    } else if (/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt)$/i.test(file.name)) {
      return 'code';
    } else if (/\.(json|xml|yaml|yml|csv|sql)$/i.test(file.name)) {
      return 'data';
    }
    return 'file';
  };

  // Helper function to process attachment based on file type
  const processAttachment = async (file: File, dataUrl: string, fileType: string) => {
    if (file.type === 'application/pdf') {
      const pdfText = await extractPDFText(file);
      return {
        name: file.name,
        data: dataUrl,
        type: fileType as 'pdf',
        extractedText: pdfText
      };
    } else {
      return {
        name: file.name,
        data: dataUrl,
        type: fileType as 'image' | 'audio' | 'pdf' | 'text' | 'code' | 'data' | 'file'
      };
    }
  };

  // Refactored file handling function
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const fileType = determineFileType(file);
        const attachmentData = await processAttachment(file, dataUrl, fileType);
        setAttachment(attachmentData);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  // Helper function to get text file extensions
  const getTextFileExtensions = () => [
    '.txt', '.md', '.json', '.xml', '.csv', '.log', '.yaml', '.yml',
    '.ini', '.conf', '.cfg', '.properties', '.sql', '.sh', '.bat',
    '.ps1', '.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css',
    '.scss', '.sass', '.less', '.php', '.rb', '.go', '.rs', '.java',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.vb', '.swift', '.kt', '.dart',
    '.r', '.m', '.pl', '.lua', '.scala', '.clj', '.hs', '.elm', '.ex',
    '.exs', '.erl', '.f90', '.f95', '.jl', '.nim', '.zig', '.v', '.toml',
    '.dockerfile', '.gitignore', '.gitattributes', '.env', '.editorconfig'
  ];

  // Helper function to check if file is text-based
  const isTextBasedFile = (fileName: string) => {
    const textFileExtensions = getTextFileExtensions();
    return textFileExtensions.some(ext =>
      fileName.toLowerCase().endsWith(ext.toLowerCase())
    ) || !fileName.includes('.'); // Files without extension are often text
  };

  // Helper function to create attachment content
  const createAttachmentContent = (attachment: any) => {
    const content: any[] = [];

    if (attachment.type === 'image') {
      content.push({
        type: 'image_url',
        image_url: { url: attachment.data },
      });
    } else if (attachment.type === 'audio') {
      // OpenRouter expects raw base64 for audio, not a data URL
      const base64_audio = attachment.data.split(',')[1];
      content.push({
        type: 'input_audio',
        input_audio: {
          data: base64_audio,
          format: attachment.name.split('.').pop() || 'wav',
        },
      });
    } else {
      // Handle PDF files with extracted text
      if (attachment.name.toLowerCase().endsWith('.pdf') && attachment.extractedText) {
        content.push({
          type: 'text',
          text: `\n\n[PDF File: ${attachment.name}]\n${attachment.extractedText}`,
          hidden: true,
        });
      } else if (isTextBasedFile(attachment.name)) {
        try {
          // Extract text content from data URL for AI processing
          const base64Content = attachment.data.split(',')[1];
          const textContent = atob(base64Content);
          content.push({
            type: 'text',
            text: `\n\n[File: ${attachment.name}]\n${textContent}`,
            hidden: true,
          });
        } catch (error) {
          console.error('Error reading text file:', error);
        }
      }
    }

    return content;
  };

  // Helper function to build API content from full content
  const buildApiContent = (content: any[]) => {
    return content
      .filter(c => !(c as any).hidden)
      .map((c) => {
        if (c.type === 'text') {
          return { type: 'text', text: (c as any).text };
        }
        if (c.type === 'image_url') {
          return { type: 'image_url', image_url: (c as any).image_url };
        }
        if (c.type === 'input_audio') {
          return { type: 'input_audio', input_audio: (c as any).input_audio };
        }
        return c;
      });
  };

  // Helper function to create UI message
  const createUIMessage = (messageId: string, content: any[], apiContent: any[]) => {
    return {
      id: messageId,
      parts: content.map((c) => ({ ...c })),
      role: 'user' as const,
      content: apiContent as any,
      createdAt: new Date(),
    };
  };

  // Helper function to handle thread creation and completion
  const handleThreadAndCompletion = async (currentInput: string, messageId: string) => {
    if (!id) {
      navigate(`/chat/${threadId}`);
      await createThread(threadId);
      complete(currentInput.trim(), {
        body: { threadId, messageId, isTitle: true },
      });
    } else {
      complete(currentInput.trim(), { body: { messageId, threadId } });
    }
  };

  // Refactored handleSubmit function
  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      (!currentInput.trim() && !attachment) ||
      status === 'streaming' ||
      status === 'submitted'
    )
      return;

    const messageId = uuidv4();
    const content: any[] = [{ type: 'text', text: currentInput.trim() }];

    // Add attachment content if present
    if (attachment) {
      content.push(...createAttachmentContent(attachment));
    }

    // Build API content
    const apiContent = buildApiContent(content);

    // Debug logging for image content
    const hasImage = apiContent.some(c => c.type === 'image_url');
    if (hasImage) {
      console.log('DEBUG: Message contains image, API content:', JSON.stringify(apiContent.map(c => ({
        type: c.type,
        hasImageUrl: c.type === 'image_url' ? !!c.image_url : undefined,
        imageUrlLength: c.type === 'image_url' && c.image_url?.url ? c.image_url.url.length : undefined
      })), null, 2));
    }

    // Create user message
    const userMessage = createUIMessage(messageId, content, apiContent);

    // Handle thread creation and completion
    await handleThreadAndCompletion(currentInput, messageId);

    // Save message and update UI
    await createMessage(threadId, userMessage);
    console.log('DEBUG outgoing', userMessage);
    append(userMessage);
    setInput('');
    setAttachment(null);
    adjustHeight(true);
  }, [
    input,
    status,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
    attachment,
  ]);

  if (!canChat) {
    return <KeyPrompt />;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  return (
    <div className="fixed bottom-0 w-full max-w-3xl px-4 sm:px-0">
      <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full">
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-label="File input for attachments"
          />
          {attachment && (
            <div className="px-4 pt-2 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  {attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                      <span className="text-xs">🖼️</span>
                    </div>
                  ) : attachment.name.match(/\.(txt|md)$/i) ? (
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                      <span className="text-xs">📄</span>
                    </div>
                  ) : attachment.name.match(/\.(pdf)$/i) ? (
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                      <span className="text-xs">📕</span>
                    </div>
                  ) : attachment.name.match(/\.(mp3|wav|m4a|ogg)$/i) ? (
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                      <span className="text-xs">🎵</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-900/30 rounded flex items-center justify-center">
                      <span className="text-xs">📎</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate max-w-[200px]">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Image' :
                        attachment.name.match(/\.(txt|md)$/i) ? 'Text' :
                          attachment.name.match(/\.(pdf)$/i) ? 'PDF' :
                            attachment.name.match(/\.(mp3|wav|m4a|ogg)$/i) ? 'Audio' : 'File'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachment(null)}
                  className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                  aria-label="Remove attachment"
                >
                  <span className="text-xs">✕</span>
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-col">
            <div className="bg-secondary overflow-y-auto max-h-[300px]">
              <Textarea
                id="chat-input"
                value={input}
                placeholder="What can I do for you?"
                className={cn(
                  'w-full px-4 py-3 border-none shadow-none dark:bg-transparent',
                  'placeholder:text-muted-foreground resize-none',
                  'focus-visible:ring-0 focus-visible:ring-offset-0',
                  'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30',
                  'scrollbar-thumb-rounded-full',
                  'min-h-[72px]'
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={handleInputChange}
                aria-label="Chat message input"
                aria-describedby="chat-input-description"
              />
              <span id="chat-input-description" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>

            <div className="h-14 flex items-center px-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <ChatModelDropdown />
                  <Button variant="ghost" size="icon" aria-label="Attach file" onClick={() => triggerFileInput('.pdf,.txt,.md,.json,.xml,.csv,.log,.yaml,.yml,.ini,.conf,.cfg,.properties,.sql,.sh,.bat,.ps1,.py,.js,.ts,.jsx,.tsx,.html,.css,.scss,.sass,.less,.php,.rb,.go,.rs,.java,.c,.cpp,.h,.hpp,.cs,.vb,.swift,.kt,.dart,.r,.m,.pl,.lua,.scala,.clj,.hs,.elm,.ex,.exs,.erl,.f90,.f95,.jl,.nim,.zig,.v,.toml,.dockerfile,.gitignore,.gitattributes,.env,.editorconfig')}>
                    <Paperclip size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Attach image" onClick={() => triggerFileInput('image/png,image/jpeg,image/webp,image/gif')}>
                    <Image size={18} />
                  </Button>
                </div>

                {status === 'submitted' || status === 'streaming' ? (
                  <StopButton stop={stop} />
                ) : (
                  <SendButton onSubmit={handleSubmit} disabled={isDisabled} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

const PureChatModelDropdown = () => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const { selectedModel, setModel } = useModelStore();

  const isModelEnabled = useCallback(
    (model: AIModel) => {
      const modelConfig = getModelConfig(model);
      const apiKey = getKey(modelConfig.provider);
      return !!apiKey;
    },
    [getKey]
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1 h-8 pl-2 pr-2 text-xs rounded-md text-foreground hover:bg-primary/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
            aria-label={`Selected model: ${selectedModel}`}
          >
            <div className="flex items-center gap-1">
              {selectedModel}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('min-w-[10rem]', 'border-border', 'bg-popover')}
        >
          {AI_MODELS.map((model) => {
            const isEnabled = isModelEnabled(model);
            return (
              <DropdownMenuItem
                key={model}
                onSelect={() => isEnabled && setModel(model)}
                disabled={!isEnabled}
                className={cn(
                  'flex items-center justify-between gap-2',
                  'cursor-pointer'
                )}
              >
                <span>{model}</span>
                {selectedModel === model && (
                  <Check
                    className="w-4 h-4 text-blue-500"
                    aria-label="Selected"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const ChatModelDropdown = memo(PureChatModelDropdown);

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={stop}
      aria-label="Stop generating response"
    >
      <StopIcon size={20} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

const PureSendButton = ({ onSubmit, disabled }: SendButtonProps) => {
  return (
    <Button
      onClick={onSubmit}
      variant="default"
      size="icon"
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
};

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  return prevProps.disabled === nextProps.disabled;
});

export default ChatInput;
