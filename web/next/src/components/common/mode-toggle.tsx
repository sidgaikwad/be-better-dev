"use client"

import {
  RiComputerLine,
  RiMoonLine,
  RiSunLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

const modes: { icon: RemixiconComponentType; label: string; value: string }[] = [
  { icon: RiComputerLine, label: "System", value: "system" },
  { icon: RiSunLine, label: "Light", value: "light" },
  { icon: RiMoonLine, label: "Dark", value: "dark" },
]

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const smartToggle = () => {
    /* The smart toggle by @nrjdalal */
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    if (theme === "system") {
      setTheme(prefersDarkScheme ? "light" : "dark")
    } else if (
      (theme === "light" && !prefersDarkScheme) ||
      (theme === "dark" && prefersDarkScheme)
    ) {
      setTheme(theme === "light" ? "dark" : "light")
    } else {
      setTheme("system")
    }
  }

  return (
    <Button
      className="size-8 [&_svg]:size-4!"
      onClick={smartToggle}
      aria-label="Switch between system/light/dark version"
      size="sm"
      variant="outline"
    >
      <RiSunLine className="dark:hidden" aria-hidden="true" />
      <RiMoonLine className="hidden dark:block" aria-hidden="true" />
    </Button>
  )
}

// The menu form of the same control, for surfaces that have no navbar: every app-shell route hides it (`isAppShellPath` in lib/shell.ts), so the sidebar user menu is the only place those pages reach the theme. Named radio options rather than the navbar's blind cycle: the menu stays open on a radio pick, so the moving check mark says which of system/light/dark is now selected, which the icon button can only imply.
export function ModeToggleMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {/* Swapped by CSS rather than by reading `theme`, which is undefined until next-themes resolves it and would mismatch on hydration. */}
        <RiSunLine className="dark:hidden" />
        <RiMoonLine className="hidden dark:block" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {modes.map((mode) => (
            <DropdownMenuRadioItem key={mode.value} value={mode.value}>
              <mode.icon />
              {mode.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
