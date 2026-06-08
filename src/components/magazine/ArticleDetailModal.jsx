import { X } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_LABELS = {
  finance: "FINANCE",
  economy: "ECONOMY",
  insurance: "INSURANCE",
  retirement: "RETIREMENT",
  travel: "TRAVEL",
  "business consulting": "BUSINESS CONSULTING",
};

export default function ArticleDetailModal({ article, onClose }) {
  if (!article) return null;

  const paragraphs = (article.body || "").split("\n\n").filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full shadow-2xl font-serif relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-1.5 shadow hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        {/* Hero Image */}
        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.headline}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-8">
          {/* Category */}
          <span className="text-[10px] font-sans font-bold tracking-widest text-red-600 mb-2 block">
            {CATEGORY_LABELS[article.category] || article.category?.toUpperCase()}
          </span>

          {/* Headline */}
          <h1 className="text-3xl font-black text-black leading-tight mb-4">
            {article.headline}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg text-slate-600 font-sans leading-relaxed border-l-4 border-black pl-4 mb-5 italic">
              {article.excerpt}
            </p>
          )}

          {/* Byline */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold font-sans">
              {(article.author || "A").charAt(0)}
            </div>
            <div>
              <p className="text-sm font-sans font-bold text-black">{article.author}</p>
              <p className="text-xs font-sans text-slate-400">
                {article.published_date
                  ? format(new Date(article.published_date), "MMMM d, yyyy")
                  : ""}{" "}
                · FinVenture Pro
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-base text-slate-800 leading-relaxed font-sans">
                {p}
              </p>
            ))}
          </div>

          {/* Source note */}
          {article.source_context && (
            <div className="mt-8 pt-4 border-t border-slate-200">
              <p className="text-[10px] font-sans text-slate-400 tracking-wide">
                📡 {article.source_context}
              </p>
            </div>
          )}

          {/* Ad unit */}
          <div className="mt-8 bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[9px] font-sans tracking-widest text-slate-400">SPONSORED · GLINFICO</div>
              <div className="text-sm font-black text-black font-serif">Access the GLINFICO Financial Operations Platform</div>
            </div>
            <a
              href="https://fod.glinfico.com/"
              target="_blank"
              rel="noreferrer"
              className="bg-black text-white font-sans font-bold text-xs px-4 py-2 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              fod.glinfico.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}