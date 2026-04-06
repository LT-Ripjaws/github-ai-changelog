import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" />
            </svg>
            <span className="text-lg font-bold">Changelog AI</span>
          </div>
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}>
            <Button variant="outline">Sign in</Button>
          </a>
        </div>
      </div>
    </nav>
  );
}
