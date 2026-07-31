import type { ChartSettings, CrosshairModeSetting } from "../types/ChartSettings";

type ChartToolGroup = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

const CHART_TOOL_GROUPS: ChartToolGroup[] = [
  {
    id: "crosshair",
    label: "Crosshair",
    icon: "＋",
    description: "Cursor and crosshair behavior",
  },
  {
    id: "trendlines",
    label: "Trendlines",
    icon: "╱",
    description: "Lines, channels, rays, and info lines",
  },
  {
    id: "projections",
    label: "Projections",
    icon: "⌐",
    description: "Risk/reward, measured moves, and projections",
  },
  {
    id: "fibonacci",
    label: "Fibonacci",
    icon: "≋",
    description: "Retracements, extensions, and fib tools",
  },
  {
    id: "complex-patterns",
    label: "Complex Patterns",
    icon: "◇",
    description: "Advanced chart patterns and structures",
  },
  {
    id: "shapes",
    label: "Shapes",
    icon: "▭",
    description: "Rectangles, circles, arrows, and markers",
  },
  {
    id: "text",
    label: "Text",
    icon: "T",
    description: "Labels, notes, and annotations",
  },
];

type ChartToolRailProps = {
  activeChartTool: string | null;
  chartSettings: ChartSettings;
  onSelectChartTool: (toolId: string) => void;
  onChangeCrosshairMode: (mode: CrosshairModeSetting) => void;
};

function ChartToolRail({
  activeChartTool,
  chartSettings,
  onSelectChartTool,
  onChangeCrosshairMode,
}: ChartToolRailProps) {
  return (
    <aside className="chart-tool-rail">
      {CHART_TOOL_GROUPS.map((toolGroup) => (
        <div key={toolGroup.id} className="chart-tool-wrapper">
          <button
            className={`chart-tool-button ${
              activeChartTool === toolGroup.id ? "active" : ""
            }`}
            title={toolGroup.label}
            type="button"
            onClick={() => onSelectChartTool(toolGroup.id)}
          >
            {toolGroup.icon}
          </button>

          {activeChartTool === toolGroup.id && (
            <ToolGroupPopover
              toolGroup={toolGroup}
              chartSettings={chartSettings}
              onChangeCrosshairMode={onChangeCrosshairMode}
            />
          )}
        </div>
      ))}
    </aside>
  );
}

type ToolGroupPopoverProps = {
  toolGroup: ChartToolGroup;
  chartSettings: ChartSettings;
  onChangeCrosshairMode: (mode: CrosshairModeSetting) => void;
};

function ToolGroupPopover({
  toolGroup,
  chartSettings,
  onChangeCrosshairMode,
}: ToolGroupPopoverProps) {
  return (
    <div className="chart-tool-popover">
      <div className="tool-popover-header">
        <strong>{toolGroup.label}</strong>
        <span>{toolGroup.description}</span>
      </div>

      {toolGroup.id === "crosshair" ? (
        <CrosshairSettings
          chartSettings={chartSettings}
          onChangeCrosshairMode={onChangeCrosshairMode}
        />
      ) : (
        <EmptyToolGroupState />
      )}
    </div>
  );
}

type CrosshairSettingsProps = {
  chartSettings: ChartSettings;
  onChangeCrosshairMode: (mode: CrosshairModeSetting) => void;
};

function CrosshairSettings({
  chartSettings,
  onChangeCrosshairMode,
}: CrosshairSettingsProps) {
  return (
    <>
      <CrosshairOption
        label="Free roam"
        description="Crosshair moves freely around the chart."
        value="normal"
        selectedValue={chartSettings.crosshairMode}
        onChange={onChangeCrosshairMode}
      />

      <CrosshairOption
        label="Magnet"
        description="Crosshair snaps to the candle close."
        value="magnet"
        selectedValue={chartSettings.crosshairMode}
        onChange={onChangeCrosshairMode}
      />

      <CrosshairOption
        label="Hidden"
        description="Hide the crosshair from the chart."
        value="hidden"
        selectedValue={chartSettings.crosshairMode}
        onChange={onChangeCrosshairMode}
      />
    </>
  );
}

function EmptyToolGroupState() {
  return (
    <div className="empty-tool-group-state">
      <span>No tools added yet.</span>
      <small>This group is ready for future tools.</small>
    </div>
  );
}

type CrosshairOptionProps = {
  label: string;
  description: string;
  value: CrosshairModeSetting;
  selectedValue: CrosshairModeSetting;
  onChange: (value: CrosshairModeSetting) => void;
};

function CrosshairOption({
  label,
  description,
  value,
  selectedValue,
  onChange,
}: CrosshairOptionProps) {
  const isSelected = value === selectedValue;

  return (
    <button
      className={`crosshair-option ${isSelected ? "active" : ""}`}
      type="button"
      onClick={() => onChange(value)}
    >
      <span>{label}</span>
      <small>{description}</small>
    </button>
  );
}

export default ChartToolRail;