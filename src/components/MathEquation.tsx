/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import katex from "katex";

interface MathEquationProps {
  math: string;
  block?: boolean;
  section?: string;
  title?: string;
  subValue?: string; // Optional raw variable value breakdown for engineer clarity
  compact?: boolean; // Compact mode for PDF pages
}

// Promise cache to prevent duplicate script elements in document head
let mathjaxLoadPromise: Promise<any> | null = null;

/**
 * Loads MathJax 3 from a public CDN with programmatic SVG output configuration.
 */
function loadMathJax(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("Server-side environment");
  
  const win = window as any;
  if (win.MathJax && win.MathJax.tex2svg) {
    return Promise.resolve(win.MathJax);
  }
  
  if (mathjaxLoadPromise) {
    return mathjaxLoadPromise;
  }
  
  mathjaxLoadPromise = new Promise((resolve, reject) => {
    // Configure MathJax BEFORE loading the main bundle script
    win.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global' // Share vector glyph definitions to prevent redundant path tags and bloat
      },
      startup: {
        ready: () => {
          win.MathJax.startup.defaultReady();
          resolve(win.MathJax);
        }
      }
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    script.id = "MathJax-script";
    script.onload = () => {
      if (win.MathJax && win.MathJax.tex2svg) {
        resolve(win.MathJax);
      }
    };
    script.onerror = (err) => {
      console.warn("MathJax CDN failed to load. Falling back to KaTeX offline engine.", err);
      reject(err);
    };
    document.head.appendChild(script);
  });
  
  return mathjaxLoadPromise;
}

export default function MathEquation({ 
  math, 
  block = true, 
  section, 
  title, 
  subValue, 
  compact = false 
}: MathEquationProps) {
  const [mathjaxReady, setMathjaxReady] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const win = window as any;
      return !!(win.MathJax && win.MathJax.tex2svg);
    }
    return false;
  });

  // Start loading MathJax on mount
  useEffect(() => {
    if (!mathjaxReady) {
      loadMathJax()
        .then(() => setMathjaxReady(true))
        .catch(() => {
          // Fail silently; KaTeX fallback is active
        });
    }
  }, [mathjaxReady]);

  // Unified math compiler pipeline
  const renderedContent = useMemo(() => {
    const win = window as any;
    if (mathjaxReady && win.MathJax && win.MathJax.tex2svg) {
      try {
        const container = win.MathJax.tex2svg(math, { display: block });
        return {
          type: "mathjax" as const,
          html: container.outerHTML
        };
      } catch (err) {
        console.error("MathJax compilation crash; resorting to KaTeX", err);
      }
    }

    // Secondary robust fallback for offline deployment or network blockages
    try {
      const html = katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
      return {
        type: "katex" as const,
        html: html
      };
    } catch (err) {
      console.error("KaTeX compilation crash; raw typesetting", err);
      return {
        type: "raw" as const,
        html: `<span class="font-mono text-xs break-all">${math}</span>`
      };
    }
  }, [math, block, mathjaxReady]);

  if (compact) {
    return (
      <div className="pdf-math-block my-0 p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg break-inside-avoid overflow-hidden max-w-full">
        <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-slate-200">
          {title && (
            <span className="text-[9px] font-extrabold text-slate-900 uppercase tracking-wider leading-snug">
              {title}
            </span>
          )}
          {section && (
            <span className="inline-flex items-center justify-center text-[8px] px-1.5 py-0.5 font-mono font-black bg-slate-900 text-white rounded shadow-sm uppercase tracking-wide leading-snug whitespace-nowrap align-middle">
              {section}
            </span>
          )}
        </div>
        
        {/* Scroll-protected mathematical display with absolute alignment */}
        <div 
          className="math-container py-1 text-slate-950 text-center leading-normal overflow-x-auto overflow-y-hidden w-full flex justify-center items-center"
          style={{ fontSize: "13px" }}
          dangerouslySetInnerHTML={{ __html: renderedContent.html }}
        />

        {subValue && (
          <div className="pt-1 border-t border-dashed border-slate-300 font-mono text-[9px] text-slate-800 flex items-center gap-1.5">
            <span className="font-sans text-[7.5px] uppercase font-black text-slate-700 bg-slate-200 px-1 py-0.5 rounded shrink-0">
              Result
            </span>
            <span className="text-slate-900 font-bold tracking-wide break-all">
              {subValue}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-6 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-xs space-y-4 break-inside-avoid overflow-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
        {title && (
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-snug">
            {title}
          </span>
        )}
        {section && (
          <span className="text-[10px] sm:text-[11px] px-2.5 py-1.5 font-mono font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-black border border-slate-800 rounded uppercase tracking-wide leading-snug inline-flex items-center justify-center text-center align-middle whitespace-nowrap">
            {section}
          </span>
        )}
      </div>
      
      {/* Mathematical expression container with responsive overflow styling */}
      <div 
        className={`math-container py-5 text-slate-950 dark:text-white font-sans leading-normal overflow-x-auto overflow-y-hidden w-full flex justify-center items-center ${
          block 
            ? "text-lg md:text-xl text-center font-semibold px-2" 
            : "text-base font-semibold inline-block"
        }`}
        dangerouslySetInnerHTML={{ __html: renderedContent.html }}
      />

      {subValue && (
        <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 font-mono text-sm text-slate-800 dark:text-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <span className="font-sans text-[11px] uppercase font-black text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 shrink-0">
            Parameter breakdown
          </span>
          <span className="text-slate-950 dark:text-white font-bold bg-white dark:bg-slate-800 px-3.5 py-2 rounded border-2 border-slate-300 dark:border-slate-600 tracking-wide break-all self-start md:self-auto">
            {subValue}
          </span>
        </div>
      )}
    </div>
  );
}
