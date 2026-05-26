import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { User, SearchUser } from "@/types/chat";

interface UserListItemProps {
  user: User | SearchUser;
  isSelected?: boolean;
  isOnline: boolean;
  unreadCount?: number;
  onSelect: (user: User) => void;
  onAddFriend?: (id: string) => void;
  isSearchMode?: boolean;
}

export function UserListItem({
  user,
  isSelected,
  isOnline,
  unreadCount = 0,
  onSelect,
  onAddFriend,
  isSearchMode = false,
}: UserListItemProps) {
  const formatLastSeen = (date?: string) => {
    if (!date) return "Offline";
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFriend = "isFriend" in user ? user.isFriend : true;

  return (
    <div
      onClick={() => isFriend && onSelect(user)}
      className={`group flex items-center gap-3 p-2 mx-2 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-discord-active text-discord-text-bright"
          : "hover:bg-discord-hover text-discord-text"
      } ${!isFriend && !isSearchMode ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="relative flex-shrink-0">
        {user.profilePic ? (
          <Image
            src={user.profilePic}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
            alt={user.username}
          />
        ) : (
          <div
            className={`rounded-full flex items-center justify-center w-10 h-10 ${
              isSelected ? "bg-discord-brand" : "bg-discord-sidebar border border-discord-dark"
            }`}
          >
            <UserIcon size={24} className="text-discord-text-muted" />
          </div>
        )}
        
        {/* Online Indicator */}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-bg ${
            isOnline ? "bg-discord-success" : "bg-gray-500"
          }`}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <p
            className={`font-medium truncate ${
              isSelected || unreadCount > 0 ? "text-discord-text-bright" : "text-discord-text"
            }`}
          >
            {user.username}
          </p>
          {unreadCount > 0 && (
            <span className="bg-discord-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-xs text-discord-text-muted truncate">
            {isSearchMode && "email" in user ? (
              user.email
            ) : user.chats && user.chats[0] ? (
              user.chats[0].content
            ) : isOnline ? (
              "Active now"
            ) : (
              `Last seen ${formatLastSeen(user.lastSeen)}`
            )}
          </p>
        </div>
      </div>

      {isSearchMode && !isFriend && onAddFriend && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddFriend(user.id);
          }}
          className="ml-2 bg-discord-brand hover:bg-discord-brand-hover text-white text-xs px-3 py-1.5 rounded-sm transition-colors flex-shrink-0"
        >
          Add
        </button>
      )}
      
      {isSearchMode && isFriend && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(user);
          }}
          className="ml-2 border border-discord-brand text-discord-text-bright hover:bg-discord-brand hover:bg-opacity-20 text-xs px-3 py-1.5 rounded-sm transition-colors flex-shrink-0"
        >
          Chat
        </button>
      )}
    </div>
  );
}
