import { useLiveQuery } from 'dexie-react-hooks';
import { getMessageSummaries } from '@/frontend/dexie/queries';
import { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

interface MessageNavigatorProps {
  threadId: string;
  scrollToMessage: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

function PureChatNavigator({
  threadId,
  scrollToMessage,
  isVisible,
  onClose,
}: MessageNavigatorProps) {
  const messageSummaries = useLiveQuery(
    () => getMessageSummaries(threadId),
    [threadId]
  );

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed right-0 top-0 h-full w-80 bg-background border-l z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-medium">Chat Navigator</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close navigator"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            <ul className="flex flex-col gap-2 p-4 prose prose-sm dark:prose-invert list-disc pl-5 h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
              {messageSummaries === undefined ? (
                // Show skeleton loading while message summaries are being fetched
                Array.from({ length: 5 }).map((_, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </li>
                ))
              ) : (
                messageSummaries.map((summary) => (
                  <li
                    key={summary.id}
                    onClick={() => {
                      scrollToMessage(summary.messageId);
                    }}
                    className="cursor-pointer hover:text-foreground transition-colors"
                  >
                    {summary.content.slice(0, 100)}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(PureChatNavigator, (prevProps, nextProps) => {
  return (
    prevProps.threadId === nextProps.threadId &&
    prevProps.isVisible === nextProps.isVisible
  );
});
