import { Search, X } from "lucide-react";
import CustomDrawer from "./CustomDrawer";
import { UserListItem } from "./UserListItem";
import { User, SearchUser } from "@/types/chat";
import { useState } from "react";

interface SidebarProps {
  searchText: string;
  setSearchText: (text: string) => void;
  isSearching: boolean;
  searchError: string;
  searchResults: SearchUser[];
  userFriends: User[];
  selectedUser: User | null;
  onlineUsers: string[];
  unreadCounts: Record<string, number>;
  onSearch: () => void;
  onClearSearch: () => void;
  onSelectUser: (user: User) => void;
  onAddFriend: (id: string) => void;
  isHiddenOnMobile?: boolean;
}

export function Sidebar({
  searchText,
  setSearchText,
  isSearching,
  searchError,
  searchResults,
  userFriends,
  selectedUser,
  onlineUsers,
  unreadCounts,
  onSearch,
  onClearSearch,
  onSelectUser,
  onAddFriend,
  isHiddenOnMobile = false,
}: SidebarProps) {
  const [filterUnread, setFilterUnread] = useState(false);
  const isUserOnline = (id: string) => onlineUsers.includes(id);

  const displayedFriends = filterUnread
    ? userFriends.filter((friend) => (unreadCounts[friend.id] || 0) > 0)
    : userFriends;

  return (
    <div
      className={`flex flex-col h-full bg-discord-sidebar w-full md:w-[320px] lg:w-[350px] shrink-0 border-r border-discord-dark ${
        isHiddenOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Header with Search */}
      <div className="p-4 shrink-0 shadow-sm z-10 bg-discord-sidebar">
        <div className="flex items-center gap-3">
          <div className="rounded-full cursor-pointer transition-opacity">
            <CustomDrawer />
          </div>

          <div className="flex-1 bg-discord-dark rounded-md h-9 flex items-center px-3 gap-2 border border-transparent focus-within:border-discord-brand transition-colors">
            <Search size={16} className="text-discord-text-muted" />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              className="flex-1 bg-transparent outline-none text-sm text-discord-text placeholder-discord-text-muted"
            />
            {searchText && (
              <button onClick={onClearSearch} className="text-discord-text-muted hover:text-discord-text-bright">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {searchText.trim() ? (
          <div className="px-2">
            <h3 className="text-xs font-semibold text-discord-text-muted uppercase tracking-wider mb-3 px-2">
              Search Results
            </h3>
            {isSearching && (
              <p className="text-sm text-discord-text-muted px-2">Looking for users...</p>
            )}
            {searchError && (
              <p className="text-sm text-discord-danger px-2">{searchError}</p>
            )}
            {!isSearching && searchResults.length === 0 && (
              <p className="text-sm text-discord-text-muted px-2">
                Type a username or email and press Enter to search.
              </p>
            )}
            <div className="flex flex-col gap-1">
              {searchResults.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  isSelected={selectedUser?.id === user.id}
                  isOnline={isUserOnline(user.id)}
                  unreadCount={unreadCounts[user.id]}
                  onSelect={onSelectUser}
                  onAddFriend={onAddFriend}
                  isSearchMode={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-semibold text-discord-text-muted uppercase tracking-wider">
                Direct Messages
              </h3>
              <button
                onClick={() => setFilterUnread(!filterUnread)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase transition-all ${
                  filterUnread
                    ? "bg-discord-brand text-white shadow-xs"
                    : "bg-discord-dark text-discord-text-muted hover:text-discord-text hover:bg-discord-hover"
                }`}
              >
                {filterUnread ? "Unread" : "All"}
              </button>
            </div>
            {displayedFriends.length === 0 ? (
              <p className="text-sm text-discord-text-muted px-2 mt-4 text-center">
                {filterUnread ? "No unread messages." : "No friends yet. Search to add some!"}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {displayedFriends.map((friend) => (
                  <UserListItem
                    key={friend.id}
                    user={friend}
                    isSelected={selectedUser?.id === friend.id}
                    isOnline={isUserOnline(friend.id)}
                    unreadCount={unreadCounts[friend.id]}
                    onSelect={onSelectUser}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
