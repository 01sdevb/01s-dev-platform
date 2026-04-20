import { Link } from "wouter";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { Moon, Sun, Menu, User, LogOut, PlusSquare, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <span className="text-3xl font-bold font-display text-primary leading-none">0.1s</span>
              <span className="text-xl font-bold font-sans text-foreground leading-none self-end pb-0.5">Dev</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/upload">
                    <Button variant="outline" size="sm" className="gap-2">
                      <PlusSquare className="h-4 w-4" />
                      Upload Script
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        {user.username}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.username}`} className="w-full cursor-pointer">
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="w-full cursor-pointer flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {user ? (
                      <>
                        <Link href="/upload" className="flex items-center gap-2 px-2 py-1 text-sm font-medium hover:text-primary transition-colors">
                          <PlusSquare className="h-4 w-4" /> Upload Script
                        </Link>
                        <Link href={`/profile/${user.username}`} className="flex items-center gap-2 px-2 py-1 text-sm font-medium hover:text-primary transition-colors">
                          <User className="h-4 w-4" /> Profile
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1 text-sm font-medium hover:text-primary transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Button variant="ghost" className="justify-start px-2 py-1 text-destructive" onClick={() => logout()}>
                          <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="ghost" className="w-full justify-start">Login</Button>
                        </Link>
                        <Link href="/register">
                          <Button className="w-full justify-start bg-primary text-primary-foreground">Sign Up</Button>
                        </Link>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 opacity-50">
            <span className="text-xl font-bold font-display text-primary leading-none">0.1s</span>
            <span className="text-sm font-bold font-sans text-foreground leading-none self-end pb-[1px]">Dev</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} 0.1s Dev. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
