import { SkeletonLoader } from "./SkeletonLoader";
import CustomDrawer from "./CustomDrawer";
import { UserListItem } from "./UserListItem";
import { User, SearchUser } from "@/types/chat";
import { useState, useEffect } from "react";
import { Search, UserPlus, X } from "lucide-react";
import api from "@/lib/axios";

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
  isLoading?: boolean;
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
  isLoading = false,
}: SidebarProps) {
  const [filterUnread, setFilterUnread] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [addContactSearch, setAddContactSearch] = useState("");
  const [addContactResults, setAddContactResults] = useState<SearchUser[]>([]);
  const [isAddContactSearching, setIsAddContactSearching] = useState(false);
  const [addContactError, setAddContactError] = useState("");

  const isUserOnline = (id: string) => onlineUsers.includes(id);

  const displayedFriends = filterUnread
    ? userFriends.filter((friend) => (unreadCounts[friend.id] || 0) > 0)
    : userFriends;

  const handleAddContactSearch = async () => {
    const query = addContactSearch.trim();
    if (!query) {
      setAddContactResults([]);
      setAddContactError("");
      return;
    }

    setIsAddContactSearching(true);
    setAddContactError("");

    try {
      const response = await api.get(
        `/api/Users/search?q=${encodeURIComponent(query)}`,
      );
      setAddContactResults(response.data.users || []);
    } catch (error) {
      console.error("Add contact search failed:", error);
      setAddContactError("Could not search users. Please try again.");
    } finally {
      setIsAddContactSearching(false);
    }
  };

  const handleAddContactInputChange = (value: string) => {
    setAddContactSearch(value);
    if (!value.trim()) {
      setAddContactResults([]);
      setAddContactError("");
    }
  };

  useEffect(() => {
    if (showAddContactModal) {
      setAddContactSearch("");
      setAddContactResults([]);
      setAddContactError("");
    }
  }, [showAddContactModal]);

  return (
    <div
      className={`panel-enter glass-panel flex h-full w-full shrink-0 flex-col rounded-[28px] p-4 md:w-[292px] lg:w-[300px] ${
        isHiddenOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="z-10 shrink-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-normal text-white">
            Messages
          </h1>
          <CustomDrawer compact />
        </div>

        <div className="glass-soft flex h-11 items-center gap-2 rounded-2xl px-3 transition-colors focus-within:border-[#4CD964]/60">
          <Search size={16} className="text-white/55" />
          <input
            type="text"
            placeholder="Search or start a chat"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/42"
          />
          {searchText && (
            <button
              onClick={onClearSearch}
              className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto pr-1">
        {searchText.trim() ? (
          <div>
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Search Results
            </h3>
            {isSearching && (
              <p className="px-2 text-sm text-white/52">Looking for users...</p>
            )}
            {searchError && (
              <p className="px-2 text-sm text-red-300">{searchError}</p>
            )}
            {!isSearching && searchResults.length === 0 && (
              <p className="px-2 text-sm text-white/52">
                Type a username or email and press Enter to search.
              </p>
            )}
            <div className="flex flex-col">
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
          <div>
            <div className="mb-3 flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Direct Messages
              </h3>
              <button
                onClick={() => setFilterUnread(!filterUnread)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  filterUnread
                    ? "bg-[#4CD964] text-black shadow-[0_0_18px_rgba(76,217,100,0.35)]"
                    : "bg-white/7 text-white/52 hover:bg-white/12 hover:text-white"
                }`}
              >
                {filterUnread ? "Unread" : "All"}
              </button>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <SkeletonLoader
                    key={i}
                    type="avatar"
                    width="w-8"
                    height="h-8"
                    className="animate-pulse"
                  />
                ))}
              </div>
            ) : displayedFriends.length === 0 ? (
              <p className="mt-4 px-2 text-center text-sm text-white/52">
                {filterUnread
                  ? "No unread messages."
                  : "No friends yet. Search to add some!"}
              </p>
            ) : (
              <div className="flex flex-col">
                {displayedFriends.map((friend) => (
                  <UserListItem
                    key={friend.id}
                    user={friend}
                    isSelected={selectedUser?.id === friend.id}
                    isOnline={isUserOnline(friend.id)}
                    unreadCount={unreadCounts[friend.id]}
                    onSelect={onSelectUser}
                    onAddFriend={onAddFriend}
                    isSearchMode={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddContactModal(true)}
        className="mt-4 flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/6 px-4 text-sm font-semibold text-white/86 transition-all hover:border-[#4CD964]/50 hover:bg-[#4CD964]/12 hover:text-white hover:shadow-[0_0_24px_rgba(76,217,100,0.16)]"
      >
        <UserPlus size={18} />
        Add Contact
      </button>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-panel relative w-full rounded-t-[28px] md:rounded-[28px] md:max-w-md md:max-h-[90vh] flex flex-col p-4 max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between shrink-0 mb-4">
              <h2 className="text-xl font-bold text-white">Add Contact</h2>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="rounded-full p-2 text-white/58 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="glass-soft flex h-11 items-center gap-2 rounded-2xl px-3 mb-4 shrink-0">
              <Search size={16} className="text-white/55" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={addContactSearch}
                onChange={(e) => handleAddContactInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddContactSearch();
                }}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/42"
              />
              {addContactSearch && (
                <button
                  onClick={() => handleAddContactInputChange("")}
                  className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto pr-1 mb-3">
              {addContactSearch.trim() ? (
                <div>
                  {isAddContactSearching && (
                    <p className="px-2 text-sm text-white/52">
                      Searching users...
                    </p>
                  )}
                  {addContactError && (
                    <p className="px-2 text-sm text-red-300">
                      {addContactError}
                    </p>
                  )}
                  {!isAddContactSearching && addContactResults.length === 0 && (
                    <p className="px-2 text-sm text-white/52">
                      No users found. Try another search.
                    </p>
                  )}
                  <div className="flex flex-col">
                    {addContactResults.map((user) => (
                      <UserListItem
                        key={user.id}
                        user={user}
                        isSelected={selectedUser?.id === user.id}
                        isOnline={isUserOnline(user.id)}
                        unreadCount={unreadCounts[user.id]}
                        onSelect={(selectedUser) => {
                          onSelectUser(selectedUser);
                          setShowAddContactModal(false);
                        }}
                        onAddFriend={onAddFriend}
                        isSearchMode={true}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-white/52 mb-3">
                    Search for users to add them as contacts
                  </p>
                  <p className="text-xs text-white/38">
                    Type a name or email and press Enter
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAddContactModal(false)}
              className="shrink-0 h-10 rounded-2xl border border-white/15 bg-white/6 text-sm font-semibold text-white/86 transition-all hover:bg-white/12 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
