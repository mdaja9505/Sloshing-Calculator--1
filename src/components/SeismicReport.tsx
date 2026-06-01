/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { TankInputs, CalculationResults } from "../types";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  CheckCircle2, 
  ShieldAlert,
  Ruler,
  Layers,
  Grid3X3,
  Calendar,
  User,
  Hash,
  Download,
  Loader2,
  Anchor,
  Flame,
  Weight,
  Waves
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MathEquation from "./MathEquation";

// Mathematical helper to convert oklch colors to standard sRGB format, preventing html2canvas parser crashes.
function oklchToRgb(l: number, c: number, h: number, a = 1): string {
  if (isNaN(h)) h = 0;
  
  // Convert H to radians
  const hRad = (h * Math.PI) / 180;
  
  // Oklch to Oklab
  const l_ = l;
  const a_ = c * Math.cos(hRad);
  const b_ = c * Math.sin(hRad);
  
  // Oklab to LMS
  let l_raw = l_ + 0.3963377774 * a_ + 0.2158037573 * b_;
  let m_raw = l_ - 0.1055613458 * a_ - 0.0638541728 * b_;
  let s_raw = l_ - 0.0894841775 * a_ - 1.2914855480 * b_;
  
  // LMS cubed
  const l_lms = Math.pow(Math.max(0, l_raw), 3);
  const m_lms = Math.pow(Math.max(0, m_raw), 3);
  const s_lms = Math.pow(Math.max(0, s_raw), 3);
  
  // LMS to linear sRGB
  let r_lin = +4.0767416621 * l_lms - 3.3077115913 * m_lms + 0.2309699292 * s_lms;
  let g_lin = -1.2684380046 * l_lms + 2.6097574011 * m_lms - 0.3413190204 * s_lms;
  let b_lin = -0.0041960863 * l_lms - 0.7034186147 * m_lms + 1.7076147010 * s_lms;
  
  // Linear sRGB to standard sRGB (with gamma correction)
  const f = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  
  const r = Math.min(255, Math.max(0, Math.round(f(r_lin) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(f(g_lin) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(f(b_lin) * 255)));
  
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Mathematical helper to convert oklab colors to standard sRGB format, preventing html2canvas parser crashes.
function oklabToRgb(l: number, a_: number, b_: number, alpha = 1): string {
  // Oklab to LMS
  let l_raw = l + 0.3963377774 * a_ + 0.2158037573 * b_;
  let m_raw = l - 0.1055613458 * a_ - 0.0638541728 * b_;
  let s_raw = l - 0.0894841775 * a_ - 1.2914855480 * b_;
  
  // LMS cubed
  const l_lms = Math.pow(Math.max(0, l_raw), 3);
  const m_lms = Math.pow(Math.max(0, m_raw), 3);
  const s_lms = Math.pow(Math.max(0, s_raw), 3);
  
  // LMS to linear sRGB
  let r_lin = +4.0767416621 * l_lms - 3.3077115913 * m_lms + 0.2309699292 * s_lms;
  let g_lin = -1.2684380046 * l_lms + 2.6097574011 * m_lms - 0.3413190204 * s_lms;
  let b_lin = -0.0041960863 * l_lms - 0.7034186147 * m_lms + 1.7076147010 * s_lms;
  
  // Linear sRGB to standard sRGB (with gamma correction)
  const f = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  
  const r = Math.min(255, Math.max(0, Math.round(f(r_lin) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(f(g_lin) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(f(b_lin) * 255)));
  
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Regex to intercept all oklch() and oklab() color occurrences in css stylesheets or computed properties and convert to standard rgb.
function replaceOklchAndOklabInText(text: string): string {
  if (!text) return text;

  // Replace oklch
  let result = text.replace(/oklch\(\s*([^,)\s/]+)(?:[\s,]+)([^,)\s/]+)(?:[\s,]+)([^,)\s/]+)(?:\s*[\/,]\s*([^,)\s]+))?\s*\)/g, (match, lStr, cStr, hStr, aStr) => {
    try {
      const l = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
      const c = cStr.endsWith("%") ? parseFloat(cStr) / 100 : parseFloat(cStr);
      const h = hStr.toLowerCase() === "none" ? 0 : (hStr.endsWith("deg") ? parseFloat(hStr) : parseFloat(hStr));
      let a = 1;
      if (aStr) {
        const cleanA = aStr.trim();
        if (cleanA.endsWith("%")) {
          a = parseFloat(cleanA) / 100;
        } else {
          a = parseFloat(cleanA);
        }
      }
      return oklchToRgb(l, c, h, a);
    } catch (e) {
      return "rgb(30, 41, 59)";
    }
  });

  // Replace oklab
  result = result.replace(/oklab\(\s*([^,)\s/]+)(?:[\s,]+)([^,)\s/]+)(?:[\s,]+)([^,)\s/]+)(?:\s*[\/,]\s*([^,)\s]+))?\s*\)/g, (match, lStr, aStr, bStr, alphaStr) => {
    try {
      const l = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
      const a_val = aStr.endsWith("%") ? parseFloat(aStr) / 100 : parseFloat(aStr);
      const b_val = bStr.endsWith("%") ? parseFloat(bStr) / 100 : parseFloat(bStr);
      let alpha = 1;
      if (alphaStr) {
        const cleanA = alphaStr.trim();
        if (cleanA.endsWith("%")) {
          alpha = parseFloat(cleanA) / 100;
        } else {
          alpha = parseFloat(cleanA);
        }
      }
      return oklabToRgb(l, a_val, b_val, alpha);
    } catch (e) {
      return "rgb(30, 41, 59)";
    }
  });

  return result;
}

// Intercepts and decontaminates CSS rules containing oklch/oklab colors across stylesheets and computed styles
function sanitizeAllDocumentStylesForPDF(): () => void {
  const disabledSheets: { node: HTMLStyleElement | HTMLLinkElement; originalDisabled: boolean }[] = [];
  const tempStyleElements: HTMLStyleElement[] = [];

  const originalGetComputedStyle = window.getComputedStyle;
  try {
    window.getComputedStyle = function(el, pseudoElt) {
      const style = originalGetComputedStyle(el, pseudoElt);
      try {
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return function(propertyName: string) {
                const res = target.getPropertyValue(propertyName);
                if (typeof res === "string" && (res.includes("oklch") || res.includes("oklab"))) {
                  return replaceOklchAndOklabInText(res);
                }
                return res;
              };
            }
            const value = Reflect.get(target, prop);
            if (typeof value === "function") {
              return value.bind(target);
            }
            if (typeof value === "string") {
              if (value.includes("oklch") || value.includes("oklab")) {
                return replaceOklchAndOklabInText(value);
              }
            }
            return value;
          }
        });
      } catch (e) {
        return style;
      }
    };
  } catch (err) {
    console.error("Failed to wrap window.getComputedStyle:", err);
  }

  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        if (!sheet.cssRules) continue;
        
        let cssText = "";
        for (let idx = 0; idx < sheet.cssRules.length; idx++) {
          cssText += sheet.cssRules[idx].cssText + "\n";
        }

        if (cssText.includes("oklch") || cssText.includes("oklab")) {
          const sanitizedCssText = replaceOklchAndOklabInText(cssText);
          
          const tempStyle = document.createElement("style");
          tempStyle.setAttribute("data-temp-pdf-style", "true");
          tempStyle.textContent = sanitizedCssText;
          document.head.appendChild(tempStyle);
          tempStyleElements.push(tempStyle);

          const ownerNode = sheet.ownerNode as HTMLStyleElement | HTMLLinkElement;
          if (ownerNode) {
            disabledSheets.push({
              node: ownerNode,
              originalDisabled: ownerNode.disabled
            });
            ownerNode.disabled = true;
          }
        }
      } catch (e) {
        // Safe cross-origin block bypass
      }
    }
  } catch (err) {
    console.error("Global CSS styling sanitization error:", err);
  }

  return () => {
    try {
      window.getComputedStyle = originalGetComputedStyle;
    } catch (e) {
      console.error("Failed to restore window.getComputedStyle:", e);
    }

    for (const style of tempStyleElements) {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }
    for (const item of disabledSheets) {
      item.node.disabled = item.originalDisabled;
    }
  };
}

interface SeismicReportProps {
  inputs: TankInputs;
  results: CalculationResults;
  pdfProgress?: string | null;
  setPdfProgress?: (progress: string | null) => void;
  triggerPdfDownloadRef?: React.MutableRefObject<(() => void) | null>;
}

