export function TypingIndicator({ username }: { username: string }) {
  return (
    <div className="message-enter mt-2 flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/12 bg-black/[0.24] px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/52 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/52 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/52" />
      </div>
      <span className="text-xs font-medium text-white/42">
        {username} is typing
      </span>
    </div>
  );
}
