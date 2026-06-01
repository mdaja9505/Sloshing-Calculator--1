/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TankInputs, UnitSystem } from "../types";
import { 
  Ruler, 
  Settings2, 
  Anchor, 
  HelpCircle, 
  Lightbulb,
  Sparkles,
  Layers,
  Weight,
  Flame,
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SeismicInputsProps {
  inputs: TankInputs;
  onChange: (inputs: TankInputs) => void;
  onLoadPreset: (presetName: string) => void;
}

export default function SeismicInputs({ inputs, onChange, onLoadPreset }: SeismicInputsProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let typedValue: any = value;
    
    if (type === "number") {
      typedValue = value === "" ? 0 : parseFloat(value);
    }
    
    onChange({
      ...inputs,
      [name]: typedValue
    });
  };

  const handleUnitToggle = (sys: UnitSystem) => {
    if (inputs.unitSystem === sys) return;

    const isToSI = sys === "SI";
    const ftToM = 0.3048;
    const inToMm = 25.4;
    const psiToMpa = 0.006895;
    const pcfToKnm3 = 0.1571;
    const lbToKn = 0.00444822;

    onChange({
      ...inputs,
      unitSystem: sys,
      L: isToSI ? parseFloat((inputs.L * ftToM).toFixed(2)) : parseFloat((inputs.L / ftToM).toFixed(1)),
      B: isToSI ? parseFloat((inputs.B * ftToM).toFixed(2)) : parseFloat((inputs.B / ftToM).toFixed(1)),
      H_L: isToSI ? parseFloat((inputs.H_L * ftToM).toFixed(2)) : parseFloat((inputs.H_L / ftToM).toFixed(1)),
      H_w: isToSI ? parseFloat((inputs.H_w * ftToM).toFixed(2)) : parseFloat((inputs.H_w / ftToM).toFixed(1)),
      t_w: isToSI ? parseFloat((inputs.t_w * inToMm).toFixed(1)) : parseFloat((inputs.t_w / inToMm).toFixed(3)),
      f_y: isToSI ? parseFloat((inputs.f_y * psiToMpa).toFixed(1)) : parseFloat((inputs.f_y / psiToMpa).toFixed(0)),
      gamma_L: isToSI ? parseFloat((inputs.gamma_L * pcfToKnm3).toFixed(2)) : parseFloat((inputs.gamma_L / pcfToKnm3).toFixed(1)),
      W_empty: isToSI ? parseFloat((inputs.W_empty * lbToKn).toFixed(2)) : parseFloat((inputs.W_empty / lbToKn).toFixed(0)),
    });
  };

  const currentUnitLabel = (usLabel: string, siLabel: string) => {
    return inputs.unitSystem === "US" ? usLabel : siLabel;
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Controls & Presets Header Card */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-[15px] sm:text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary animate-spin-slow" />
              Design Parameters
            </CardTitle>
            <CardDescription className="text-xs sm:text-[11px] text-muted-foreground leading-relaxed">
              Configure rectangular or circular steel tank geometry, material properties, and simplified seismic spectral coefficients.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-4 items-center shrink-0">
            {/* Geometry switch */}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">Tank Geometry</span>
              <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => onChange({ ...inputs, geometry: "rectangular" })}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    inputs.geometry === "rectangular"
                      ? "bg-background text-primary shadow-xs font-mono"
                      : "text-muted-foreground hover:text-foreground font-sans"
                  }`}
                >
                  Rectangular
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...inputs, geometry: "circular" })}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    inputs.geometry === "circular"
                      ? "bg-background text-primary shadow-xs font-mono"
                      : "text-muted-foreground hover:text-foreground font-sans"
                  }`}
                >
                  Circular
                </button>
              </div>
            </div>

            {/* Units switch */}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">Unit System</span>
              <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => handleUnitToggle("US")}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    inputs.unitSystem === "US"
                      ? "bg-background text-primary shadow-xs font-mono"
                      : "text-muted-foreground hover:text-foreground font-sans"
                  }`}
                >
                  US Standard
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle("SI")}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    inputs.unitSystem === "SI"
                      ? "bg-background text-primary shadow-xs font-mono"
                      : "text-muted-foreground hover:text-foreground font-sans"
                  }`}
                >
                  International
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Dynamic Preset Switcher Panel */}
        <div className="px-4 pb-4 pt-1 flex flex-wrap items-center gap-2 border-t border-border bg-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => onLoadPreset("reservoir")}
            className="px-2.5 py-1 text-[11px] font-semibold uppercase font-sans bg-background hover:bg-muted text-foreground border border-border rounded-md shadow-2xs transition cursor-pointer"
          >
            Industrial Reservoir (US)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset("industrial")}
            className="px-2.5 py-1 text-[11px] font-semibold uppercase font-sans bg-background hover:bg-muted text-foreground border border-border rounded-md shadow-2xs transition cursor-pointer"
          >
            Wastewater Steel Tank (US)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset("chemical")}
            className="px-2.5 py-1 text-[11px] font-semibold uppercase font-sans bg-background hover:bg-muted text-foreground border border-border rounded-md shadow-2xs transition cursor-pointer"
          >
            Chemical Process (SI)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset("circular_process")}
            className="px-2.5 py-1 text-[11px] font-bold uppercase font-sans bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md shadow-2xs transition cursor-pointer"
          >
            Circular Process (US)
          </button>
        </div>
      </Card>
 
       {/* 1. Tank Geometry Card */}
       <Card className="shadow-xs border-border bg-card">
         <CardHeader className="bg-muted/30 px-4 py-2 border-b border-border">
           <CardTitle className="font-heading font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2">
             <Ruler className="w-4 h-4 text-muted-foreground" />
             1. Tank Geometry & Dimensions
           </CardTitle>
         </CardHeader>
         <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="flex flex-col gap-1.5">
             <div className="flex justify-between items-baseline">
               <Label htmlFor="L" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                 {inputs.geometry === "circular" ? "Inside Diameter D" : "Length L (Parallel to Shear)"}
               </Label>
               <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("ft", "m")}</span>
             </div>
             <Input
               id="L"
               type="number"
               step="0.1"
               name="L"
               value={inputs.L}
               onChange={handleInputChange}
               className="font-mono text-xs dark:bg-input/20 h-9"
             />
             <p className="text-[9px] text-muted-foreground leading-none">
               {inputs.geometry === "circular" ? "Inside diameter of the circular container" : "Inside width parallel to earthquake forces"}
             </p>
           </div>
 
           {inputs.geometry === "rectangular" && (
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between items-baseline">
                 <Label htmlFor="B" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Width B (Perpendicular)</Label>
                 <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("ft", "m")}</span>
               </div>
               <Input
                 id="B"
                 type="number"
                 step="0.1"
                 name="B"
                 value={inputs.B}
                 onChange={handleInputChange}
                 className="font-mono text-xs dark:bg-input/20 h-9"
               />
               <p className="text-[9px] text-muted-foreground leading-none">Inside width perpendicular to forces</p>
             </div>
           )}
 
           <div className="flex flex-col gap-1.5">
             <div className="flex justify-between items-baseline">
               <Label htmlFor="H_L" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liquid Depth H_L</Label>
               <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("ft", "m")}</span>
             </div>
             <Input
               id="H_L"
               type="number"
               step="0.1"
               name="H_L"
               value={inputs.H_L}
               onChange={handleInputChange}
               className="font-mono text-xs dark:bg-input/20 h-9"
             />
             <p className="text-[9px] text-muted-foreground leading-none">Effective depth of stored process fluid</p>
           </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="H_w" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wall Height H_w</Label>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("ft", "m")}</span>
            </div>
            <Input
              id="H_w"
              type="number"
              step="0.1"
              name="H_w"
              value={inputs.H_w}
              onChange={handleInputChange}
              className="font-mono text-xs dark:bg-input/20 h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-none">Inside vertical height of steel shell</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="t_w" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shell Plate Thickness t_s</Label>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("in", "mm")}</span>
            </div>
            <Input
              id="t_w"
              type="number"
              step="0.0625"
              name="t_w"
              value={inputs.t_w}
              onChange={handleInputChange}
              className="font-mono text-xs dark:bg-input/20 h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-none">Steel wall plate thickness for buckling checks</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Material Grade & Weights Card */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader className="bg-muted/30 px-4 py-2 border-b border-border">
          <CardTitle className="font-heading font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            2. Material Properties & Steel Support Weights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="f_y" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Steel Yield Strength f_y</Label>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("psi", "MPa")}</span>
            </div>
            <Input
              id="f_y"
              type="number"
              step="1000"
              name="f_y"
              value={inputs.f_y}
              onChange={handleInputChange}
              className="font-mono text-xs dark:bg-input/20 h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-none">Typically 36,000 psi (ASTM A36) or 250 MPa</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="gamma_L" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liquid Density γ_L</Label>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("lb/ft³", "kN/m³")}</span>
            </div>
            <Input
              id="gamma_L"
              type="number"
              step="0.1"
              name="gamma_L"
              value={inputs.gamma_L}
              onChange={handleInputChange}
              className="font-mono text-xs dark:bg-input/20 h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-none">Typically 62.4 pcf or 9.81 kN/m³ representing water</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="W_empty" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-primary" />
                Tank Empty Weight (W_empty)
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">{currentUnitLabel("lb", "kN")}</span>
            </div>
            <Input
              id="W_empty"
              type="number"
              step="100"
              name="W_empty"
              value={inputs.W_empty}
              onChange={handleInputChange}
              className="font-mono text-xs dark:bg-input/20 h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-none">Self-weight only, excluding liquid (forces structural dead load)</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Seismic Design Parameters Card */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader className="bg-muted/30 px-4 py-2.5 border-b border-border">
          <CardTitle className="font-heading font-bold text-sm sm:text-xs uppercase tracking-widest text-foreground flex items-center gap-2">
            <Anchor className="w-4 h-4 text-muted-foreground" />
            3. Simplified ACI 350.3-20 Seismic Design Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* S_DS */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="S_DS" className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                    Design Short Accel. (SDS)
                  </Label>
                  <span className="text-[11px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">g</span>
                </div>
                <Input
                  id="S_DS"
                  type="number"
                  step="0.01"
                  name="S_DS"
                  value={inputs.S_DS}
                  onChange={handleInputChange}
                  className="font-mono text-sm sm:text-xs dark:bg-input/20 h-10 sm:h-9"
                />
                <p className="text-[11px] sm:text-[9.5px] text-muted-foreground leading-normal">Design short-period spectral acceleration</p>
              </div>

              {/* S_D1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="S_D1" className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                    Design 1-Sec Accel. (SD1)
                  </Label>
                  <span className="text-[11px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">g</span>
                </div>
                <Input
                  id="S_D1"
                  type="number"
                  step="0.01"
                  name="S_D1"
                  value={inputs.S_D1}
                  onChange={handleInputChange}
                  className="font-mono text-sm sm:text-xs dark:bg-input/20 h-10 sm:h-9"
                />
                <p className="text-[11px] sm:text-[9.5px] text-muted-foreground leading-normal">Design 1-second period spectral acceleration</p>
              </div>

              {/* S_1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="S_1" className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                    Mapped 1-Sec Accel. (S1)
                  </Label>
                  <span className="text-[11px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border border-border rounded-xs uppercase leading-none">g</span>
                </div>
                <Input
                  id="S_1"
                  type="number"
                  step="0.01"
                  name="S_1"
                  value={inputs.S_1}
                  onChange={handleInputChange}
                  className="font-mono text-sm sm:text-xs dark:bg-input/20 h-10 sm:h-9"
                />
                <p className="text-[11px] sm:text-[9.5px] text-muted-foreground leading-normal">Mapped 1-second period MCER spectral acceleration</p>
              </div>

            </div>

            {/* Ri and Rc Ductility parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="R_wi" className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-primary" />
                    Impulsive Modifier (Ri)
                  </Label>
                  <span className="text-[11px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.2 border border-border rounded-xs uppercase leading-none">Ri</span>
                </div>
                <Input
                  id="R_wi"
                  type="number"
                  step="0.05"
                  name="R_wi"
                  value={inputs.R_wi}
                  onChange={handleInputChange}
                  className="font-mono text-sm sm:text-xs dark:bg-input/20 h-10 sm:h-9"
                />
                <p className="text-[11px] sm:text-[9.5px] text-muted-foreground leading-normal">Manual impulsive response modification factor (Ri)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="R_wc" className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                    Convective Modifier (Rc)
                  </Label>
                  <span className="text-[11px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.2 border border-border rounded-xs uppercase leading-none">Rc</span>
                </div>
                <Input
                  id="R_wc"
                  type="number"
                  step="0.05"
                  name="R_wc"
                  value={inputs.R_wc}
                  onChange={handleInputChange}
                  className="font-mono text-sm sm:text-xs dark:bg-input/20 h-10 sm:h-9"
                />
                <p className="text-[11px] sm:text-[9.5px] text-muted-foreground leading-normal">Manual convective response modification factor (Rc, typically 1.0)</p>
              </div>

            </div>
          </div>

          {/* Interactive Info block */}
          <div className="flex gap-2.5 items-start bg-muted/30 p-4 border border-border rounded-lg mt-3">
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
              <Lightbulb className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-[12px] sm:text-[11px] font-bold uppercase tracking-wider text-foreground block">ACI 350.3-20 Seismic Support</span>
              <p className="text-[11.5px] sm:text-[10px] leading-relaxed text-muted-foreground font-sans">
                The convective response modification factor $R_c$ is typically set to $1.0$ to prevent nonlinear wave dynamics. The impulsive factor $R_i$ is manually entered by the engineer based on the ductile anchoring connection design of the steel tank structure (e.g. $3.25$ or $3.5$).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
