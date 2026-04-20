import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useListScripts,
  useDeleteScript,
  getListScriptsQueryKey,
  getGetScriptStatsQueryKey,
  getGetTrendingScriptsQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  PlusSquare,
  Trash2,
  Eye,
  ThumbsUp,
  Code2,
  ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const params = user ? { limit: 100 } : undefined;
  const { data: scriptData, isLoading: scriptsLoading } = useListScripts(params || {}, {
    query: {
      queryKey: getListScriptsQueryKey(params),
      enabled: !!user,
    },
  });

  const deleteMutation = useDeleteScript({
    mutation: {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetScriptStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingScriptsQueryKey() });
        if (user) {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(user.username) });
        }
        toast({ title: "Script deleted", description: "Your script has been removed" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete script", variant: "destructive" });
      },
    },
  });

  if (!user && !authLoading) return null;

  const myScripts = scriptData?.scripts.filter((s) => s.authorId === user?.id) || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      GUI: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Admin: "bg-red-500/10 text-red-500 border-red-500/20",
      Hub: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      FPS: "bg-green-500/10 text-green-500 border-green-500/20",
      Tycoon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };
    return colors[category] || "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.username}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/upload">
            <PlusSquare className="h-4 w-4 mr-2" />
            Upload Script
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "My Scripts",
            value: myScripts.length,
            icon: Code2,
          },
          {
            label: "Total Likes",
            value: myScripts.reduce((sum, s) => sum + s.likes, 0),
            icon: ThumbsUp,
          },
          {
            label: "Total Views",
            value: myScripts.reduce((sum, s) => sum + s.views, 0),
            icon: Eye,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4"
          >
            <div className="p-3 bg-primary/10 text-primary rounded-full flex-none">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Script List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Scripts</h2>

        {scriptsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : myScripts.length === 0 ? (
          <div className="py-16 text-center border border-dashed rounded-xl bg-muted/20">
            <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scripts yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't uploaded any scripts yet. Share your first one!
            </p>
            <Button asChild>
              <Link href="/upload">
                <PlusSquare className="h-4 w-4 mr-2" />
                Upload Your First Script
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myScripts.map((script) => (
              <div
                key={script.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card border border-border/50 rounded-xl"
                data-testid={`script-row-${script.id}`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{script.title}</h3>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(script.category)}`}
                    >
                      {script.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{script.game}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {script.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {script.views.toLocaleString()}
                    </span>
                    <span className="text-xs">
                      {new Date(script.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-none">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/script/${script.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid={`delete-script-${script.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Script</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{script.title}"? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate({ id: script.id })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
