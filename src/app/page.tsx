import { HeroSection } from '@/sections/HeroSection'
import { FeaturedCollectionsSection } from '@/sections/FeaturedCollectionsSection'
import { NewsletterSection } from '@/sections/NewsletterSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] overflow-x-hidden">
      
      <HeroSection />
      
      
      <FeaturedCollectionsSection />
      
      
      <NewsletterSection />
    </main>
  )
}
