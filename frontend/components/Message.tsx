import { memo, useState } from 'react';
import MarkdownRenderer from '@/frontend/components/MemoizedMarkdown';
import { cn } from '@/lib/utils';
import { UIMessage } from 'ai';
import { AppUIPart } from '@/frontend/types/ai';
import equal from 'fast-deep-equal';
import MessageControls from './MessageControls';
import { UseChatHelpers } from '@ai-sdk/react';
import MessageEditor from './MessageEditor';
import MessageReasoning from './MessageReasoning';

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers['stop'];
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <div
      role="article"
      className={cn(
        'flex flex-col',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}
    >
      {message.role === 'user' ? (
        <div
          className="relative group rounded-xl max-w-[80%]"
          ref={(el) => registerRef(message.id, el)}
        >
          <div className="flex flex-col gap-2 p-4 bg-secondary border border-secondary-foreground/2 rounded-xl">
            {/* Use displayContent if available, otherwise render parts */}
            {(message as any).displayContent ? (
              mode === 'edit' ? (
                <MessageEditor
                  key={`message-${message.id}-display`}
                  threadId={threadId}
                  message={message}
                  content={(message.parts.find(p => p.type === 'text' && !(p as any).hidden && 'text' in p) as any)?.text || ''}
                  setMessages={setMessages}
                  reload={reload}
                  setMode={setMode}
                  stop={stop}
                />
              ) : (
                <p>{(message as any).displayContent}</p>
              )
            ) : (
              <>
                {/* Render visible text content */}
                {message.parts.filter(part => !(part as any).hidden && part.type === 'text').map((part, index) => {
                  const key = `message-${message.id}-text-${index}`;
                  const appPart = part as AppUIPart;

                  if (appPart.type === 'text' && 'text' in appPart && appPart.text) {
                    return mode === 'edit' ? (
                      <MessageEditor
                        key={key}
                        threadId={threadId}
                        message={message}
                        content={appPart.text}
                        setMessages={setMessages}
                        reload={reload}
                        setMode={setMode}
                        stop={stop}
                      />
                    ) : (
                      <MarkdownRenderer key={key} content={appPart.text} id={message.id} />
                    );
                  }
                  return null;
                })}
                
                {/* Render attachment previews like in input bar */}
                {(message.parts.some(part => 
                  (part as any).hidden === true || 
                  (part as any).type === 'image_url' || 
                  (part as any).type === 'input_audio'
                ) || (message as any).displayContent?.includes('📎')) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Handle attachments from parts array */}
                    {message.parts.map((part, index) => {
                      const key = `message-${message.id}-preview-${index}`;
                      const appPart = part as AppUIPart;
                      
                      // Show preview for ALL file types (hidden text files)
                      if ((part as any).hidden === true && appPart.type === 'text') {
                        // Extract filename from the hidden text content
                        const match = 'text' in appPart ? appPart.text?.match(/\[File: ([^\]]+)\]/) : null;
                        const filename = match ? match[1] : 'Text File';
                        
                        return (
                          <div key={key} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              {filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">🖼️</span>
                                </div>
                              ) : filename.match(/\.(txt|md)$/i) ? (
                                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">📄</span>
                                </div>
                              ) : filename.match(/\.(pdf)$/i) ? (
                                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">📕</span>
                                </div>
                              ) : filename.match(/\.(mp3|wav|m4a|ogg)$/i) ? (
                                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">🎵</span>
                                </div>
                              ) : filename.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt)$/i) ? (
                                <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">💻</span>
                                </div>
                              ) : filename.match(/\.(json|xml|yaml|yml|csv|sql)$/i) ? (
                                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">📊</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-900/30 rounded flex items-center justify-center">
                                  <span className="text-xs">📎</span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate max-w-[200px]">
                                  {filename}
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Image' : 
                                   filename.match(/\.(txt|md)$/i) ? 'Text' :
                                   filename.match(/\.(pdf)$/i) ? 'PDF' :
                                   filename.match(/\.(mp3|wav|m4a|ogg)$/i) ? 'Audio' :
                                   filename.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt)$/i) ? 'Code' :
                                   filename.match(/\.(json|xml|yaml|yml|csv|sql)$/i) ? 'Data' : 'File'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Show preview for ALL image types
                      if ((appPart as any).type === 'image_url' && 'image_url' in appPart) {
                        return (
                          <div key={key} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                <span className="text-xs">🖼️</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  Image
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  Image
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Show preview for ALL audio types
                      if ((appPart as any).type === 'input_audio' && 'input_audio' in appPart) {
                        return (
                          <div key={key} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                <span className="text-xs">🎵</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  Audio Input
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  Audio
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                    
                    {/* Handle attachments from displayContent (for newly sent messages) */}
                    {(message as any).displayContent?.includes('📎') && (
                      (() => {
                        const displayContent = (message as any).displayContent || '';
                        const attachmentMatch = displayContent.match(/📎 (.+)$/);
                        if (attachmentMatch) {
                          const filename = attachmentMatch[1];
                          const key = `message-${message.id}-display-attachment`;
                          
                          return (
                            <div key={key} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                {filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">🖼️</span>
                                  </div>
                                ) : filename.match(/\.(txt|md)$/i) ? (
                                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">📄</span>
                                  </div>
                                ) : filename.match(/\.(pdf)$/i) ? (
                                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">📕</span>
                                  </div>
                                ) : filename.match(/\.(mp3|wav|m4a|ogg)$/i) ? (
                                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">🎵</span>
                                  </div>
                                ) : filename.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt)$/i) ? (
                                  <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">💻</span>
                                  </div>
                                ) : filename.match(/\.(json|xml|yaml|yml|csv|sql)$/i) ? (
                                  <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">📊</span>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-900/30 rounded flex items-center justify-center">
                                    <span className="text-xs">📎</span>
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate max-w-[200px]">
                                    {filename}
                                  </span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    {filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Image' : 
                                     filename.match(/\.(txt|md)$/i) ? 'Text' :
                                     filename.match(/\.(pdf)$/i) ? 'PDF' :
                                     filename.match(/\.(mp3|wav|m4a|ogg)$/i) ? 'Audio' :
                                     filename.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt)$/i) ? 'Code' :
                                     filename.match(/\.(json|xml|yaml|yml|csv|sql)$/i) ? 'Data' : 'File'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                )}
                

              </>
            )}
          </div>
          {mode === 'view' && (
            <div className="px-4 pb-2">
              <MessageControls
                threadId={threadId}
                content={(message.parts.find(p => p.type === 'text' && 'text' in p) as any)?.text || ''}
                message={message}
                setMode={setMode}
                setMessages={setMessages}
                reload={reload}
                stop={stop}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="group flex flex-col gap-2 w-full">
          {message.parts.map((part, index) => {
            const key = `message-${message.id}-part-${index}`;
            const appPart = part as AppUIPart;

            if (appPart.type === 'reasoning' && 'reasoning' in appPart) {
              return <MessageReasoning key={key} reasoning={appPart.reasoning} id={message.id} />;
            }
            
            if (appPart.type === 'text' && 'text' in appPart && appPart.text) {
              return <MarkdownRenderer key={key} content={appPart.text} id={message.id} />;
            }

            // Assistant attachments (if any) would be rendered here
            if ((appPart as any).type === 'image_url' && 'image_url' in appPart) {
                return <img key={key} src={(appPart as any).image_url.url} alt="Assistant attachment" className="rounded-lg max-w-full h-auto" />;
            }

            return null;
          })}
          {!isStreaming && (
            <MessageControls
              threadId={threadId}
              content={(message.parts.find(p => p.type === 'text' && 'text' in p) as any)?.text || ''}
              message={message}
              setMessages={setMessages}
              reload={reload}
              stop={stop}
            />
          )}
        </div>
      )}
    </div>
  );
}

const PreviewMessage = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  return true;
});

PreviewMessage.displayName = 'PreviewMessage';

export default PreviewMessage;
