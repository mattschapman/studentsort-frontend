// components/dashboard/header/user-dropdown.tsx
"use client"

import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
  User2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserDropdown({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity">
              {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
              <AvatarFallback className="rounded-full bg-blue-500 text-white text-sm">
                <User2 className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg bg-white border border-gray-200"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-blue-500 text-white text-sm">
                    <User2 className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs font-medium text-gray-900">{user.name}</span>
                  <span className="truncate text-xs text-gray-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            {/* <DropdownMenuGroup>
              <DropdownMenuItem className="group text-gray-700 hover:bg-accent hover:text-black text-xs">
                <Sparkles className="text-gray-500 group-hover:text-black" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="group text-gray-700 hover:bg-accent hover:text-black text-xs">
                <BadgeCheck className="text-gray-500 group-hover:text-black" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="group text-gray-700 hover:bg-accent hover:text-black text-xs">
                <CreditCard className="text-gray-500 group-hover:text-black" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="group text-gray-700 hover:bg-accent hover:text-black text-xs">
                <Bell className="text-gray-500 group-hover:text-black" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-200" /> */}
            <DropdownMenuItem 
              className="group text-gray-700 hover:bg-accent hover:text-black text-xs cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="text-gray-500 group-hover:text-black" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  )
}