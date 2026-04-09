import * as React from "react"

type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  } & (
    | { color?: string; theme?: Record<string, string> }
    | { color?: never; theme?: never }
  )
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<any>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      ref={ref}
      className={className}
      data-chart={chartId}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_k, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `[data-chart="${id}"] {`,
          ...colorConfig.map(([key, itemConfig]) => {
            const color =
              itemConfig.theme?.light || itemConfig.color

            return color ? `  --color-${key}: ${color};` : null
          }),
          "}",
          `[data-chart="${id}"] svg {`,
          ...colorConfig.map(([key]) => `  --color-${key}: var(--color-${key});`),
          "}",
        ]
          .filter(Boolean)
          .join("\n"),
      }}
    />
  )
}

export { ChartContainer, ChartStyle, type ChartConfig }
