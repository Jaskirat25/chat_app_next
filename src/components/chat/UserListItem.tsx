import Image from "next/image";
import { Mic, User as UserIcon, Loader2, Check } from "lucide-react";
import { User, SearchUser } from "@/types/chat";

interface UserListItemProps {
  user: User | SearchUser;
  isSelected?: boolean;
  isOnline: boolean;
  unreadCount?: number;
  onSelect: (user: User) => void;
  onAddFriend?: (id: string) => void;
  isSearchMode?: boolean;
  isAddingFriend?: boolean;
  addFriendSuccess?: boolean;
  addFriendError?: string;
}

export function UserListItem({
  user,
  isSelected,
  isOnline,
  unreadCount = 0,
  onSelect,
  onAddFriend,
  isSearchMode = false,
  isAddingFriend = false,
  addFriendSuccess = false,
  addFriendError,
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
      className={`group flex cursor-pointer items-center gap-3 border-b border-white/[0.08] px-2 py-3 transition-all last:border-b-0 ${
        isSelected
          ? "rounded-2xl bg-white/[0.14] text-white shadow-[0_12px_34px_rgba(0,0,0,0.2)]"
          : "text-white/82 hover:rounded-2xl hover:bg-white/[0.08] hover:shadow-[0_0_28px_rgba(255,255,255,0.08)]"
      } ${!isFriend && !isSearchMode ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="relative flex-shrink-0">
        {user.profilePic ? (
          <Image
            src={user.profilePic}
            width={40}
            height={40}
            className="h-11 w-11 rounded-full object-cover ring-1 ring-white/20"
            alt={user.username}
          />
        ) : (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              isSelected
                ? "bg-[#4CD964]/85 text-black"
                : "border border-white/15 bg-white/10"
            }`}
          >
            <UserIcon
              size={22}
              className={isSelected ? "text-black" : "text-white/58"}
            />
          </div>
        )}
        
        {/* Online Indicator */}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-bg ${
            isOnline ? "bg-[#4CD964]" : "bg-white/30"
          }`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`truncate text-sm font-semibold ${
              isSelected || unreadCount > 0 ? "text-white" : "text-white/86"
            }`}
          >
            {user.username}
          </p>
          <span className="shrink-0 text-[10px] font-medium text-white/38">
            {user.chats?.[0]?.createdAt
              ? new Date(user.chats[0].createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : isOnline
              ? "Now"
              : ""}
          </span>
        </div>
        
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs leading-5 text-white/48">
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
          <div className="flex shrink-0 items-center gap-1.5">
            {unreadCount > 0 && (
              <span className="min-w-5 rounded-full bg-[#4CD964] px-1.5 py-0.5 text-center text-[10px] font-bold text-black">
                {unreadCount}
              </span>
            )}
            <Mic size={13} className="text-white/34 transition-colors group-hover:text-white/65" />
          </div>
        </div>
      </div>

      {isSearchMode && onAddFriend && (
        <>
          {addFriendSuccess ? (
            // Success state — shown for 2000ms after successful add
            <button
              disabled
              className="ml-2 flex-shrink-0 rounded-full bg-[#4CD964]/30 px-3 py-1.5 text-xs font-semibold text-[#4CD964] cursor-default"
              aria-label="Friend added"
            >
              <Check size={12} />
            </button>
          ) : !isFriend ? (
            // Add button — loading, error, or default state
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAddingFriend) onAddFriend(user.id);
              }}
              disabled={isAddingFriend}
              className={`ml-2 flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                isAddingFriend
                  ? "bg-white/20 text-white/50 cursor-not-allowed"
                  : addFriendError
                  ? "bg-red-500/80 text-white hover:bg-red-500"
                  : "bg-[#4CD964] text-black hover:bg-[#39c856]"
              }`}
              aria-label={isAddingFriend ? "Adding friend..." : addFriendError ? "Retry adding friend" : "Add friend"}
            >
              {isAddingFriend ? (
                <Loader2 size={12} className="animate-spin" />
              ) : addFriendError ? (
                "Retry"
              ) : (
                "Add"
              )}
            </button>
          ) : (
            // Chat button — already friends
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(user);
              }}
              className="ml-2 flex-shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Chat
            </button>
          )}
        </>
      )}
    </div>
  );
}
