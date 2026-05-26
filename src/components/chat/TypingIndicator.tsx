export function TypingIndicator({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 mt-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce"></div>
      </div>
      <span className="text-xs text-discord-text-muted font-medium">
        {username} is typing...
      </span>
    </div>
  );
}
