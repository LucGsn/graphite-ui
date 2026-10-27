export { cn } from "./lib/cn";
export { layoutTreemap, type TreemapInput, type TreemapRect } from "./lib/treemap";

// Base
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { IconButton, type IconButtonProps } from "./components/icon-button";
export { Badge, StatusDot, type BadgeProps, type StatusDotProps, type Tone } from "./components/badge";
export { Card, CardHeader, type CardHeaderProps } from "./components/card";
export { InfoTooltip, type InfoTooltipProps } from "./components/info-tooltip";
export { KpiStat, KpiGrid, type KpiStatProps } from "./components/kpi-stat";

// Coque et navigation
export { AppShell, type AppShellProps } from "./components/app-shell";
export { Sidebar, type SidebarProps, type SidebarSection, type SidebarItem } from "./components/sidebar";
export { PageHeader, SectionTitle, GroupDivider, type PageHeaderProps } from "./components/page-header";
export { Tabs, type TabsProps, type TabItem } from "./components/tabs";

// Contrôles
export { ToggleGroup, type ToggleGroupProps, type ToggleOption } from "./components/toggle-group";
export { ModeSwitch, type ModeSwitchProps } from "./components/mode-switch";
export { FilterSelect, type FilterSelectProps, type FilterOption } from "./components/filter-select";

// Données
export { List, ListRow, type ListRowProps } from "./components/list-row";
export { DataTable, type DataTableProps, type Column } from "./components/data-table";
export { Drawer, type DrawerProps } from "./components/drawer";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";

// Graphiques
export {
  ChartCard,
  ChartLegend,
  chartVar,
  type ChartCardProps,
  type ChartColor,
  type LegendItem,
} from "./components/chart-card";
export { BarChart, type BarChartProps, type BarDatum } from "./components/bar-chart";
export { LineChart, type LineChartProps, type LineSeries, type LineRow } from "./components/line-chart";
export { Treemap, type TreemapProps, type TreemapItem } from "./components/treemap";

// Onboarding et questionnaires (contrat pur : voir aussi « graphite-ui/questionnaire », sans React)
export * from "./lib/questionnaire";
export {
  OnboardingShell,
  type OnboardingShellProps,
  type CustomStep,
  type CustomStepContext,
} from "./components/onboarding-shell";
export { QuestionnaireRenderer, type QuestionnaireRendererProps } from "./components/questionnaire-renderer";
export { QuestionField, type QuestionFieldProps, type IconMap } from "./components/question-field";
export { ProgressDots, type ProgressDotsProps } from "./components/progress-dots";
export { SaveIndicator, type SaveIndicatorProps, type SaveStatus } from "./components/save-indicator";
export { ReviewSummary, formatAnswer, type ReviewSummaryProps } from "./components/review-summary";
export { CompletionScreen, type CompletionScreenProps } from "./components/completion-screen";
