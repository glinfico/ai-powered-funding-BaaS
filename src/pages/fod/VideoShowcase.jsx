import React from 'react';
import { Link } from 'react-router-dom';

export default function VideoShowcase() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold mb-4">GLINFICO.FOD Video Demos</h1>
      <p className="text-slate-300 mb-8">Our platform walkthroughs are being restored. Please check back shortly.</p>
      <Link to="/" className="rounded-full bg-amber-500 px-6 py-3 font-bold text-black">
        Back to GLINFICO.FOD Home
      </Link>
    </main>
  );
}
