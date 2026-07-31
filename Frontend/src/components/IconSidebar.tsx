type AppView = "trading" | "metrics" | "news";

type SidebarTool = {
  id: AppView;
  label: string;
  icon: string;
};

const SIDEBAR_TOOLS: SidebarTool[] = [
  { id: "trading", label: "Trading", icon: "📈" },
  { id: "metrics", label: "Metrics", icon: "📊" },
  { id: "news", label: "News", icon: "📰" },
];

type IconSidebarProps = {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
};

function IconSidebar({ activeView, onSelectView }: IconSidebarProps) {
  return (
    <aside className="icon-sidebar">
      <div className="sidebar-logo">SB</div>

      <nav className="sidebar-icons">
        {SIDEBAR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`sidebar-icon-button ${activeView === tool.id ? "active" : ""}`}
            onClick={() => onSelectView(tool.id)}
            title={tool.label}
          >
            <span>{tool.icon}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-icon-button" title="Help">
          ?
        </button>
      </div>
    </aside>
  );
}

export default IconSidebar;
export type { AppView };