export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-bold text-lg backdrop-blur-sm">
            RM
          </div>
          <span className="font-semibold text-lg">Remote Munshi</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Practice Management<br />for Modern CA Firms
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Streamline compliance, tasks, and client management — all in one place.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Remote Munshi. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
