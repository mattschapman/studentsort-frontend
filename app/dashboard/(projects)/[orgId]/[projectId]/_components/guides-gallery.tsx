// app/dashboard/(projects)/[orgId]/[projectId]/_components/guides-gallery.tsx
import Link from "next/link"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const starters = [
  {
    title: "Curriculum Diagram",
    description: "Learn how to build a Curriculum Diagram for your school.",
    href: "#",
    image: "/images/marketing/curriculum-diagram.png"
  },
  {
    title: "Combing Chart",
    description: "Learn how to evaluate staffing plans and build teacher teams.",
    href: "#",
    image: "/images/marketing/combing-chart.png"
  },
  {
    title: "Batches",
    description: "Learn how to use batches to optimise your scheduling.",
    href: "#",
    image: "/images/marketing/batches.png"
  },
  {
    title: "Option Blocks",
    description: "Learn how to optimise the option blocks offered at your school.",
    href: "#",
    image: "/images/marketing/option-blocks.png"
  },
]

export function GuidesGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
      {starters.map((starter, index) => (
        <Link 
          key={index}
          href={starter.href}
          className="group"
        >
          <Card className="h-64 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            {/* Gradient background */}
            <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            <CardHeader className="p-6 h-full flex flex-col justify-between relative z-10">
              <div className="flex flex-col gap-3">
                <CardTitle className="font-semibold">
                  {starter.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {starter.description}
                </CardDescription>
              </div>
              
              {/* Arrow indicator */}
              <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View guide
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardHeader>

            {/* Angled preview image - bottom right, partially obscured */}
            <div className="absolute -bottom-4 -right-4 w-50 h-32 rotate-6 group-hover:rotate-3 transition-transform duration-300">
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl border border-gray-200">
                <Image
                  src={starter.image}
                  alt={`${starter.title} preview`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}