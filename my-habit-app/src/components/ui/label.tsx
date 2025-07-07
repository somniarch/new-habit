import * as React from "react"
import { Label as UILabel } from "@radix-ui/react-label"

const Label = React.forwardRef<
  React.ElementRef<typeof UILabel>,
  React.ComponentPropsWithoutRef<typeof UILabel>
>(({ className, ...props }, ref) => (
  <UILabel
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
))

Label.displayName = "Label"

export { Label }
