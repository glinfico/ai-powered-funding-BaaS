import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { generateDailyArticles, hasTodaysArticles, loadLatestArticles } from "@/utils/magazineGenerator";
import ArticleDetailModal from "@/components/magazine/ArticleDetailModal";
import TickerBar from "@/components/magazine/TickerBar";
import { RefreshCw, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS = {
  finance: "FINANCE",
  economy: "ECONOMY",
  insurance: "INSURANCE",
  retirement: "RETIREMENT",
  travel: "TRAVEL",
  "business consulting": "BUSINESS CONSULTING",
};

const NAV_ITEMS = ["FRONT PAGE", "FINANCE", "ECONOMY", "INSURANCE", "RETIREMENT", "TRAVEL", "BUSINESS CONSULTING"];

export default function FinVenturePro() {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeNav, setActiveNav] = useState("FRONT PAGE");
  const [generationProgress, setGenerationProgress] = useState(null);

  // ── Load articles ─────────────────────────────────────────────────────────
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["magazine-articles"],
    queryFn: loadLatestArticles,
    staleTime: 1000 * 60 * 5,
  });

  // ── Auto-generate today's articles if none exist ──────────────────────────
  const generateMutation = useMutation({
    mutationFn: () =>
      generateDailyArticles((progress) => setGenerationProgress(progress)),
    onSuccess: () => {
      setGenerationProgress(null);
      queryClient.invalidateQueries({ queryKey: ["magazine-articles"] });
    },
    onError: () => setGenerationProgress(null),
  });

  useEffect(() => {
    // On mount, check if we already have today's articles
    hasTodaysArticles().then((hasToday) => {
      if (!hasToday) generateMutation.mutate();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter by nav ─────────────────────────────────────────────────────────
  const filtered =
    activeNav === "FRONT PAGE"
      ? articles
      : articles.filter((a) => (a.category || "").toLowerCase() === activeNav.toLowerCase());

  const heroArticle = articles.find((a) => a.is_hero) || articles[0];
  const editorsPicks = articles.filter((a) => a.is_editors_pick && a.id !== heroArticle?.id).slice(0, 3);
  const wireArticles = activeNav === "FRONT PAGE" ? articles : filtered;

  const todayStr = format(new Date(), "EEEE, MMMM d, yyyy").toUpperCase();
  const isGenerating = generateMutation.isPending;

  return (
    <div className="bg-white min-h-screen font-serif">
      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <TickerBar articles={articles} />

      {/* ── MASTHEAD ─────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-black pt-4 pb-3 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top utility bar */}
          <div className="flex items-center justify-between text-[10px] font-sans tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-2">
            <span>{todayStr}</span>
            <div className="flex items-center gap-4">
              <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer"
                className="bg-black text-white px-2 py-0.5 hover:bg-slate-800 transition-colors">
                ACCESS GLINFICO PLATFORM →
              </a>
              <span className="cursor-pointer hover:text-black">ADVERTISE</span>
              <span className="cursor-pointer hover:text-black">EDITORIAL</span>
            </div>
          </div>

          {/* Logo + generate button */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-sans tracking-[0.3em] text-slate-400 mb-1">
                POWERED BY{" "}
                <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer"
                  className="text-black font-bold hover:underline">
                  GLINFICO / FINANCIAL OPERATIONS
                </a>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-none text-black">
                FinVenture Pro
              </h1>
              <div className="text-[11px] font-sans tracking-[0.4em] text-slate-500 mt-1">
                EST. 2024 · THE EXECUTIVE INTELLIGENCE MAGAZINE
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              {isGenerating && generationProgress && (
                <div className="text-xs font-sans text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating {generationProgress.category} ({generationProgress.step}/{generationProgress.total})…
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="font-sans text-xs border-black hover:bg-black hover:text-white"
                onClick={() => generateMutation.mutate()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                ) : (
                  <Zap className="w-3 h-3 mr-1.5" />
                )}
                {isGenerating ? "Generating…" : "Generate Today's Edition"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-300 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <nav className="flex gap-0 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`text-[11px] font-sans font-bold tracking-widest px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                  ${activeNav === item
                    ? "border-black text-black"
                    : "border-transparent text-slate-500 hover:text-black hover:border-slate-300"
                  }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

        {/* Loading / Generating state */}
        {(isLoading || isGenerating) && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <div className="text-center">
              <p className="font-bold text-xl text-black">
                {isGenerating ? "Generating Today's Edition…" : "Loading FinVenture Pro…"}
              </p>
              <p className="text-slate-500 text-sm font-sans mt-1">
                {isGenerating
                  ? `Claude is searching Bloomberg, Reuters & WSJ for today's top stories${generationProgress ? ` — writing ${generationProgress.category}` : ""}…`
                  : "Fetching latest articles…"}
              </p>
            </div>
          </div>
        )}

        {/* FRONT PAGE layout */}
        {activeNav === "FRONT PAGE" && heroArticle && (
          <>
            {/* Hero + Editor's Picks */}
            <div className="grid lg:grid-cols-3 gap-0 border-b border-slate-200 pb-8 mb-8">
              {/* Hero Article */}
              <div
                className="lg:col-span-2 lg:pr-8 lg:border-r border-slate-200 cursor-pointer group"
                onClick={() => setSelectedArticle(heroArticle)}
              >
                <span className="text-[10px] font-sans font-bold tracking-widest text-red-600 mb-2 block">
                  {CATEGORY_LABELS[heroArticle.category] || heroArticle.category?.toUpperCase()}
                </span>
                {heroArticle.image_url && (
                  <img
                    src={heroArticle.image_url}
                    alt={heroArticle.headline}
                    className="w-full h-64 lg:h-80 object-cover mb-4 group-hover:opacity-95 transition-opacity"
                  />
                )}
                <h2 className="text-3xl lg:text-4xl font-black text-black leading-tight mb-3 group-hover:text-slate-700 transition-colors">
                  {heroArticle.headline}
                </h2>
                <p className="text-slate-600 text-base leading-relaxed mb-3 font-sans">
                  {heroArticle.excerpt}
                </p>
                <p className="text-xs font-sans text-slate-400 tracking-wide">
                  By {heroArticle.author} · {heroArticle.published_date ? format(new Date(heroArticle.published_date), "MMM d, yyyy") : ""}
                </p>
              </div>

              {/* Editor's Picks sidebar */}
              <div className="lg:pl-8 mt-6 lg:mt-0">
                <div className="text-[10px] font-sans font-bold tracking-widest text-black border-b-2 border-black pb-1 mb-4">
                  EDITOR'S PICKS
                </div>
                <div className="space-y-5">
                  {editorsPicks.map((article) => (
                    <div
                      key={article.id}
                      className="cursor-pointer group border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <span className="text-[9px] font-sans font-bold tracking-widest text-red-600 mb-1 block">
                        {CATEGORY_LABELS[article.category] || article.category?.toUpperCase()}
                      </span>
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.headline}
                          className="w-full h-28 object-cover mb-2 group-hover:opacity-90 transition-opacity"
                        />
                      )}
                      <h3 className="text-base font-black text-black leading-tight group-hover:text-slate-700 transition-colors mb-1">
                        {article.headline}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <p className="text-[10px] font-sans text-slate-400 mt-1">By {article.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The Wire */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <div className="text-[10px] font-sans font-bold tracking-widest text-black border-b-2 border-black pb-1">
                  THE WIRE
                </div>
                <span className="text-[10px] font-sans text-slate-400 tracking-widest">
                  {wireArticles.length} STORIES TODAY
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wireArticles.map((article) => (
                  <WireCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                  />
                ))}
              </div>
            </div>

            {/* GLINFICO Sponsored Ad */}
            <div className="border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <div className="text-[9px] font-sans tracking-widest text-slate-400 mb-1">SPONSORED · GLINFICO</div>
                <h3 className="text-lg font-black text-black">Access the GLINFICO Financial Operations Platform</h3>
                <p className="text-sm font-sans text-slate-500 mt-1">Enterprise-grade tools for deal management, lender outreach, and business consulting.</p>
              </div>
              <a
                href="https://fod.glinfico.com/"
                target="_blank"
                rel="noreferrer"
                className="bg-black text-white font-sans font-bold text-sm px-5 py-2.5 whitespace-nowrap hover:bg-slate-800 transition-colors"
              >
                Visit fod.glinfico.com →
              </a>
            </div>
          </>
        )}

        {/* CATEGORY VIEW */}
        {activeNav !== "FRONT PAGE" && (
          <div>
            <div className="text-[10px] font-sans font-bold tracking-widest text-red-600 mb-1">{activeNav}</div>
            <h2 className="text-3xl font-black text-black border-b-2 border-black pb-2 mb-6">{activeNav}</h2>
            {filtered.length === 0 && !isLoading && !isGenerating && (
              <p className="text-slate-400 font-sans text-sm py-12 text-center">
                No articles in this category yet. Generate today's edition above.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <WireCard
                  key={article.id}
                  article={article}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t-4 border-black bg-black text-white py-8 px-4 lg:px-8 font-sans mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-black text-xl">FinVenture Pro</div>
            <div className="text-xs text-slate-400 tracking-widest mt-0.5">EST. 2024 · THE EXECUTIVE INTELLIGENCE MAGAZINE</div>
          </div>
          <div className="text-xs text-slate-400 text-center sm:text-right">
            <div>Powered by <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer" className="text-white font-bold hover:underline">GLINFICO FINANCIAL OPERATIONS</a></div>
            <div className="mt-1">© {new Date().getFullYear()} GLINFICO LP · bcd.glinfico.com</div>
          </div>
        </div>
      </footer>

      {/* ── ARTICLE MODAL ─────────────────────────────────────────────────── */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

function WireCard({ article, onClick }) {
  return (
    <div
      className="cursor-pointer group border-b border-slate-200 pb-5"
      onClick={onClick}
    >
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.headline}
          className="w-full h-44 object-cover mb-3 group-hover:opacity-90 transition-opacity"
        />
      )}
      <span className="text-[9px] font-sans font-bold tracking-widest text-red-600 mb-1 block">
        {(CATEGORY_LABELS[article.category] || article.category?.toUpperCase())}
      </span>
      <h3 className="text-base font-black text-black leading-snug group-hover:text-slate-700 transition-colors mb-1.5 line-clamp-3">
        {article.headline}
      </h3>
      {article.excerpt && (
        <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2 mb-2">
          {article.excerpt}
        </p>
      )}
      <p className="text-[10px] font-sans text-slate-400">
        By {article.author}
        {article.published_date && (
          <> · {format(new Date(article.published_date), "MMM d, yyyy")}</>
        )}
      </p>
    </div>
  );
}