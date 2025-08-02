export const textStyles = {
  heading: "text-lg font-semibold",
  body: "text-base",
  caption: "text-sm",
  label: "font-medium",
} as const

export type TextStyle = keyof typeof textStyles
