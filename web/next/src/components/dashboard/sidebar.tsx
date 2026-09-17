"use client"

import { features } from "@packages/config/site"
import {
  RiBookLine,
  RiBookOpenLine,
  RiDashboardLine,
  RiFocus3Line,
  RiHeadphoneLine,
  RiRefreshLine,
  RiStickyNoteLine,
  RiTrophyLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import { type User } from "better-auth/types"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarUserMenu } from "@/components/shell/sidebar-user-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { config } from "@/lib/config"
import { isActive } from "@/lib/utils"

const learnNavItems: {
  exact?: boolean
  icon: RemixiconComponentType
  title: string
  url: string
}[] = [
  { icon: RiDashboardLine, title: "Dashboard", url: "/dashboard" },
  { exact: false, icon: RiFocus3Line, title: "Focus", url: "/focus" },
  { exact: false, icon: RiBookOpenLine, title: "Learn", url: "/learn" },
  { icon: RiHeadphoneLine, title: "Audiobook", url: "/audiobook" },
  { icon: RiRefreshLine, title: "Review", url: "/review" },
  { exact: false, icon: RiStickyNoteLine, title: "Notes", url: "/notes" },
  { icon: RiTrophyLine, title: "Leaderboard", url: "/leaderboard" },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const close = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-0.5">
        {learnNavItems.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              isActive={isActive(pathname, item.url, { exact: item.exact })}
              tooltip={item.title}
              className="data-active:font-normal"
              render={<Link href={item.url} onClick={close} />}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function DashboardFooter({
  user,
  canAccessConsole,
}: {
  user: User
  canAccessConsole: boolean
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const close = () => {
    if (isMobile) setOpenMobile(false)
  }
  return (
    <SidebarMenu className="space-y-1.5">
      {features.docs && (
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/docs" onClick={close} />}>
            <RiBookLine />
            <span>Documentation</span>
            <span className="text-muted-foreground ml-auto text-xs">v{config.app.version}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarUserMenu user={user} area={canAccessConsole ? "dashboard" : undefined} />
    </SidebarMenu>
  )
}
