import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function VideoShowcase() {
  const [activeModal, setActiveModal] = useState(null);

  const mainVideoId = "9oWT4xDMMpA";

  const gridVideos = [
    {
      id: "rA1P9AJnSiQ",
      title: "Value Proposition for Brokers & Investors",
      category: "Strategy & Workflows",
      description: "Discover how automated underwriting and real-time deal tracking optimize MCA, REI, and M&A deal execution."
    },
    {
      id: "56vTzQhSasQ",
      title: "Quick Start Onboarding Walkthrough",
      category: "User Guide",
      description: "Step-by-step guidance on signing in, branch routing, funding path selection, and accessing your project dashboard."
    },
    {
      id: "N4LZsyE91wA",
      title: "GLINFICO FOD Portal Virtual Tour",
      category: "Platform Intake",
      description: "Explore secured login protocols, applicant vetting, and streamlined deal intake for platform users."
    }
  ];

  const embedUrl = (id, autoplay = false) =>
    "https://" + ["www.youtube-nocookie.com", "embed", id].join("/") +
    "?rel=0&modestbranding=1" + (autoplay ? "&autoplay=1" : "");

  const watchUrl = (id) =>
    "https://" + ["www.youtube.com", "watch"].join("/") + "?v=" + id;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
              GLINFICO.FOD
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Platform Video Center
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Explore the platform, workflows, and user experience.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                Featured Presentation
              </p>
              <h2 className="text-xl font-bold sm:text-2xl">
                Platform Master Overview
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                MCA in 48 Hours | REI in 5 Days | M&A in 14 Days
              </p>
            </div>
            <a
              href={watchUrl(mainVideoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Watch on YouTube ↗
            </a>
          </div>

          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full border-0"
              src={embedUrl(mainVideoId)}
              title="GLINFICO.FOD Platform Master Overview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Explore Our Video Guides
            </h2>
            <p className="mt-2 text-slate-400">
              Select a presentation to watch it here or expand the player.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {gridVideos.map((video) => (
              <article
                key={video.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg transition hover:border-amber-500/60"
              >
                <div className="aspect-video bg-black">
                  <iframe
                    className="h-full w-full border-0"
                    src={embedUrl(video.id)}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {video.category}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{video.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                    {video.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveModal(video.id)}
                      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                    >
                      Expand Player ⤢
                    </button>
                    <a
                      href={watchUrl(video.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      YouTube ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-800 py-7 text-center text-sm text-slate-500">
          GLINFICO.FOD — Smarter routes to funding.
        </footer>
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm font-semibold text-slate-300">
                GLINFICO.FOD Video Player
              </p>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close video player"
                className="rounded-full bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
              >
                Close ✕
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                className="h-full w-full border-0"
                src={embedUrl(activeModal, true)}
                title="Expanded GLINFICO.FOD Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
