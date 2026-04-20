import { useState, useEffect } from "react";
import { useListScripts, useGetTrendingScripts, useGetScriptStats, getListScriptsQueryKey, getGetTrendingScriptsQueryKey, getGetScriptStatsQueryKey } from "@workspace/api-client-react";
import { ScriptCard } from "@/components/script-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Flame, LayoutGrid, Users, ThumbsUp, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListScriptsSort } from "@workspace/api-client-react/src/generated/api.schemas";

const CATEGORIES = ["All", "GUI", "Admin", "Hub", "FPS", "Tycoon", "Simulator", "RPG", "Other"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<ListScriptsSort>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: stats } = useGetScriptStats({
    query: { queryKey: getGetScriptStatsQueryKey() }
  });

  const { data: trendingScripts, isLoading: isLoadingTrending } = useGetTrendingScripts({
    query: { queryKey: getGetTrendingScriptsQueryKey() }
  });

  const queryParams = {
    page,
    limit: 12,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(category !== "All" && { category }),
    sort
  };

  const { data: scriptData, isLoading: isLoadingScripts } = useListScripts(queryParams, {
    query: { queryKey: getListScriptsQueryKey(queryParams) }
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-12">
      
      {/* Stats Hero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scripts", value: stats?.totalScripts, icon: LayoutGrid },
          { label: "Active Users", value: stats?.totalUsers, icon: Users },
          { label: "Total Likes", value: stats?.totalLikes, icon: ThumbsUp },
          { label: "Total Views", value: stats?.totalViews, icon: Eye },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-display font-bold">
              {stat.value !== undefined ? stat.value.toLocaleString() : "-"}
            </div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Trending Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-2xl font-bold font-display">
          <Flame className="w-8 h-8 text-primary" />
          <h2>Trending Now</h2>
        </div>
        
        {isLoadingTrending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingScripts?.slice(0, 4).map(script => (
              <ScriptCard key={script.id} script={script} />
            ))}
          </div>
        )}
      </div>

      {/* Main Browse Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold font-display flex-none">Browse Scripts</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(val: ListScriptsSort) => setSort(val)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingScripts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : scriptData?.scripts.length === 0 ? (
          <div className="py-24 text-center border border-dashed rounded-xl bg-muted/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No scripts found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any scripts matching your current filters. Try adjusting your search or category.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setCategory("All"); setSort("newest"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {scriptData?.scripts.map(script => (
                <ScriptCard key={script.id} script={script} />
              ))}
            </div>

            {/* Pagination */}
            {scriptData && scriptData.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 text-sm font-medium">
                  Page {page} of {scriptData.totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={page === scriptData.totalPages}
                  onClick={() => setPage(p => Math.min(scriptData.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
