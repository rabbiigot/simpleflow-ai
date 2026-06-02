import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EMOJI_CATEGORIES: Array<{
  key: string;
  label: string;
  icon: string;
  emojis: string[];
}> = [
  {
    key: "smileys",
    label: "Smileys",
    icon: "😀",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🤠",
      "🥳",
      "😎",
      "🤓",
      "🧐",
    ],
  },
  {
    key: "gestures",
    label: "Gestures",
    icon: "👍",
    emojis: [
      "👍",
      "👎",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "✋",
      "🤚",
      "🖐️",
      "🖖",
      "👋",
      "🤝",
      "🙏",
      "✍️",
      "💪",
      "🦾",
      "🙌",
      "👏",
      "🤲",
      "🫶",
    ],
  },
  {
    key: "hearts",
    label: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
    ],
  },
  {
    key: "objects",
    label: "Objects",
    icon: "💡",
    emojis: [
      "💡",
      "🔥",
      "✨",
      "⭐",
      "🌟",
      "💫",
      "🎉",
      "🎊",
      "🎈",
      "🎁",
      "🏆",
      "🥇",
      "🥈",
      "🥉",
      "🔔",
      "🔕",
      "📌",
      "📍",
      "🔑",
      "🔒",
      "🔓",
      "💰",
      "💎",
      "⚡",
      "🧲",
      "🧪",
      "🧬",
      "💊",
      "🩺",
    ],
  },
  {
    key: "symbols",
    label: "Symbols",
    icon: "✅",
    emojis: [
      "✅",
      "❌",
      "⭕",
      "🚫",
      "💯",
      "‼️",
      "⁉️",
      "❓",
      "❗",
      "✳️",
      "✴️",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
      "🔵",
      "🟣",
      "⚫",
      "⚪",
      "🟤",
      "🔶",
      "🔷",
      "🔸",
      "🔹",
      "▪️",
      "▫️",
      "◾",
      "◽",
    ],
  },
  {
    key: "nature",
    label: "Nature",
    icon: "🌿",
    emojis: [
      "🌿",
      "🍀",
      "🌱",
      "🌲",
      "🌳",
      "🌴",
      "🌵",
      "🌾",
      "🌺",
      "🌻",
      "🌹",
      "🥀",
      "🌷",
      "🌸",
      "💐",
      "🍄",
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐸",
      "🐵",
    ],
  },
  {
    key: "food",
    label: "Food",
    icon: "🍕",
    emojis: [
      "🍕",
      "🍔",
      "🍟",
      "🌭",
      "🍿",
      "🧂",
      "🥓",
      "🥚",
      "🍳",
      "🥞",
      "🧇",
      "🥐",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥗",
      "🥙",
      "🌮",
      "🌯",
      "🍜",
      "🍝",
      "🍣",
      "🍱",
      "🍩",
      "🍪",
      "🎂",
      "🍰",
      "☕",
      "🍵",
      "🧃",
      "🥤",
    ],
  },
  {
    key: "tech",
    label: "Tech",
    icon: "🤖",
    emojis: [
      "🤖",
      "💻",
      "🖥️",
      "📱",
      "⌨️",
      "🖱️",
      "🖨️",
      "📡",
      "🔋",
      "🔌",
      "💾",
      "💿",
      "📀",
      "🎮",
      "🕹️",
      "🎧",
      "🎤",
      "📷",
      "📹",
      "🔬",
      "🔭",
      "🧠",
      "🛡️",
      "⚙️",
      "🔧",
      "🔨",
      "🪛",
      "🧰",
    ],
  },
];

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState(EMOJI_CATEGORIES[0].key);

  const filteredCategories = search.trim()
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter(() => {
          // Simple search: match category name
          return cat.label.toLowerCase().includes(search.toLowerCase());
        }),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  const scrollToSection = (key: string) => {
    const el = sectionRefs.current[key];
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const top = el.offsetTop - container.offsetTop;
      container.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop + 10;
      let current = EMOJI_CATEGORIES[0].key;
      for (const cat of EMOJI_CATEGORIES) {
        const el = sectionRefs.current[cat.key];
        if (el && el.offsetTop - container.offsetTop <= scrollTop) {
          current = cat.key;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="w-72 rounded-lg border bg-popover shadow-lg"
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      {/* Header: search + close */}
      <div className="flex items-center gap-2 border-b px-2 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="h-7 w-full rounded-md border bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-0.5 border-b px-1.5 py-1 overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => {
              setActiveSection(cat.key);
              scrollToSection(cat.key);
            }}
            className={`shrink-0 grid h-7 w-7 place-items-center rounded text-sm transition-colors ${
              activeSection === cat.key ? "bg-primary/10" : "hover:bg-muted"
            }`}
            title={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div ref={scrollRef} className="h-52 overflow-y-auto px-1.5">
        {filteredCategories.map((cat) => (
          <div
            key={cat.key}
            ref={(el) => {
              sectionRefs.current[cat.key] = el;
            }}
          >
            <p className="sticky top-0 bg-popover px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded hover:bg-muted text-base"
                  onClick={() => onSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No emoji found
          </p>
        )}
      </div>
    </div>
  );
}
