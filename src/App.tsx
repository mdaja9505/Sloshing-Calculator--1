/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import { TankInputs } from "./types";
import { calculateSeismic } from "./seismicMath";
import SeismicInputs from "./components/SeismicInputs";
import TankDiagram from "./components/TankDiagram";
import SeismicReport from "./components/SeismicReport";
import { 
  Calculator, 
  Waves, 
  ShieldCheck, 
  Compass,
  Download,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Standard steel tank preset dictionary
const PRESETS: Record<string, TankInputs> = {
  reservoir: {
    unitSystem: "US",
    geometry: "rectangular",
    L: 60,
    B: 40,
    H_L: 16,
    H_w: 20,
    t_w: 0.375, // 3/8" steel plate
    f_y: 36000,  // 36 ksi
    gamma_L: 62.4,
    W_empty: 85000, // 85 kips empty weight
    S_DS: 1.20,
    S_D1: 0.90,
    S_1: 0.60,
    R_wi: 3.0,
    R_wc: 1.0,
  },
  industrial: {
    unitSystem: "US",
    geometry: "rectangular",
    L: 40,
    B: 30,
    H_L: 12,
    H_w: 14,
    t_w: 0.25,  // 1/4" steel plate
    f_y: 36000,
    gamma_L: 64.0,
    W_empty: 62000, // 62 kips empty weight
    S_DS: 0.80,
    S_D1: 0.64,
    S_1: 0.40,
    R_wi: 3.0,
    R_wc: 1.0,
  },
  chemical: {
    unitSystem: "SI",
    geometry: "rectangular",
    L: 8,
    B: 6,
    H_L: 4,
    H_w: 4.8,
    t_w: 8.0,   // 8 mm steel plate
    f_y: 250,    // 250 MPa yield
    gamma_L: 11.5,
    W_empty: 320.0, // 320 kN empty weight
    S_DS: 1.50,
    S_D1: 1.12,
    S_1: 0.75,
    R_wi: 3.0,
    R_wc: 1.0,
  },
  circular_process: {
    unitSystem: "US",
    geometry: "circular",
    L: 50, // Diameter D
    B: 0,  // Perpendicular width is hidden/not used
    H_L: 15,
    H_w: 18,
    t_w: 0.3125, // 5/16" steel plate
    f_y: 36000,
    gamma_L: 62.4,
    W_empty: 45000, // 45 kips empty weight
    S_DS: 1.15,
    S_D1: 0.85,
    S_1: 0.55,
    R_wi: 3.0,
    R_wc: 1.0,
  }
};

export default function App() {
  const [inputs, setInputs] = useState<TankInputs>(PRESETS.reservoir);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const triggerPdfDownloadRef = useRef<(() => void) | null>(null);

  // Compute results dynamically whenever inputs update
  const results = useMemo(() => {
    return calculateSeismic(inputs);
  }, [inputs]);

  const handleLoadPreset = (presetName: string) => {
    if (PRESETS[presetName]) {
      setInputs(PRESETS[presetName]);
    }
  };

  const handleGlobalDownloadPDF = () => {
    if (triggerPdfDownloadRef.current) {
      triggerPdfDownloadRef.current();
    } else {
      console.warn("PDF dynamic generator is not fully loaded in DOM.");
    }
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-[#F5F5F7] text-[#1D1D1F] print:bg-white pb-12 print:pb-0 selection:bg-[#007AFF]/10 selection:text-[#007AFF]" style={{ fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif" }}>
      
      {/* Upper Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1D1D1F] rounded-[10px] flex items-center justify-center text-white">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[13px] font-semibold text-[#1D1D1F] tracking-[-0.01em]">Seismic Steel Tank Calculator</h1>
                <span className="text-[10px] bg-[#F5F5F7] text-[#6E6E73] font-medium px-2 py-0.5 rounded-full leading-none">
                  ACI 350.3-20
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] font-normal tracking-normal">{inputs.geometry === "circular" ? "Circular" : "Rectangular"} Steel Tank · Base Shear &amp; Overturning Moments</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-[#34C759] font-medium text-[11px] py-1.5 px-3 bg-[#34C759]/[0.08] rounded-full select-none">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Steel Code Compliant</span>
            </div>
          </div>
        </div>
      </header>
 
       {/* Main Container Stage */}
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:pt-0 print:px-0 space-y-4 print:space-y-0 print:block">
         
         {/* Top welcome explanation card */}
         <Card className="border-black/[0.06] bg-white rounded-2xl print:hidden" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
           <CardContent className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
             <div className="space-y-2">
               <h2 className="text-[14px] font-semibold text-[#1D1D1F] flex items-center gap-2 tracking-[-0.01em]">
                 <Waves className="w-4 h-4 text-[#007AFF]" />
                 Steel Tank Dynamic Sloshing &amp; Stability Estimator
               </h2>
               <p className="text-[12px] text-[#86868B] leading-[1.6] max-w-3xl font-normal">
                 Per ACI 350.3-20 standard, fluid inside {inputs.geometry === "circular" ? "circular cylindrical" : "rectangular"} storage structures separates into a rigid <strong className="text-[#1D1D1F] font-medium">impulsive component</strong> and a sloshing <strong className="text-[#1D1D1F] font-medium">convective component</strong>. This engineering software analyzes peak base shear, convective periods, sloshing wave heights, and dynamic overturning moments.
               </p>
             </div>
             
             <div className="flex items-center gap-3 shrink-0">
               <div className="text-[11px] text-[#6E6E73] font-medium shrink-0 flex items-center justify-center gap-1.5 bg-[#F5F5F7] py-2 px-3.5 rounded-full select-none">
                 <Compass className="w-3.5 h-3.5 text-[#86868B]" />
                 Industrial Steel Containment
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Layout Grid: Left holds inputs, Right holds diagram */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
           
           {/* Inputs Section */}
           <section className="space-y-6 print:hidden">
             <SeismicInputs
               inputs={inputs}
               onChange={setInputs}
               onLoadPreset={handleLoadPreset}
             />
           </section>
 
           {/* Interactive Visual Block & Diagram */}
           <section className="space-y-6 lg:sticky lg:top-20 print:hidden">
             <div className="h-full">
               <TankDiagram
                 inputs={inputs}
                 results={results}
               />
             </div>
           </section>
         </div>
 
         {/* Audit Submittal Calculation Report */}
         <section className="col-span-full print:col-span-1 print:block print:p-0 print:m-0">
           <SeismicReport
             inputs={inputs}
             results={results}
             pdfProgress={pdfProgress}
             setPdfProgress={setPdfProgress}
             triggerPdfDownloadRef={triggerPdfDownloadRef}
           />
         </section>
         
       </main>
 
       {/* Bottom Footer */}
       <footer className="mt-12 text-center text-[11px] text-[#86868B] max-w-7xl mx-auto px-4 print:hidden font-normal space-y-1">
         <p>© 2026 Seismic Design Tool · ACI 350.3-20 · {inputs.geometry === "circular" ? "Circular" : "Rectangular"} Steel Tank Support</p>
         <p>Designed by Mohammed Aldaja | Email: <a href="mailto:mdaja@isatsb.com" className="hover:text-[#007AFF] transition-colors">mdaja@isatsb.com</a></p>
       </footer>
 
     </div>
  );
}
