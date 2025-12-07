export function formatChatTimestamp(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric", hour12: true };
    const formattedTime = date.toLocaleTimeString([], options);

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${formattedTime}`;
    } else if (isYesterday) {
      return `Yesterday, ${formattedTime}`;
    } else {
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      return `${weekday}, ${formattedTime}`;
    }
  }