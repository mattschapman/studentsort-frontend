// app/dashboard/(orgs)/[orgId]/_components/project-card.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Copy,
  Edit,
  MoreHorizontal,
  Trash2,
  Loader2,
  Files,
  FolderOpen,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteProject } from "../_actions/delete-project"
import { duplicateProject } from "../_actions/duplicate-project"

interface Project {
  id: string
  org_id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  created_by: string | null
}

interface ProjectCardProps {
  project: Project
  latestVersionId?: string
}

// Helper function to get status badge styling
const getStatusStyling = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200'
    case 'published':
      return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'archived':
      return 'bg-gray-50 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

export function ProjectCard({ project, latestVersionId }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const router = useRouter()

  // Build project URL with latest version
  const projectUrl = latestVersionId
    ? `/dashboard/${project.org_id}/${project.id}?version=${latestVersionId}`
    : `/dashboard/${project.org_id}/${project.id}`

  const handleEdit = () => {
    router.push(projectUrl)
  }

  const handleOpen = () => {
    router.push(projectUrl)
  }

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}${projectUrl}`
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleOpenInNewTab = () => {
    window.open(projectUrl, '_blank')
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    toast.info("Duplicating project...")
    
    try {
      const result = await duplicateProject(project.org_id, project.id)
      
      if (result.success) {
        toast.success("Project duplicated successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to duplicate project")
      }
    } catch (error) {
      console.error("Error duplicating project:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone and will delete all versions and associated files.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteProject(project.org_id, project.id)
      
      if (result.success) {
        toast.success("Project deleted successfully")
        // Router refresh will happen automatically due to revalidatePath
      } else {
        toast.error(result.error || "Failed to delete project")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  const isLoading = isDeleting || isDuplicating

  return (
    <Link href={projectUrl} className="group">
      <Card className="h-36 hover:bg-accent relative">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>{project.title}</span>
            </CardTitle>
            <CardDescription className="text-xs h-full line-clamp-2">
              {project.description ?? project.description}
            </CardDescription>
          </div>
          <div className="mt-0! flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                  <span className="sr-only">More options</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="bottom"
                align="start"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <DropdownMenuItem onClick={handleOpen}>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenInNewTab}>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Open in New Tab</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                >
                  {isDuplicating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Files className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs">
                    {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="hover:text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  <span className="text-xs">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end h-[40%]">
          <span
            className={`w-fit text-xs border rounded-full px-2 py-0.5 ${getStatusStyling(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}



// // app/dashboard/(orgs)/[orgId]/_components/project-card.tsx
// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import {
//   ArrowUpRight,
//   Copy,
//   Edit,
//   MoreHorizontal,
//   Trash2,
//   Loader2,
//   Files,
//   FolderOpen,
// } from "lucide-react"
// import { toast } from "sonner"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { deleteProject } from "../_actions/delete-project"

// interface Project {
//   id: string
//   org_id: string
//   title: string
//   description: string | null
//   status: string
//   created_at: string
//   updated_at: string
//   created_by: string | null
// }

// interface ProjectCardProps {
//   project: Project
//   latestVersionId?: string
// }

// // Helper function to get status badge styling
// const getStatusStyling = (status: string) => {
//   switch (status.toLowerCase()) {
//     case 'draft':
//       return 'bg-yellow-50 text-yellow-600 border-yellow-200'
//     case 'published':
//       return 'bg-blue-50 text-blue-600 border-blue-200'
//     case 'archived':
//       return 'bg-gray-50 text-gray-600 border-gray-200'
//     default:
//       return 'bg-gray-50 text-gray-600 border-gray-200'
//   }
// }

// export function ProjectCard({ project, latestVersionId }: ProjectCardProps) {
//   const [isDeleting, setIsDeleting] = useState(false)
//   const router = useRouter()

//   // Build project URL with latest version
//   const projectUrl = latestVersionId
//     ? `/dashboard/${project.org_id}/${project.id}?version=${latestVersionId}`
//     : `/dashboard/${project.org_id}/${project.id}`

//   const handleEdit = () => {
//     router.push(projectUrl)
//   }

//   const handleOpen = () => {
//     router.push(projectUrl)
//   }

//   const handleCopyLink = async () => {
//     try {
//       const url = `${window.location.origin}${projectUrl}`
//       await navigator.clipboard.writeText(url)
//       toast.success("Link copied to clipboard")
//     } catch (error) {
//       toast.error("Failed to copy link")
//     }
//   }

//   const handleOpenInNewTab = () => {
//     window.open(projectUrl, '_blank')
//   }

//   const handleDuplicate = async () => {
//     toast.info("Duplicate functionality coming soon")
//   }

//   const handleDelete = async () => {
//     // Confirmation dialog
//     if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone and will delete all versions and associated files.`)) {
//       return
//     }

//     setIsDeleting(true)
//     try {
//       const result = await deleteProject(project.org_id, project.id)
      
//       if (result.success) {
//         toast.success("Project deleted successfully")
//         // Router refresh will happen automatically due to revalidatePath
//       } else {
//         toast.error(result.error || "Failed to delete project")
//         setIsDeleting(false)
//       }
//     } catch (error) {
//       console.error("Error deleting project:", error)
//       toast.error("An unexpected error occurred")
//       setIsDeleting(false)
//     }
//   }

//   return (
//     <Link href={projectUrl} className="group">
//       <Card className="h-36 hover:bg-accent relative">
//         <CardHeader className="pb-3 flex flex-row items-start justify-between">
//           <div className="flex flex-col gap-2">
//             <CardTitle className="text-sm flex items-center gap-2">
//               <FolderOpen className="w-4 h-4" />
//               <span>{project.title}</span>
//             </CardTitle>
//             <CardDescription className="text-xs h-full line-clamp-2">
//               {project.description ?? project.description}
//             </CardDescription>
//           </div>
//           <div className="mt-0! flex items-center">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   className="p-1 hover:bg-gray-100 rounded transition-colors"
//                   disabled={isDeleting}
//                   onClick={(e) => {
//                     e.preventDefault()
//                     e.stopPropagation()
//                   }}
//                 >
//                   {isDeleting ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <MoreHorizontal className="h-4 w-4" />
//                   )}
//                   <span className="sr-only">More options</span>
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent
//                 className="w-56 rounded-lg"
//                 side="bottom"
//                 align="start"
//                 onClick={(e) => {
//                   e.preventDefault()
//                   e.stopPropagation()
//                 }}
//               >
//                 <DropdownMenuItem onClick={handleOpen}>
//                   <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
//                   <span className="text-xs">Open</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={handleOpenInNewTab}>
//                   <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
//                   <span className="text-xs">Open in New Tab</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={handleCopyLink}>
//                   <Copy className="h-3 w-3 text-muted-foreground" />
//                   <span className="text-xs">Copy Link</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem
//                   className="hover:text-destructive focus:text-destructive"
//                   onClick={handleDelete}
//                   disabled={isDeleting}
//                 >
//                   {isDeleting ? (
//                     <Loader2 className="h-3 w-3 animate-spin" />
//                   ) : (
//                     <Trash2 className="h-3 w-3" />
//                   )}
//                   <span className="text-xs">{isDeleting ? 'Deleting...' : 'Delete'}</span>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </CardHeader>
//         <CardContent className="flex flex-col justify-end h-[40%]">
//           <span
//             className={`w-fit text-xs border rounded-full px-2 py-0.5 ${getStatusStyling(
//               project.status
//             )}`}
//           >
//             {project.status}
//           </span>
//         </CardContent>
//       </Card>
//     </Link>
//   )
// }