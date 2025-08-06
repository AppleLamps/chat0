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
            {message.parts.map((part, index) => {
              const key = `message-${message.id}-part-${index}`;
              const appPart = part as AppUIPart;

              if (appPart.type === 'text' && appPart.text) {
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
                  <p key={key}>{appPart.text}</p>
                );
              }

              if (appPart.type === 'image_url' && 'image_url' in appPart) {
                return <img key={key} src={appPart.image_url.url} alt="User attachment" className="rounded-lg max-w-full h-auto" />;
              }
              
              if (appPart.type === 'file' && 'file' in appPart) {
                 return <div key={key} className="text-sm">Attached File: {appPart.file.filename}</div>;
              }
              
              if (appPart.type === 'input_audio' && 'input_audio' in appPart) {
                return <div key={key} className="text-sm">Attached Audio</div>;
              }
              
              return null;
            })}
          </div>
          {mode === 'view' && (
            <div className="px-4 pb-2">
              <MessageControls
                threadId={threadId}
                content={message.parts.find(p => p.type === 'text')?.text || ''}
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
            
            if (appPart.type === 'text' && appPart.text) {
              return <MarkdownRenderer key={key} content={appPart.text} id={message.id} />;
            }

            // Assistant attachments (if any) would be rendered here
            if (appPart.type === 'image_url' && 'image_url' in appPart) {
                return <img key={key} src={appPart.image_url.url} alt="Assistant attachment" className="rounded-lg max-w-full h-auto" />;
            }

            return null;
          })}
          {!isStreaming && (
            <MessageControls
              threadId={threadId}
              content={message.parts.find(p => p.type === 'text')?.text || ''}
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
