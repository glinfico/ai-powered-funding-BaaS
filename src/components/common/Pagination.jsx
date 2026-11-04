import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalRecords, pageSize }) {
  if (totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
      <div>
        Showing <span className="text-white font-semibold">{startRecord}</span> to <span className="text-white font-semibold">{endRecord}</span> of <span className="text-white font-semibold">{totalRecords}</span> indexed records
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed p-2 rounded-xl text-slate-300 flex items-center gap-1 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold">
          Page {currentPage} of {totalPages}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed p-2 rounded-xl text-slate-300 flex items-center gap-1 transition-all"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
