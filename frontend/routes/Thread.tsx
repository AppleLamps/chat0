import Chat from '@/frontend/components/Chat';
import { useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMessagesByThreadId } from '../dexie/queries';
import { type DBMessage } from '../dexie/db';
import { UIMessage } from 'ai';
import { MessageSkeletonList } from '@/frontend/components/ui/MessageSkeleton';

export default function Thread() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  const messages = useLiveQuery(() => getMessagesByThreadId(id), [id]);

  const convertToUIMessages = (messages?: DBMessage[]) => {
    return messages?.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts as UIMessage['parts'],
      content: message.content || '',
      createdAt: message.createdAt,
    }));
  };

  // Show skeleton loading while messages are being fetched
  if (messages === undefined) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <MessageSkeletonList count={4} />
      </div>
    );
  }

  return (
    <Chat
      key={id}
      threadId={id}
      initialMessages={convertToUIMessages(messages) || []}
    />
  );
}