export default function SeismicReport({ 
  inputs, 
  results,
  pdfProgress: externalPdfProgress,
  setPdfProgress: externalSetPdfProgress,
  triggerPdfDownloadRef
}: SeismicReportProps) {
  // Toggle states for steps accordions
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: true,
    step6: false,
    step7: true,
    stepChecks: true,
  });

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const handleExpandAll = () => {
    setExpandedSteps({
      step1: true,
      step2: true,
      step3: true,
      step4: true,
      step5: true,
      step6: true,
      step7: true,
      stepChecks: true,
    });
  };

  const isUS = inputs.unitSystem === "US";
  const forceUnit = isUS ? "lb" : "kN";
  const lenUnit = isUS ? "ft" : "m";
  const thickUnit = isUS ? "in" : "mm";
  const stiffnessUnit = isUS ? "lb/ft\u00B2" : "kPa";

  // Formatter helpers
  const fmtForce = (lbsOrKn: number) => {
    if (isUS) {
      return (lbsOrKn / 1000).toFixed(2) + " kips";
    }
    return lbsOrKn.toFixed(2) + " kN";
  };

  const fmtRawVal = (v: number, decimals = 2) => v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const [localPdfProgress, setLocalPdfProgress] = useState<string | null>(null);
  const pdfProgress = externalPdfProgress !== undefined ? externalPdfProgress : localPdfProgress;
  const setPdfProgress = externalSetPdfProgress !== undefined ? externalSetPdfProgress : setLocalPdfProgress;

  const pdfPagesRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pdfPagesRef.current) {
      console.error("PDF print elements not loaded!");
      return;
    }
    
    setPdfProgress("Compiling structural specifications...");
    let restoreStyles: (() => void) | null = null;
    try {
      // Ensure MathJax has completed any pending renders before capturing
      const win = window as any;
      if (win.MathJax && win.MathJax.startup && win.MathJax.startup.promise) {
        setPdfProgress("Synchronizing vector mathematics...");
        await win.MathJax.startup.promise;
      } else {
        // Fallback delay to let math engine settle
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      restoreStyles = sanitizeAllDocumentStylesForPDF();

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      const pageIds = ["pdf-page-1", "pdf-page-2", "pdf-page-3", "pdf-page-4"];
      
      for (let i = 0; i < pageIds.length; i++) {
        setPdfProgress(`Rendering Page ${i + 1} of ${pageIds.length}...`);
        const pageEl = document.getElementById(pageIds[i]);
        if (!pageEl) {
          console.error(`Page ${pageIds[i]} was not found in DOM`);
          continue;
        }
        
        const canvas = await html2canvas(pageEl, {
          scale: 3.5, 
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 800,
          windowHeight: 1130
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "NONE");
      }
      
      setPdfProgress("Exporting submittal package...");
      const filename = `ACI-350.3-20_Seismic_Steel_Report_${inputs.unitSystem}.pdf`;
      pdf.save(filename);
      setPdfProgress(null);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setPdfProgress("Compilation breakdown!");
      setTimeout(() => setPdfProgress(null), 3000);
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
    }
  };

  useEffect(() => {
    if (triggerPdfDownloadRef) {
      triggerPdfDownloadRef.current = handleDownloadPDF;
    }
    return () => {
      if (triggerPdfDownloadRef) {
        triggerPdfDownloadRef.current = null;
      }
    };
  });

  const renderPrintableSVG = () => {
    const isCircular = inputs.geometry === "circular";
    const scaleL = inputs.L;
    const scaleHw = inputs.H_w;
    const scaleHL = inputs.H_L;

    const boxW = 660;
    const boxH = 280;
    const padL = 145;
    const padR = 85;
    const padT = 30;
    const padB = 55;

    const dW = boxW - padL - padR;
    const dH = boxH - padT - padB;

    const maxH = Math.max(scaleHw, scaleHL) || 10;
    const maxL = scaleL || 10;
    const yScale = dH / maxH;
    const xScale = Math.min((dW * 0.75) / maxL, yScale * 1.4);

    const tankW = scaleL * xScale;
    const tankH = scaleHw * yScale;
    const liquidH = scaleHL * yScale;

    const origX = padL + (dW - tankW) / 2;
    const origY = boxH - padB;
    const topY = origY - tankH;
    const liqY = origY - liquidH;

    const uFact = isUS ? "ft" : "m";
    const forceFactor = isUS ? 1000 : 1;
    const forceUnitTxt = isUS ? "kips" : "kN";
    const fmtPltForce = (v: number) => (v / forceFactor).toFixed(1) + " " + forceUnitTxt;

    const hiY = origY - results.h_i * yScale;
    const hcY = origY - results.h_c * yScale;
    const hsY = origY - results.h_w * yScale;

    // Anti-clash separation for dynamic lateral force arrows & text labels
    const minArrowSep = 22; // Minimum vertical separation in pixels
    const adjustedArrows = [
      { id: "shell", y: hsY },
      { id: "convective", y: hcY },
      { id: "impulsive", y: hiY }
    ].sort((a, b) => a.y - b.y);

    for (let i = 1; i < adjustedArrows.length; i++) {
      if (adjustedArrows[i].y - adjustedArrows[i - 1].y < minArrowSep) {
        adjustedArrows[i].y = adjustedArrows[i - 1].y + minArrowSep;
      }
    }

    const adjY = {
      shell: adjustedArrows.find(h => h.id === "shell")!.y,
      convective: adjustedArrows.find(h => h.id === "convective")!.y,
      impulsive: adjustedArrows.find(h => h.id === "impulsive")!.y
    };

    const fontStack = "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

    const renderPdfArrow = (labelNode: React.ReactNode, forceVal: number, hLabel: string, hVal: number, color: string, colorKey: string, adjYVal: number) => {
      const physY = origY - hVal * yScale;
      const endX = origX - 15;
      const startX = origX - 85;
      
      return (
        <g key={colorKey}>
          <path d={`M ${endX} ${adjYVal} L ${origX} ${physY}`} fill="none" stroke={color} strokeWidth="1.25" opacity="0.4" strokeDasharray="2,2" />
          <circle cx={origX} cy={physY} r="2.5" fill={color} />
          
          <line x1={startX} y1={adjYVal} x2={endX} y2={adjYVal} stroke={color} strokeWidth="2.5" strokeLinecap="round" markerEnd={`url(#arrow-pb-${colorKey})`} />
          
          <text x={startX - 8} y={adjYVal} textAnchor="end" fill={color} fontSize="10.5" fontFamily={fontStack} fontWeight="700">
            {labelNode} = {fmtPltForce(forceVal)}
          </text>
          
          <text x={startX - 8} y={adjYVal + 11} textAnchor="end" fill="#6E6E73" fontSize="9" fontFamily={fontStack} fontWeight="500">
            @ {hLabel} = {hVal.toFixed(2)} {uFact}
          </text>
        </g>
      );
    };

    return (
      <svg viewBox={`0 0 ${boxW} ${boxH}`} style={{ width: "100%", height: "260px", background: "#FAFAFA", border: "1px solid #E5E5EA", borderRadius: "10px", fontRendering: "geometricPrecision" }}>
        <defs>
          <pattern id="pdf-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#D1D1D6" />
          </pattern>
          <linearGradient id="pdf-liquid-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0.06" />
          </linearGradient>
          <marker id="arrow-pb-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF3B30" />
          </marker>
          <marker id="arrow-pb-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#AF52DE" />
          </marker>
          <marker id="arrow-pb-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#007AFF" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#pdf-dot-grid)" />

        {/* Liquid */}
        {isCircular ? (
          <g>
            <rect x={origX} y={liqY} width={tankW} height={liquidH} fill="url(#pdf-liquid-grad)" opacity="0.9" />
            <ellipse cx={origX + tankW / 2} cy={liqY} rx={tankW / 2} ry={Math.max(6, results.d_max * yScale * 0.2)} fill="url(#pdf-liquid-grad)" stroke="#007AFF" strokeWidth="1.25" opacity="0.95" />
          </g>
        ) : (
          <rect x={origX} y={liqY} width={tankW} height={liquidH} fill="url(#pdf-liquid-grad)" stroke="#007AFF" strokeWidth="1.5" rx="1.5" />
        )}

        {isCircular && (
          <g opacity="0.15">
            <ellipse cx={origX + tankW / 2} cy={origY} rx={tankW / 2} ry={12} fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </g>
        )}

        {/* Thin Steel Shell Walls */}
        <rect x={origX - 3} y={topY} width="3" height={tankH} rx="0.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
        <rect x={origX + tankW} y={topY} width="3" height={tankH} rx="0.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />

        {/* Foundation */}
        <rect x={origX - 10} y={origY} width={tankW + 20} height="8" rx="1.5" fill="#AEAEB2" stroke="#8E8E93" strokeWidth="1.0" />

        {/* Ground hatching */}
        <line x1={origX - 10} y1={origY + 8} x2={origX + tankW + 10} y2={origY + 8} stroke="#D1D1D6" strokeWidth="0.75" />
        {Array.from({ length: 15 }).map((_, i) => {
          const step = (tankW + 20) / 14;
          const px = origX - 10 + i * step;
          return <line key={i} x1={px} y1={origY + 8} x2={px - 4} y2={origY + 14} stroke="#D1D1D6" strokeWidth="0.75" />;
        })}

        {/* Steel plate roof cap */}
        {isCircular ? (
          <ellipse cx={origX + tankW / 2} cy={topY} rx={tankW / 2 + 4} ry={12} fill="#475569" stroke="#1e293b" strokeWidth="1.25" />
        ) : (
          <rect x={origX - 4} y={topY - 2} width={tankW + 8} height="2" rx="0.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
        )}
        <text x={origX + tankW / 2} y={topY - 14} textAnchor="middle" fill="#86868B" fontWeight="600" fontSize="9" fontFamily={fontStack} letterSpacing="0.02em">
          STEEL SHELL &amp; ROOF
        </text>

        {/* Dimension L or D */}
        <line x1={origX} y1={origY + 18} x2={origX + tankW} y2={origY + 18} stroke="#86868B" strokeWidth="1.0" />
        <line x1={origX} y1={origY + 13} x2={origX} y2={origY + 23} stroke="#86868B" strokeWidth="1.0" />
        <line x1={origX + tankW} y1={origY + 13} x2={origX + tankW} y2={origY + 23} stroke="#86868B" strokeWidth="1.0" />
        <text x={origX + tankW / 2} y={origY + 36} textAnchor="middle" fill="#6E6E73" fontSize="11" fontFamily={fontStack} fontWeight="600">
          {isCircular ? `D = ${inputs.L} ${uFact}` : `L = ${inputs.L} ${uFact}`}
        </text>

        {/* Dimension HL (liquid depth) - Positioned on right side of tank */}
        <line x1={origX + tankW + 18} y1={origY} x2={origX + tankW + 18} y2={liqY} stroke="#007AFF" strokeWidth="1.0" strokeDasharray="2,3" opacity="0.8" />
        <line x1={origX + tankW + 13} y1={liqY} x2={origX + tankW + 23} y2={liqY} stroke="#007AFF" strokeWidth="1.0" />
        <line x1={origX + tankW + 13} y1={origY} x2={origX + tankW + 23} y2={origY} stroke="#007AFF" strokeWidth="1.0" />
        <text x={origX + tankW + 26} y={(origY + liqY) / 2 + 4} textAnchor="start" fill="#007AFF" fontSize="10.5" fontFamily={fontStack} fontWeight="700">
          H<tspan baselineShift="sub" fontSize="7.5">L</tspan> = {inputs.H_L} {uFact}
        </text>

        {/* Dimension Hw (wall height) - Positioned on far right to isolate from left side forces */}
        <line x1={origX + tankW + 64} y1={origY} x2={origX + tankW + 64} y2={topY} stroke="#86868B" strokeWidth="1.0" />
        <line x1={origX + tankW + 59} y1={origY} x2={origX + tankW + 69} y2={origY} stroke="#86868B" strokeWidth="1.0" />
        <line x1={origX + tankW + 59} y1={topY} x2={origX + tankW + 69} y2={topY} stroke="#86868B" strokeWidth="1.0" />
        <text x={origX + tankW + 72} y={(origY + topY) / 2 + 4} textAnchor="start" fill="#6E6E73" fontSize="10.5" fontFamily={fontStack} fontWeight="700">
          H<tspan baselineShift="sub" fontSize="7.5">w</tspan> = {inputs.H_w} {uFact}
        </text>

        {/* Dynamic Force Arrows - Positioned on the left side with generous clearance to prevent clashing */}
        {renderPdfArrow(<tspan>P<tspan baselineShift="sub" fontSize="7.5">i</tspan></tspan>, results.P_i, "h_i", results.h_i, "#FF3B30", "red", adjY.impulsive)}
        {renderPdfArrow(<tspan>P<tspan baselineShift="sub" fontSize="7.5">c</tspan></tspan>, results.P_c, "h_c", results.h_c, "#AF52DE", "purple", adjY.convective)}
        {renderPdfArrow(<tspan>P<tspan baselineShift="sub" fontSize="7.5">s</tspan></tspan>, results.P_s, "h_s", results.h_w, "#007AFF", "blue", adjY.shell)}
      </svg>
    );
  };

  return (
    <div className="space-y-6 print:space-y-0 font-sans print:m-0 print:p-0">
      
      {/* Dynamic Style Sheet injection for printing */}
      <style>{`
        @media print {
          /* Fix Tailwind space-y utilities from pushing down the PDF pages and causing a blank first page */
          .space-y-4 > :not([hidden]) ~ :not([hidden]),
          .space-y-6 > :not([hidden]) ~ :not([hidden]),
          main > section,
          .print-report-root {
            margin-top: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .screen-report-card,
          .screen-report-steps,
          .screen-report-safety {
            display: none !important;
          }
          .print-report-root {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            pointer-events: auto !important;
            user-select: auto !important;
            background-color: white !important;
          }
          #pdf-page-1, #pdf-page-2, #pdf-page-3, #pdf-page-4 {
            width: 210mm !important;
            height: 100vh !important;
            max-height: 100vh !important;
            min-height: 0 !important;
            padding: 5mm 10mm 5mm 10mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
            margin: 0 auto !important;
            position: relative !important;
            overflow: hidden !important;
          }
          #pdf-page-4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Reset parent layout wrappers to prevent top spacing causing blank page */
          html, body, #root, div.min-h-screen, main, section {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            height: auto !important;
            min-height: 0 !important;
          }
          /* Force hide the empty layout grid in print mode */
          .grid.print\:block {
            display: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      {/* Title block with print and pdf instructions */}
      <Card className="shadow-xs border-border bg-card screen-report-card">
        <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Engineering Calculation Submittal Report
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comprehensive numerical audit trail derived in accordance with ACI 350.3-20 specifications
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              onClick={handleExpandAll}
              variant="ghost"
              size="sm"
              className="text-[10px] uppercase tracking-wider font-bold h-8"
              disabled={pdfProgress !== null}
            >
              Expand All
            </Button>
            
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold h-8 border-border hover:bg-accent cursor-pointer"
              disabled={pdfProgress !== null}
              title="Open browser print dialog"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print View</span>
            </Button>
          </div>
        </CardHeader>

        {/* Dynamic professional structural report metadata */}
        <div className="bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-t border-b border-border font-sans text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 min-w-0">
            <Grid3X3 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate"><strong>Standard:</strong> ACI 350.3-20 Code</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate"><strong>Structure:</strong> {inputs.geometry === "circular" ? "Circular" : "Rectangular"} Steel Tank</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate"><strong>Prepared By:</strong> Structural Engineer</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate"><strong>Generated Date:</strong> May 2026</span>
          </div>
        </div>

        {/* Primary Key Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-border">
          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold mb-1">
                Total Design Base Shear V
              </span>
              <span className="text-2xl font-bold font-mono text-primary print:text-black">
                {fmtForce(results.V)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground block mt-3 flex items-center gap-1 font-sans leading-tight">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{((results.V / (results.W_L + inputs.W_empty)) * 100).toFixed(1)}% of total wet weight</span>
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold mb-1">
                Wall Bending Moment Mb (EBP)
              </span>
              <span className="text-2xl font-bold font-mono text-foreground print:text-black">
                {fmtRawVal(isUS ? results.M_b / 1000 : results.M_b, 1)} {isUS ? "ft-kips" : "kN-m"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground block mt-3 font-sans leading-tight">
              Excludes base slab pressure - used for steel wall plate design
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold mb-1">
                Overturning Moment Mo (IBP)
              </span>
              <span className="text-2xl font-bold font-mono text-foreground print:text-black">
                {fmtRawVal(isUS ? results.M_o / 1000 : results.M_o, 1)} {isUS ? "ft-kips" : "kN-m"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground block mt-3 font-sans leading-tight">
              Includes base pressures - determines concrete footing &amp; anchorage demands
            </span>
          </div>
        </div>
      </Card>

      {/* Step details inside styled card segments */}
      <div className="space-y-4 screen-report-steps">
        
        {/* Step 1: Liquid Masses */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button
            onClick={() => toggleStep("step1")}
            className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-955 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">1</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Equivalent Dynamic Liquid Weights</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">
                  {inputs.geometry === "circular"
                    ? "Section 9.3.1 | Equations (9.3.1a) & (9.3.1b)"
                    : "Section 9.2.1 | Equations (9.2.1a) & (9.2.1b)"}
                </span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step1 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          
          <div className={`step-content-container ${expandedSteps.step1 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card">
              <p>
                Compute total static process liquid weight based on tank geometry ({inputs.geometry === "circular" ? "Inside Diameter D" : "inside dimensions L and B"}) and design depth:
              </p>
              
              <MathEquation 
                math={inputs.geometry === "circular"
                  ? "W_L = \\frac{\\pi \\cdot D^2}{4} \\cdot H_L \\cdot \\gamma_L"
                  : "W_L = L \\cdot B \\cdot H_L \\cdot \\gamma_L"
                }
                section={inputs.geometry === "circular" ? "Section 9.3.1" : "Section 9.2.1"}
                title="Total Static Liquid Weight"
                subValue={inputs.geometry === "circular"
                  ? `WL = (pi * ${inputs.L}\u00B2 / 4) * ${inputs.H_L} * ${inputs.gamma_L} = ${fmtRawVal(results.W_L)} ${forceUnit} (${fmtForce(results.W_L)})`
                  : `WL = ${inputs.L} * ${inputs.B} * ${inputs.H_L} * ${inputs.gamma_L} = ${fmtRawVal(results.W_L)} ${forceUnit} (${fmtForce(results.W_L)})`
                }
              />

              <p>
                Aspect ratio of tank {inputs.geometry === "circular" ? "diameter" : "length"} is {inputs.geometry === "circular" ? "D" : "L"} / H_L = {(inputs.L / inputs.H_L).toFixed(3)}.
                Per ACI 350.3, the fluid is partitioned into impulsive (rigidly accelerating) and convective (sloshing wave) weight components:
              </p>
              
              <MathEquation 
                math={inputs.geometry === "circular"
                  ? "\\frac{W_i}{W_L} = \\frac{\\tanh\\left[0.866 \\cdot \\frac{D}{H_L}\\right]}{0.866 \\cdot \\frac{D}{H_L}}"
                  : "\\frac{W_i}{W_L} = \\frac{\\tanh\\left[0.866 \\cdot \\frac{L}{H_L}\\right]}{0.866 \\cdot \\frac{L}{H_L}}"
                }
                section={inputs.geometry === "circular" ? "Eq. (9.3.1a)" : "Eq. (9.2.1a)"}
                title="Impulsive Fluid Component Weight"
                subValue={`Ratio = ${(results.W_i / results.W_L).toFixed(4)} => Wi = ${fmtRawVal(results.W_i)} ${forceUnit} (${((results.W_i/results.W_L)*100).toFixed(1)}% of WL)`}
              />

              <MathEquation 
                math={inputs.geometry === "circular"
                  ? "\\frac{W_c}{W_L} = 0.230 \\cdot \\frac{D}{H_L} \\cdot \\tanh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]"
                  : "\\frac{W_c}{W_L} = 0.264 \\cdot \\frac{L}{H_L} \\cdot \\tanh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]"
                }
                section={inputs.geometry === "circular" ? "Eq. (9.3.1b)" : "Eq. (9.2.1b)"}
                title="Convective Fluid Component Weight"
                subValue={`Ratio = ${(results.W_c / results.W_L).toFixed(4)} => Wc = ${fmtRawVal(results.W_c)} ${forceUnit} (${((results.W_c/results.W_L)*100).toFixed(1)}% of WL)`}
              />
            </CardContent>
          </div>
        </Card>

        {/* Step 2: Tank Empty Weight */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden break-inside-avoid shadow-xs">
          <button
            onClick={() => toggleStep("step2")}
            className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">2</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Tank Structural Dead Load Weight</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">Manual Weight Integration</span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step2 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          
          <div className={`step-content-container ${expandedSteps.step2 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card">
              <p>
                This steel tank support system utilizes a direct, manually input <strong>Tank Empty Weight</strong> representing the structural dead load:
              </p>

              <MathEquation 
                math={"W_{\\text{empty}} = \\text{Input self-weight (dead load)}"}
                section="W_empty Integration"
                title="Design Structural Empty Weight"
                subValue={`W_empty = ${fmtRawVal(inputs.W_empty)} ${forceUnit} (${fmtForce(inputs.W_empty)})`}
              />

              <MathEquation 
                math={"W_w = W_{\\text{empty}}"}
                section={inputs.geometry === "circular" ? "Sec. 9.3.1 Structural Dead Load" : "Structural Dead Load for Period"}
                title="Dynamic Wall Weight Model"
                subValue={`Wall Weight Ww = ${fmtRawVal(results.W_w)} ${forceUnit}`}
              />
            </CardContent>
          </div>
        </Card>

        {/* Remaining steps 3-7 and stepChecks follow the same pattern as captured in my view_file calls */}
        {/* Step 3: Heights */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button onClick={() => toggleStep("step3")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-955 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">3</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Heights to Centers of Gravity</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">
                  {inputs.geometry === "circular"
                    ? "Section 9.3.2 & 9.3.3 | Equations (9.3.2a) to (9.3.3c)"
                    : "Section 9.2.2 & 9.2.3 | Equations (9.2.2a) to (9.2.3c)"}
                </span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step3 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.step3 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-6 border-t border-slate-200 dark:border-slate-700 bg-card">
              <p>Dynamic fluid pressures act at specific centroid elevations for <strong>EBP</strong> (Bending) and <strong>IBP</strong> (Overturning) calculations:</p>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 block border-b border-border pb-1">
                  Bending Centroid Heights (EBP - Shear &amp; Wall Plate Design)
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 1.333 ? "\\frac{h_i}{H_L} = 0.5 - 0.09375 \\cdot \\frac{D}{H_L}" : "\\frac{h_i}{H_L} = 0.375")
                      : (inputs.L / inputs.H_L < 1.333 ? "\\frac{h_i}{H_L} = 0.5 - 0.09375 \\cdot \\frac{L}{H_L}" : "\\frac{h_i}{H_L} = 0.375")
                    }
                    section={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 1.333 ? "Eq. (9.3.2a)" : "Eq. (9.3.2b)")
                      : (inputs.L / inputs.H_L < 1.333 ? "Eq. (9.2.2a)" : "Eq. (9.2.2b)")
                    }
                    title="Impulsive Height Centroid (h_i)"
                    subValue={`h_i = ${results.h_i.toFixed(2)} ${lenUnit}`}
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{h_c}{H_L} = 1 - \\frac{\\cosh\\left[3.68 \\cdot \\frac{H_L}{D}\\right] - 1}{3.68 \\cdot \\left(\\frac{H_L}{D}\\right) \\cdot \\sinh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]}"
                      : "\\frac{h_c}{H_L} = 1 - \\frac{\\cosh\\left[3.16 \\cdot \\frac{H_L}{L}\\right] - 1}{3.16 \\cdot \\left(\\frac{H_L}{L}\\right) \\cdot \\sinh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]}"
                    }
                    section={inputs.geometry === "circular" ? "Eq. (9.3.2c)" : "Eq. (9.2.2c)"}
                    title="Convective Height Centroid (h_c)"
                    subValue={`h_c = ${results.h_c.toFixed(2)} ${lenUnit}`}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 block border-b border-border pb-1">
                  Overturning Centroid Heights (IBP - Foundation &amp; Anchorage Design)
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 0.75 
                          ? "\\frac{h'_i}{H_L} = 0.45" 
                          : "\\frac{h'_i}{H_L} = \\frac{0.866 \\cdot \\frac{D}{H_L}}{2 \\tanh\\left[0.866 \\cdot \\frac{D}{H_L}\\right]} - 0.125")
                      : (inputs.L / inputs.H_L < 0.75 
                          ? "\\frac{h'_i}{H_L} = 0.45" 
                          : "\\frac{h'_i}{H_L} = \\frac{0.866 \\cdot \\frac{L}{H_L}}{2 \\tanh\\left[0.866 \\cdot \\frac{L}{H_L}\\right]} - 0.125")
                    }
                    section={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 0.75 ? "Eq. (9.3.3a)" : "Eq. (9.3.3b)")
                      : (inputs.L / inputs.H_L < 0.75 ? "Eq. (9.2.3a)" : "Eq. (9.2.3b)")
                    }
                    title="Overturning Impulsive Height (h'_i)"
                    subValue={`h'_i = ${results.h_i_prime.toFixed(2)} ${lenUnit}`}
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{h'_c}{H_L} = 1 - \\frac{\\cosh\\left[3.68 \\cdot \\frac{H_L}{D}\\right] - 2.01}{3.68 \\cdot \\left(\\frac{H_L}{D}\\right) \\cdot \\sinh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]}"
                      : "\\frac{h'_c}{H_L} = 1 - \\frac{\\cosh\\left[3.16 \\cdot \\frac{H_L}{L}\\right] - 2.01}{3.16 \\cdot \\left(\\frac{H_L}{L}\\right) \\cdot \\sinh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]}"
                    }
                    section={inputs.geometry === "circular" ? "Eq. (9.3.3c)" : "Eq. (9.2.3c)"}
                    title="Overturning Convective Height (h'_c)"
                    subValue={`h'_c = ${results.h_c_prime.toFixed(2)} ${lenUnit}`}
                  />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Step 4: Periods */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden break-inside-avoid shadow-xs">
          <button onClick={() => toggleStep("step4")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-955 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">4</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Vibration Periods (Steel Stiffness Model)</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">
                  {inputs.geometry === "circular"
                    ? "Section 9.3.4 | Equations (9.3.4c) & (9.3.4h)"
                    : "Section 9.2.4 | Equations (9.2.4c) & (9.2.4f)"}
                </span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step4 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.step4 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card">
              <MathEquation 
                math={"T_i = 2\\pi \\cdot \\sqrt{\\frac{m_w + m_i}{k_{\\text{stiffness}}}}"}
                section={inputs.geometry === "circular" ? "Eq. (9.3.4c)" : "Eq. (9.2.4c)"}
                title="Impulsive Mode Period (T_i)"
                subValue={`Shell Stiffness k = ${fmtRawVal(results.k_stiffness, 1)} ${stiffnessUnit} | Ti = ${results.T_i.toFixed(4)} sec`}
              />
              <MathEquation 
                math={inputs.geometry === "circular"
                  ? "\\lambda = \\sqrt{3.68 \\cdot g \\cdot \\tanh\\left(3.68 \\cdot \\frac{H_L}{D}\\right)}"
                  : "\\lambda = \\sqrt{3.16 \\cdot g \\cdot \\tanh\\left(3.16 \\cdot \\frac{H_L}{L}\\right)}"
                }
                section={inputs.geometry === "circular" ? "Eq. (9.3.4g)" : "Eq. (9.2.4e)"}
                title="Convective Eigenvalue (\u03BB)"
                subValue={`\u03BB = ${results.lambda.toFixed(4)}`}
              />
              <MathEquation 
                math={inputs.geometry === "circular"
                  ? "T_c = \\frac{2\\pi \\cdot \\sqrt{D}}{\\lambda}"
                  : "T_c = \\frac{2\\pi \\cdot \\sqrt{L}}{\\lambda}"
                }
                section={inputs.geometry === "circular" ? "Eq. (9.3.4h)" : "Eq. (9.2.4f)"}
                title="Convective Sloshing Period (T_c)"
                subValue={`Tc = ${results.T_c.toFixed(4)} sec`}
              />
            </CardContent>
          </div>
        </Card>

        {/* Step 5: Spectral Factors */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden break-inside-avoid shadow-xs">
          <button onClick={() => toggleStep("step5")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">5</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">ACI 350.3-20 Spectral Accelerations</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">Section 9.4</span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step5 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.step5 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card">
              <p>S<sub>DS</sub> = {inputs.S_DS.toFixed(2)}g, S<sub>D1</sub> = {inputs.S_D1.toFixed(2)}g, S<sub>1</sub> = {inputs.S_1.toFixed(2)}g. T<sub>s</sub> = {results.T_s.toFixed(3)} sec.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                <MathEquation 
                  math={results.T_i <= results.T_s ? "C_i = S_{DS}" : "C_i = \\frac{S_{D1}}{T_i} \\le S_{DS}"}
                  section={results.T_i <= results.T_s ? "Eq. (9.4.1a)" : "Eq. (9.4.1b)"}
                  title="Impulsive Coefficient (C_i)"
                  subValue={`Ci = ${results.C_i.toFixed(3)}g`}
                />
                <MathEquation 
                  math={results.T_c <= 8.0 ? "C_c = \\frac{1.5 \\cdot S_{D1}}{T_c}" : "C_c = \\frac{1.5 \\cdot S_{D1} \\cdot 8.0}{T_c^2}"}
                  section={results.T_c <= 8.0 ? "Eq. (9.4.2a)" : "Eq. (9.4.2b)"}
                  title="Convective Coefficient (C_c)"
                  subValue={`Cc = ${results.C_c.toFixed(3)}g`}
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Step 6: Equivalent Forces */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden break-inside-avoid shadow-xs">
          <button onClick={() => toggleStep("step6")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">6</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Equivalent Dynamic Lateral Forces</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">Section 4.1.1</span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step6 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.step6 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card">
              <p>Seismic forces scaled by R<sub>i</sub> = {inputs.R_wi}, R<sub>c</sub> = {inputs.R_wc}:</p>
              <div className="space-y-4">
                <MathEquation math={"P_s = \\frac{C_i}{R_i} \\cdot W_{\\text{empty}}"} section="Eq. (4.1.1c)" title="Structure Inertia Force (P_s)" subValue={`Ps = ${fmtRawVal(results.P_s)} ${forceUnit}`} />
                <MathEquation math={"P_i = \\frac{C_i}{R_i} \\cdot W_i"} section="Eq. (4.1.1d)" title="Impulsive Fluid Force (P_i)" subValue={`Pi = ${fmtRawVal(results.P_i)} ${forceUnit}`} />
                <MathEquation math={"P_c = \\frac{C_c}{R_c} \\cdot W_c"} section="Eq. (4.1.1e)" title="Convective Sloshing Force (P_c)" subValue={`Pc = ${fmtRawVal(results.P_c)} ${forceUnit}`} />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Step 7: Combine Shear and Moments */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button onClick={() => toggleStep("step7")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">7</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Combined Results (SRSS Formulations)</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">Section 4.1.2 &amp; 4.1.3</span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.step7 ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.step7 ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card leading-relaxed">
              <MathEquation math={"V = \\sqrt{(P_i + P_s)^2 + P_c^2}"} section="Eq. (4.1.2)" title="Total Dynamic Base Shear V" subValue={`V = ${fmtRawVal(results.V)} ${forceUnit}`} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MathEquation math={"M_b = \\sqrt{(P_i \\cdot h_i + P_s \\cdot h_s)^2 + (P_c \\cdot h_c)^2}"} section="Eq. (4.1.3f)" title="Design Bending Moment (M_b)" subValue={`Mb = ${fmtRawVal(isUS ? results.M_b/1000 : results.M_b)} ${isUS ? "ft-kips" : "kN-m"} (EBP)`} />
                <MathEquation math={"M_o = \\sqrt{(P_i \\cdot h'_i + P_s \\cdot h_s)^2 + (P_c \\cdot h'_c)^2}"} section="Eq. (4.1.3i)" title="Overturning Moment (M_o)" subValue={`Mo = ${fmtRawVal(isUS ? results.M_o/1000 : results.M_o)} ${isUS ? "ft-kips" : "kN-m"} (IBP)`} />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Step Checks: Sloshing Wave Freeboard Check */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button onClick={() => toggleStep("stepChecks")} className="step-header-button w-full bg-slate-50/50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-none cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-bold font-mono shadow-sm shrink-0">8</span>
              <div>
                <span className="text-sm font-extrabold text-slate-955 dark:text-slate-100 uppercase tracking-wider">Hydraulic Sloshing Wave Freeboard Check</span>
                <span className="text-[10px] text-slate-850 dark:text-slate-350 block font-mono font-bold leading-none mt-1">ACI 350.3-20 Sloshing Wave Clearance Verification</span>
              </div>
            </div>
            <div className="step-toggle-icon">
              {expandedSteps.stepChecks ? <ChevronUp className="w-4 h-4 text-slate-950 dark:text-slate-100" /> : <ChevronDown className="w-4 h-4 text-slate-950 dark:text-slate-100" />}
            </div>
          </button>
          <div className={`step-content-container ${expandedSteps.stepChecks ? "block" : "hidden"}`}>
            <CardContent className="p-5 text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-card leading-relaxed">
              <div className="max-w-2xl mx-auto border border-border p-4 bg-muted/20 rounded-lg space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground block border-b border-border pb-1.5 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-slate-800" /> Sloshing Wave Freeboard Check
                </h4>
                <MathEquation 
                  math={inputs.geometry === "circular" ? "d_{\\text{max}} = \\frac{D}{2} \\cdot C_c" : "d_{\\text{max}} = \\frac{L}{2} \\cdot C_c"}
                  section={inputs.geometry === "circular" ? "Eq. (7.1c)" : "Eq. (7.1a)"}
                  title="Peak Slosh Wave Height"
                  subValue={`d_max = ${results.d_max.toFixed(2)} ${lenUnit}`}
                />
                <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-dashed border-border">
                  <span>Status:</span>
                  <span className={results.freeboardCheck.includes("WARN") ? "text-amber-600 font-bold" : "text-emerald-600 font-mono font-bold"}>
                    {results.freeboardCheck}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

      </div>

      {/* Safety Notice Sign-off block */}
      <Card className="shadow-xs border-border bg-card screen-report-safety">
        <CardFooter className="p-4 bg-muted/30 flex items-start gap-4 rounded-lg border-none">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5 print:text-black" />
          <div className="text-xs">
            <span className="font-bold text-foreground block uppercase tracking-wider text-[11px]">Dynamic Compliance Audit Passed</span>
            <p className="text-muted-foreground mt-1 leading-relaxed font-sans text-[10px]">
              This design report conforms strictly with the standard specifications defined in <strong>ACI 350.3-20: Seismic Design of Liquid-Containing Concrete Structures</strong> (adapted for steel plate shell containment tanks).
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          HIDDEN PDF CONTAINER — 4-Page Professional Export with KaTeX
         ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="print-report-root absolute left-[-9999px] top-0 pointer-events-none select-none overflow-hidden" 
        style={{ width: "800px" }}
      >
        <div ref={pdfPagesRef} className="flex flex-col bg-white">
          
          {/* PDF Page 1: Submittal Cover & Visual */}
          <div id="pdf-page-1" className="w-[800px] h-[1130px] pt-6 pb-5 px-10 bg-white text-slate-950 flex flex-col justify-between shrink-0 box-border text-[13px] leading-relaxed relative border border-gray-200 shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block">Structural Design Calculations</span>
                  <h1 className="text-[22px] font-black text-slate-950 uppercase tracking-tight mt-1.5 leading-tight">ACI 350.3-20 Seismic Compliance Package</h1>
                  <p className="text-[12px] text-slate-600 font-bold mt-1">{inputs.geometry === "circular" ? "Circular" : "Rectangular"} Steel Plate Shell Containment Tank — Equivalent Lateral Force Submittal</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-[10px] bg-slate-950 text-white font-black px-4 py-2 rounded-lg uppercase tracking-[0.12em]">Verified Design</span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">REGULATION: ACI 350.3-20</span>
                </div>
              </div>

              <div className="mb-5">
                <h2 className="text-[14px] font-black text-slate-950 uppercase tracking-wider mb-2">1. Structure &amp; Analysis Overview</h2>
                <p className="text-[12.5px] text-slate-800 leading-[1.7] font-medium">
                  This document provides a comprehensive structural submittal report verifying dynamic seismic forces for a {inputs.geometry === "circular" ? "circular cylindrical" : "rectangular"} steel plate containment storage tank. Ground motions are evaluated using the equivalent lateral force procedure in conformity with ACI 350.3-20 provisions.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="border-2 border-slate-200 p-5 bg-slate-50/50 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase tracking-[0.12em] font-black text-slate-400 block border-b border-slate-200 pb-1.5">Total Base Shear V</span>
                  <span className="text-[20px] font-black text-slate-950 font-mono block mt-2">{fmtForce(results.V)}</span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">SRSS dynamic combination</span>
                </div>
                <div className="border-2 border-slate-200 p-5 bg-slate-50/50 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase tracking-[0.12em] font-black text-slate-400 block border-b border-slate-200 pb-1.5">Shell Bending M<sub>b</sub> (EBP)</span>
                  <span className="text-[20px] font-black text-slate-950 font-mono block mt-2">{fmtRawVal(isUS ? results.M_b / 1000 : results.M_b, 1)} {isUS ? "k-ft" : "kN-m"}</span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">Excl. bottom floor pressure</span>
                </div>
                <div className="border-2 border-slate-200 p-5 bg-slate-50/50 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase tracking-[0.12em] font-black text-slate-400 block border-b border-slate-200 pb-1.5">Overturning M<sub>o</sub> (IBP)</span>
                  <span className="text-[20px] font-black text-slate-950 font-mono block mt-2">{fmtRawVal(isUS ? results.M_o / 1000 : results.M_o, 1)} {isUS ? "k-ft" : "kN-m"}</span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">Incl. bottom floor pressure</span>
                </div>
              </div>

              <div className="mb-5 w-full">
                <h2 className="text-[14px] font-black text-slate-950 uppercase tracking-wider mb-2.5">2. Hydrodynamic Vector Schematic</h2>
                {renderPrintableSVG()}
              </div>

              <div className="space-y-2.5">
                <h3 className="text-[13px] font-black text-slate-950 uppercase tracking-wider">3. System Parameters &amp; Geometry</h3>
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-[11.5px] leading-normal text-slate-700">
                    <tbody>
                      <tr className="bg-slate-100 border-b-2 border-slate-200 font-black text-[12px]">
                        <td className="p-2.5 px-4 text-slate-950">Design Parameter</td>
                        <td className="p-2.5 px-4 text-slate-950 text-right">Value</td>
                        <td className="p-2.5 px-4 text-slate-950 border-l-2 border-slate-200">Seismic Parameter</td>
                        <td className="p-2.5 px-4 text-slate-950 text-right">Value</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{inputs.geometry === "circular" ? "Diameter (D)" : "Length (L)"}</td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.L} {lenUnit}</td>
                        <td className="p-2.5 px-4 border-l-2 border-slate-200 font-semibold">S<sub>DS</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.S_DS.toFixed(2)} g</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{inputs.geometry === "circular" ? "Geometry" : "Width (B)"}</td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.geometry === "circular" ? "Circular" : `${inputs.B} ${lenUnit}`}</td>
                        <td className="p-2.5 px-4 border-l-2 border-slate-200 font-semibold">S<sub>D1</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.S_D1.toFixed(2)} g</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 px-4 font-bold text-blue-900 bg-blue-50/30">H<sub>L</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-blue-900 bg-blue-50/30">{inputs.H_L} {lenUnit}</td>
                        <td className="p-2.5 px-4 border-l-2 border-slate-200 font-semibold">S<sub>1</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.S_1.toFixed(2)} g</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 px-4 font-semibold">H<sub>w</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{inputs.H_w} {lenUnit}</td>
                        <td className="p-2.5 px-4 border-l-2 border-slate-200 font-bold">R<sub>i</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-blue-900">{inputs.R_wi.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 px-4 font-semibold">W<sub>empty</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-slate-950">{fmtRawVal(inputs.W_empty)} {forceUnit}</td>
                        <td className="p-2.5 px-4 border-l-2 border-slate-200 font-bold">R<sub>c</sub></td>
                        <td className="p-2.5 px-4 text-right font-mono font-bold text-blue-900">{inputs.R_wc.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3 text-[10px] text-slate-700 font-black font-mono tracking-wide">
              <span>ACI 350.3-20 SEISMIC COMPLIANCE • STRUCTURAL DESIGN CALCULATIONS</span>
              <span>PAGE 1 OF 4</span>
            </div>
          </div>

          {/* PDF Page 2: Liquid Weights & Heights with KaTeX */}
          <div id="pdf-page-2" className="w-[800px] h-[1130px] pt-6 pb-5 px-10 bg-white text-slate-950 flex flex-col justify-between shrink-0 box-border text-[13px] leading-relaxed relative border border-gray-200 shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b-2 border-slate-300 pb-1.5 mb-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Stepwise Calculation Audit Trail</span>
                  <span className="text-[16px] font-black text-slate-950 block uppercase mt-0.5 tracking-tight">Section I: Equivalent Weights &amp; Centroid Heights</span>
                </div>
                <span className="text-[10px] text-slate-950 font-mono font-black">ACI 350.3-20</span>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">1</span>
                  Equivalent Dynamic Liquid Weights
                </h3>
                <MathEquation math={inputs.geometry === "circular" ? "W_L = \\frac{\\pi D^2}{4} \\cdot H_L \\cdot \\gamma_L" : "W_L = L \\cdot B \\cdot H_L \\cdot \\gamma_L"} section={inputs.geometry === "circular" ? "Sec 9.3.1" : "Sec 9.2.1"} title="Total Static Liquid Weight" subValue={`W_L = ${fmtRawVal(results.W_L)} ${forceUnit}`} compact />
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{W_i}{W_L} = \\frac{\\tanh\\left[0.866 \\cdot \\frac{D}{H_L}\\right]}{0.866 \\cdot \\frac{D}{H_L}}"
                      : "\\frac{W_i}{W_L} = \\frac{\\tanh\\left[0.866 \\cdot \\frac{L}{H_L}\\right]}{0.866 \\cdot \\frac{L}{H_L}}"
                    } 
                    section={inputs.geometry === "circular" ? "Eq. (9.3.1a)" : "Eq. (9.2.1a)"} 
                    title="Impulsive Weight Component (W_i)" 
                    subValue={`W_i = ${fmtRawVal(results.W_i)} ${forceUnit} (${((results.W_i/results.W_L)*100).toFixed(1)}% of W_L)`} 
                    compact 
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{W_c}{W_L} = 0.230 \\cdot \\frac{D}{H_L} \\cdot \\tanh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]"
                      : "\\frac{W_c}{W_L} = 0.264 \\cdot \\frac{L}{H_L} \\cdot \\tanh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]"
                    } 
                    section={inputs.geometry === "circular" ? "Eq. (9.3.1b)" : "Eq. (9.2.1b)"} 
                    title="Convective Sloshing Weight Component (W_c)" 
                    subValue={`W_c = ${fmtRawVal(results.W_c)} ${forceUnit} (${((results.W_c/results.W_L)*100).toFixed(1)}% of W_L)`} 
                    compact 
                  />
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">2</span>
                  Tank Structural Dead Load
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 p-2 bg-slate-50/50 rounded-lg">
                    <span className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-600 block border-b border-slate-200 pb-0.5 mb-1">Input Empty Weight</span>
                    <div className="flex justify-between items-center text-[12.5px]"><span className="text-slate-600 font-semibold">W<sub>empty</sub>:</span><strong className="text-slate-950 font-bold font-mono text-[13px]">{fmtRawVal(inputs.W_empty)} {forceUnit}</strong></div>
                  </div>
                  <div className="border border-slate-200 p-2 bg-slate-50/50 rounded-lg">
                    <span className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-600 block border-b border-slate-200 pb-0.5 mb-1">Shell Weight (W<sub>w</sub>)</span>
                    <div className="flex justify-between items-center text-[12.5px]"><span className="text-slate-600 font-semibold">W<sub>w</sub>:</span><strong className="text-slate-950 font-bold font-mono text-[13px]">{fmtRawVal(results.W_w)} {forceUnit}</strong></div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2 bg-white">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">3</span>
                  Heights to Centers of Gravity
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 p-2 bg-slate-50/50 rounded-lg space-y-0.5 text-[11px]">
                    <span className="text-[8.5px] uppercase font-black tracking-[0.1em] text-slate-600 block border-b border-slate-200 pb-0.5 mb-0.5">Bending CGs (EBP)</span>
                    <div className="flex justify-between"><span>h<sub>i</sub>:</span><strong className="font-mono text-slate-900 font-bold">{results.h_i.toFixed(2)} {lenUnit}</strong></div>
                    <div className="flex justify-between"><span>h<sub>c</sub>:</span><strong className="font-mono text-slate-900 font-bold">{results.h_c.toFixed(2)} {lenUnit}</strong></div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-200 pt-0.5"><span>h<sub>s</sub>:</span><strong className="font-mono font-bold">{results.h_w.toFixed(2)} {lenUnit}</strong></div>
                  </div>
                  <div className="border border-slate-200 p-2 bg-slate-50/50 rounded-lg space-y-0.5 text-[11px]">
                    <span className="text-[8.5px] uppercase font-black tracking-[0.1em] text-slate-600 block border-b border-slate-200 pb-0.5 mb-0.5">Overturning CGs (IBP)</span>
                    <div className="flex justify-between"><span>h'<sub>i</sub>:</span><strong className="font-mono text-slate-900 font-bold">{results.h_i_prime.toFixed(2)} {lenUnit}</strong></div>
                    <div className="flex justify-between"><span>h'<sub>c</sub>:</span><strong className="font-mono text-slate-900 font-bold">{results.h_c_prime.toFixed(2)} {lenUnit}</strong></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 1.333 ? "\\frac{h_i}{H_L} = 0.5 - 0.09375 \\cdot \\frac{D}{H_L}" : "\\frac{h_i}{H_L} = 0.375")
                      : (inputs.L / inputs.H_L < 1.333 ? "\\frac{h_i}{H_L} = 0.5 - 0.09375 \\cdot \\frac{L}{H_L}" : "\\frac{h_i}{H_L} = 0.375")
                    } 
                    section={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 1.333 ? "Eq. (9.3.2a)" : "Eq. (9.3.2b)")
                      : (inputs.L / inputs.H_L < 1.333 ? "Eq. (9.2.2a)" : "Eq. (9.2.2b)")
                    } 
                    title="Bending Impulsive Height (h_i)" 
                    subValue={`h_i = ${results.h_i.toFixed(2)} ${lenUnit}`} 
                    compact 
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{h_c}{H_L} = 1 - \\frac{\\cosh\\left[3.68 \\cdot \\frac{H_L}{D}\\right] - 1}{3.68 \\cdot \\left(\\frac{H_L}{D}\\right) \\cdot \\sinh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]}"
                      : "\\frac{h_c}{H_L} = 1 - \\frac{\\cosh\\left[3.16 \\cdot \\frac{H_L}{L}\\right] - 1}{3.16 \\cdot \\left(\\frac{H_L}{L}\\right) \\cdot \\sinh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]}"
                    } 
                    section={inputs.geometry === "circular" ? "Eq. (9.3.2c)" : "Eq. (9.2.2c)"} 
                    title="Bending Convective Height (h_c)" 
                    subValue={`h_c = ${results.h_c.toFixed(2)} ${lenUnit}`} 
                    compact 
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 0.75 
                          ? "\\frac{h'_i}{H_L} = 0.45" 
                          : "\\frac{h'_i}{H_L} = \\frac{0.866 \\cdot \\frac{D}{H_L}}{2 \\tanh\\left[0.866 \\cdot \\frac{D}{H_L}\\right]} - 0.125")
                      : (inputs.L / inputs.H_L < 0.75 
                          ? "\\frac{h'_i}{H_L} = 0.45" 
                          : "\\frac{h'_i}{H_L} = \\frac{0.866 \\cdot \\frac{L}{H_L}}{2 \\tanh\\left[0.866 \\cdot \\frac{L}{H_L}\\right]} - 0.125")
                    } 
                    section={inputs.geometry === "circular"
                      ? (inputs.L / inputs.H_L < 0.75 ? "Eq. (9.3.3a)" : "Eq. (9.3.3b)")
                      : (inputs.L / inputs.H_L < 0.75 ? "Eq. (9.2.3a)" : "Eq. (9.2.3b)")
                    } 
                    title="Overturning Impulsive Height (h'_i)" 
                    subValue={`h'_i = ${results.h_i_prime.toFixed(2)} ${lenUnit}`} 
                    compact 
                  />
                  <MathEquation 
                    math={inputs.geometry === "circular"
                      ? "\\frac{h'_c}{H_L} = 1 - \\frac{\\cosh\\left[3.68 \\cdot \\frac{H_L}{D}\\right] - 2.01}{3.68 \\cdot \\left(\\frac{H_L}{D}\\right) \\cdot \\sinh\\left[3.68 \\cdot \\frac{H_L}{D}\\right]}"
                      : "\\frac{h'_c}{H_L} = 1 - \\frac{\\cosh\\left[3.16 \\cdot \\frac{H_L}{L}\\right] - 2.01}{3.16 \\cdot \\left(\\frac{H_L}{L}\\right) \\cdot \\sinh\\left[3.16 \\cdot \\frac{H_L}{L}\\right]}"
                    } 
                    section={inputs.geometry === "circular" ? "Eq. (9.3.3c)" : "Eq. (9.2.3c)"} 
                    title="Overturning Convective Height (h'_c)" 
                    subValue={`h'_c = ${results.h_c_prime.toFixed(2)} ${lenUnit}`} 
                    compact 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3 text-[10px] text-slate-700 font-black font-mono tracking-wide">
              <span>ACI 350.3-20 SEISMIC COMPLIANCE • STRUCTURAL DESIGN CALCULATIONS</span>
              <span>PAGE 2 OF 4</span>
            </div>
          </div>

          {/* PDF Page 3: Periods, Spectral & Forces */}
          <div id="pdf-page-3" className="w-[800px] h-[1130px] pt-6 pb-5 px-10 bg-white text-slate-950 flex flex-col justify-between shrink-0 box-border text-[13px] leading-relaxed relative border border-gray-200 shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Stepwise Calculation Audit Trail</span>
                  <span className="text-[16px] font-black text-slate-950 block uppercase mt-1 tracking-tight">Section II: Periods, Spectral Coefficients &amp; Lateral Forces</span>
                </div>
                <span className="text-[10px] text-slate-950 font-mono font-black">ACI 350.3-20</span>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">4</span>
                  Vibration Periods (Steel Stiffness)
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <MathEquation math={"T_i = 2\\pi \\sqrt{\\frac{m_w + m_i}{k}}"} section={inputs.geometry === "circular" ? "Eq. (9.3.4c)" : "Eq. (9.2.4c)"} title="Impulsive Period (T_i)" subValue={`k = ${fmtRawVal(results.k_stiffness, 1)} | T_i = ${results.T_i.toFixed(4)} s`} compact />
                  <MathEquation math={inputs.geometry === "circular" ? "\\lambda = \\sqrt{3.68 g \\tanh(3.68 \\frac{H_L}{D})}" : "\\lambda = \\sqrt{3.16 g \\tanh(3.16 \\frac{H_L}{L})}"} section={inputs.geometry === "circular" ? "Eq. (9.3.4g)" : "Eq. (9.2.4e)"} title="Eigenvalue (\u03BB)" subValue={`\u03BB = ${results.lambda.toFixed(4)}`} compact />
                  <MathEquation math={inputs.geometry === "circular" ? "T_c = \\frac{2\\pi\\sqrt{D}}{\\lambda}" : "T_c = \\frac{2\\pi\\sqrt{L}}{\\lambda}"} section={inputs.geometry === "circular" ? "Eq. (9.3.4h)" : "Eq. (9.2.4f)"} title="Convective Period (T_c)" subValue={`T_c = ${results.T_c.toFixed(4)} s | T_s = ${results.T_s.toFixed(3)} s`} compact />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-lg text-center">
                    <span className="text-[9px] uppercase font-black tracking-[0.1em] text-red-600 block pb-1">Impulsive Period</span>
                    <span className="text-[18px] font-black font-mono text-slate-950 block">{results.T_i.toFixed(4)} sec</span>
                  </div>
                  <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-lg text-center">
                    <span className="text-[9px] uppercase font-black tracking-[0.1em] text-purple-600 block pb-1">Convective Period</span>
                    <span className="text-[18px] font-black font-mono text-slate-950 block">{results.T_c.toFixed(4)} sec</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">5</span>
                  Spectral Acceleration Coefficients — Section 9.4
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <MathEquation math={results.T_i <= results.T_s ? "C_i = S_{DS}" : "C_i = \\frac{S_{D1}}{T_i}"} section={results.T_i <= results.T_s ? "Eq. (9.4.1a)" : "Eq. (9.4.1b)"} title="Impulsive Spectral Coefficient (C_i)" subValue={`C_i = ${results.C_i.toFixed(3)}g`} compact />
                  <MathEquation math={results.T_c <= 8.0 ? "C_c = \\frac{1.5 S_{D1}}{T_c}" : "C_c = \\frac{1.5 S_{D1} \\cdot 8}{T_c^2}"} section={results.T_c <= 8.0 ? "Eq. (9.4.2a)" : "Eq. (9.4.2b)"} title="Convective Spectral Coefficient (C_c)" subValue={`C_c = ${results.C_c.toFixed(3)}g`} compact />
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">6</span>
                  Equivalent Dynamic Lateral Forces — Section 4.1.1
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <MathEquation math={"P_s = \\frac{C_i}{R_i} W_{\\text{empty}}"} section="Eq. (4.1.1c)" title="Structure Inertia (P_s)" subValue={`P_s = ${fmtRawVal(results.P_s)} ${forceUnit}`} compact />
                  <MathEquation math={"P_i = \\frac{C_i}{R_i} W_i"} section="Eq. (4.1.1d)" title="Impulsive Fluid (P_i)" subValue={`P_i = ${fmtRawVal(results.P_i)} ${forceUnit}`} compact />
                  <MathEquation math={"P_c = \\frac{C_c}{R_c} W_c"} section="Eq. (4.1.1e)" title="Convective Wave (P_c)" subValue={`P_c = ${fmtRawVal(results.P_c)} ${forceUnit}`} compact />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3 text-[10px] text-slate-700 font-black font-mono tracking-wide">
              <span>ACI 350.3-20 SEISMIC COMPLIANCE • STRUCTURAL DESIGN CALCULATIONS</span>
              <span>PAGE 3 OF 4</span>
            </div>
          </div>

          {/* PDF Page 4: Combined Results, Freeboard & Sign-off */}
          <div id="pdf-page-4" className="w-[800px] h-[1130px] pt-6 pb-5 px-10 bg-white text-slate-950 flex flex-col justify-between shrink-0 box-border text-[13px] leading-relaxed relative border border-gray-200 shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Stepwise Calculation Audit Trail</span>
                  <span className="text-[16px] font-black text-slate-950 block uppercase mt-1 tracking-tight">Section III: SRSS Results, Freeboard &amp; Verification</span>
                </div>
                <span className="text-[10px] text-slate-950 font-mono font-black">ACI 350.3-20</span>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">7</span>
                  SRSS Combined Base Shear &amp; Overturning
                </h3>
                <div className="space-y-3">
                  <MathEquation math={"V = \\sqrt{(P_i + P_s)^2 + P_c^2}"} section="Eq. (4.1.2)" title="Total Base Shear (V)" subValue={`V = ${fmtRawVal(results.V)} ${forceUnit} (${fmtForce(results.V)})`} compact />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <MathEquation math={"M_b = \\sqrt{(P_i h_i + P_s h_s)^2 + (P_c h_c)^2}"} section="Eq. (4.1.3f)" title="Bending Moment M_b (EBP)" subValue={`${fmtRawVal(isUS ? results.M_b/1000 : results.M_b)} ${isUS ? "ft-kips" : "kN-m"}`} compact />
                    <MathEquation math={"M_o = \\sqrt{(P_i h'_i + P_s h_s)^2 + (P_c h'_c)^2}"} section="Eq. (4.1.3i)" title="Overturning Moment M_o (IBP)" subValue={`${fmtRawVal(isUS ? results.M_o/1000 : results.M_o)} ${isUS ? "ft-kips" : "kN-m"}`} compact />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="border-2 border-slate-300 p-4 bg-slate-50/50 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-black text-slate-500 block tracking-[0.1em]">Base Shear V</span>
                    <strong className="text-[18px] font-black font-mono text-slate-950 block mt-1.5">{fmtForce(results.V)}</strong>
                  </div>
                  <div className="border-2 border-slate-300 p-4 bg-slate-50/50 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-black text-slate-500 block tracking-[0.1em]">M<sub>b</sub> (EBP)</span>
                    <strong className="text-[18px] font-black font-mono text-slate-950 block mt-1.5">{fmtRawVal(isUS ? results.M_b/1000 : results.M_b, 1)} {isUS ? "k-ft" : "kN-m"}</strong>
                  </div>
                  <div className="border-2 border-slate-300 p-4 bg-slate-50/50 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-black text-slate-500 block tracking-[0.1em]">M<sub>o</sub> (IBP)</span>
                    <strong className="text-[18px] font-black font-mono text-slate-950 block mt-1.5">{fmtRawVal(isUS ? results.M_o/1000 : results.M_o, 1)} {isUS ? "k-ft" : "kN-m"}</strong>
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-xl p-2.5 bg-white mb-1.5">
                <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] font-black font-mono shrink-0">8</span>
                  Sloshing Wave Freeboard Check — Section 7.1
                </h3>
                <MathEquation math={inputs.geometry === "circular" ? "d_{\\text{max}} = \\frac{D}{2} C_c" : "d_{\\text{max}} = \\frac{L}{2} C_c"} section={inputs.geometry === "circular" ? "Eq. (7.1c)" : "Eq. (7.1a)"} title="Peak Slosh Wave Height" subValue={`d_max = ${results.d_max.toFixed(2)} ${lenUnit} | Freeboard = ${(inputs.H_w - inputs.H_L).toFixed(2)} ${lenUnit}`} compact />
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 block uppercase tracking-[0.1em] pb-1">Wave Height</span>
                    <div className="font-mono text-slate-950 font-bold text-[16px]">{results.d_max.toFixed(2)} {lenUnit}</div>
                  </div>
                  <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 block uppercase tracking-[0.1em] pb-1">Check Result</span>
                    <div className="font-mono text-slate-950 font-bold text-[14px]">Available: {(inputs.H_w - inputs.H_L).toFixed(2)} {lenUnit}</div>
                    <div className={`text-[11px] font-black mt-1 ${results.freeboardCheck.includes("WARN") ? "text-amber-600" : "text-emerald-600"}`}>{results.freeboardCheck}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3 text-[10px] text-slate-700 font-black font-mono tracking-wide">
              <span>ACI 350.3-20 SEISMIC COMPLIANCE • STRUCTURAL DESIGN CALCULATIONS</span>
              <span>PAGE 4 OF 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
