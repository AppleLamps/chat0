import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarFooter,
  SidebarTrigger,
} from '@/frontend/components/ui/sidebar';
import { Button, buttonVariants } from './ui/button';
import { deleteThread, getThreads } from '@/frontend/dexie/queries';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useEffect } from 'react';

export default function ChatSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const threads = useLiveQuery(() => getThreads(), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        navigate('/chat');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Sidebar>
      <div className="flex flex-col h-full p-2">
        <Header />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads === undefined ? (
                  // Show skeleton loading while threads are being fetched
                  Array.from({ length: 6 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))
                ) : (
                  threads.map((thread) => {
                    return (
                      <SidebarMenuItem key={thread.id}>
                        <div
                          className={cn(
                            'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-secondary',
                            id === thread.id && 'bg-secondary'
                          )}
                          onClick={() => {
                            if (id === thread.id) {
                              return;
                            }
                            navigate(`/chat/${thread.id}`);
                          }}
                        >
                          <span className="truncate block">{thread.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hidden group-hover/thread:flex ml-auto h-7 w-7"
                            onClick={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              await deleteThread(thread.id);
                              navigate(`/chat`);
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Footer />
      </div>
    </Sidebar>
  );
}

function PureHeader() {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <SidebarTrigger className="absolute right-1 top-2.5" />
      <h1 className="text-2xl font-bold">
        Chat<span className="">0</span>
      </h1>
      <Link
        to="/chat"
        className={buttonVariants({
          variant: 'default',
          className: 'w-full',
        })}
      >
        New Chat
      </Link>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);

const PureFooter = () => {
  const { id: chatId } = useParams();

  return (
    <SidebarFooter>
      <Link
        to={{
          pathname: "/settings",
          search: chatId ? `?from=${encodeURIComponent(chatId)}` : "",
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        Settings
      </Link>
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
