/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TankInputs, CalculationResults } from "../types";
import { Info, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";

interface TankDiagramProps {
  inputs: TankInputs;
  results: CalculationResults;
}

export default function TankDiagram({ inputs, results }: TankDiagramProps) {
  const [viewType, setViewType] = useState<"forces" | "housner">("forces");
  const [momentType, setMomentType] = useState<"ebp" | "ibp">("ebp");

  const isEbp = momentType === "ebp";
  const active_hi = isEbp ? results.h_i : results.h_i_prime;
  const active_hc = isEbp ? results.h_c : results.h_c_prime;
  const unitFactor = inputs.unitSystem === "US" ? "ft" : "m";

  const formatForce = (forceVal: number) => {
    if (inputs.unitSystem === "US") {
      return (forceVal / 1000).toFixed(1) + " kips";
    }
    return forceVal.toFixed(1) + " kN";
  };

  const L_val = inputs.L;
  const H_w_val = inputs.H_w;
  const H_L_val = inputs.H_L;

  // SVG coordinate system
  const boxWidth = 660;
  const boxHeight = 380;
  const padLeft = 145;
  const padRight = 85;
  const padTop = 45;
  const padBottom = 55;

  const drawWidth = boxWidth - padLeft - padRight;
  const drawHeight = boxHeight - padTop - padBottom;

  const displaySlosh = Math.min(results.d_max, H_w_val * 0.2);
  const maxH = Math.max(H_w_val, H_L_val + displaySlosh) || 10;
  const maxL = L_val || 10;

  const yScale = drawHeight / maxH;
  const xScale = Math.min(drawWidth / maxL, yScale * 1.5);

  const tankWidth = L_val * xScale;
  const tankHeight = H_w_val * yScale;
  const liquidHeight = H_L_val * yScale;
  const sloshHeight = displaySlosh * yScale;

  const originX = padLeft + (drawWidth - tankWidth) / 2;
  const originY = boxHeight - padBottom;

  const tankTopY = originY - tankHeight;
  const liquidTopY = originY - liquidHeight;

  const liquidLeftX = originX;
  const liquidRightX = originX + tankWidth;

  // Sloshing wave path
  const wavePath = `M ${liquidLeftX},${originY} L ${liquidLeftX},${liquidTopY - sloshHeight} ` +
    `Q ${(liquidLeftX + liquidRightX) / 2},${liquidTopY} ${liquidRightX},${liquidTopY + sloshHeight} ` +
    `L ${liquidRightX},${originY} Z`;

  // Anti-clash separation for dynamic lateral force arrows & text labels
  const minArrowSep = 22; // Minimum vertical separation in pixels
  const hsArrowY = originY - results.h_w * yScale;
  const hcArrowY = originY - active_hc * yScale;
  const hiArrowY = originY - active_hi * yScale;

  const adjustedArrows = [
    { id: "shell", y: hsArrowY },
    { id: "convective", y: hcArrowY },
    { id: "impulsive", y: hiArrowY }
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

  // Premium Steel Design colors
  const colors = {
    impulsive: "#FF3B30",    // Apple red
    convective: "#AF52DE",   // Apple purple
    steelShell: "#007AFF",   // Apple blue
    success: "#34C759",      // Apple green
    warning: "#FF9500",      // Apple orange
    text: {
      primary: "#1D1D1F",
      secondary: "#6E6E73",
      tertiary: "#86868B",
    },
    structure: {
      wall: "#475569",        // Dark steel grey
      wallStroke: "#1e293b",
      base: "#AEAEB2",
      baseStroke: "#8E8E93",
    }
  };

  // Force arrow renderer with anti-clash and left/right isolation
  const getForceArrow = (heightVal: number, forceVal: number, label: string, color: string, adjustedYVal: number, strokeDash = "") => {
    const yCoord = adjustedYVal;
    const physicalY = originY - heightVal * yScale;
    const arrowLength = 70;
    const startX = originX - arrowLength - 20;
    const endX = originX - 10;

    return (
      <g key={label} className="transition-all duration-500 ease-out">
        {/* Leader line from text to the true physical location on the tank */}
        <path
          d={`M ${endX} ${yCoord} L ${originX} ${physicalY}`}
          fill="none"
          stroke={color}
          strokeWidth="1.25"
          opacity="0.4"
          strokeDasharray="2,2"
        />
        <circle cx={originX} cy={physicalY} r="2.5" fill={color} />
        
        {/* Horizontal Force line at adjusted text height to hold the label neatly */}
        <line
          x1={startX}
          y1={yCoord}
          x2={endX}
          y2={yCoord}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={strokeDash}
          markerEnd={`url(#arrow-${color.replace('#', '')})`}
          opacity="0.9"
        />

        {/* Force & Height label */}
        <text
          x={startX - 6}
          y={yCoord}
          textAnchor="end"
          fill={color}
          fontWeight="700"
          fontSize="10.5"
          fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
          letterSpacing="-0.01em"
        >
          {label}: {formatForce(forceVal)}
        </text>
        <text
          x={startX - 6}
          y={yCoord + 12}
          textAnchor="end"
          fill={colors.text.secondary}
          fontWeight="500"
          fontSize="9.5"
          fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
        >
          @ h = {heightVal.toFixed(2)} {unitFactor}
        </text>
      </g>
    );
  };

  return (
    <div className="apple-tank-card">
      {/* Header */}
      <div className="apple-tank-header">
        <div>
          <h2 className="apple-tank-title">
            <Eye className="w-[15px] h-[15px]" style={{ color: colors.steelShell }} />
            Steel Tank Dynamic Model
          </h2>
          <p className="apple-tank-subtitle">
            Seismic force distribution &amp; hydrodynamic sloshing visuals
          </p>
        </div>

        {/* View toggle */}
        <div className="apple-pill-toggle">
          <button
            onClick={() => setViewType("forces")}
            className={`apple-pill-btn ${viewType === "forces" ? "active" : ""}`}
          >
            Design Forces
          </button>
          <button
            onClick={() => setViewType("housner")}
            className={`apple-pill-btn ${viewType === "housner" ? "active" : ""}`}
          >
            Housner Model
          </button>
        </div>
      </div>

      {/* Moment toggle */}
      {viewType === "forces" && (
        <div className="apple-moment-toggle">
          <button
            onClick={() => setMomentType("ebp")}
            className={`apple-moment-btn ${isEbp ? "active" : ""}`}
          >
            <span className="apple-moment-label">Excl. Base Pressure</span>
            <span className="apple-moment-tag">EBP · Shell Moment</span>
          </button>
          <button
            onClick={() => setMomentType("ibp")}
            className={`apple-moment-btn ${!isEbp ? "active" : ""}`}
          >
            <span className="apple-moment-label">Incl. Base Pressure</span>
            <span className="apple-moment-tag">IBP · Overturning Moment</span>
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="apple-tank-canvas">
        <svg
          viewBox={`0 0 ${boxWidth} ${boxHeight}`}
          className="w-full max-h-[340px] select-none"
        >
          <defs>
            {/* Arrowheads */}
            <marker id="arrow-FF3B30" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF3B30" />
            </marker>
            <marker id="arrow-AF52DE" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#AF52DE" />
            </marker>
            <marker id="arrow-007AFF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#007AFF" />
            </marker>

            {/* Subtle dot grid */}
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.6" fill="#D2D2D7" />
            </pattern>

            {/* Liquid gradient */}
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007AFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#007AFF" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Dot grid background */}
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

          {/* Base dimension (L or D) */}
          <line x1={originX} y1={originY + 22} x2={originX + tankWidth} y2={originY + 22} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <line x1={originX} y1={originY + 16} x2={originX} y2={originY + 28} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <line x1={originX + tankWidth} y1={originY + 16} x2={originX + tankWidth} y2={originY + 28} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <text
            x={originX + tankWidth / 2}
            y={originY + 40}
            textAnchor="middle"
            fill={colors.text.secondary}
            fontWeight="500"
            fontSize="11"
            fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
            letterSpacing="-0.01em"
          >
            {inputs.geometry === "circular" 
              ? `D = ${L_val} ${unitFactor}  ·  Inside Diameter` 
              : `L = ${L_val} ${unitFactor}  ·  Parallel to Earthquake Force`}
          </text>

          {/* Liquid depth dimension (HL) - Positioned on right side of tank */}
          <line x1={originX + tankWidth + 18} y1={originY} x2={originX + tankWidth + 18} y2={liquidTopY} stroke={colors.steelShell} strokeWidth="1" strokeDasharray="2,3" opacity="0.55" />
          <line x1={originX + tankWidth + 13} y1={liquidTopY} x2={originX + tankWidth + 23} y2={liquidTopY} stroke={colors.steelShell} strokeWidth="1" />
          <line x1={originX + tankWidth + 13} y1={originY} x2={originX + tankWidth + 23} y2={originY} stroke={colors.steelShell} strokeWidth="1" />
          <text
            x={originX + tankWidth + 26}
            y={(originY + liquidTopY) / 2 + 4}
            fill={colors.steelShell}
            fontWeight="600"
            fontSize="10"
            fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
            letterSpacing="-0.01em"
          >
            HL = {H_L_val} {unitFactor}
          </text>

          {/* Wall height dimension (Hw) - Positioned on far right to isolate from left side forces */}
          <line x1={originX + tankWidth + 64} y1={originY} x2={originX + tankWidth + 64} y2={tankTopY} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <line x1={originX + tankWidth + 59} y1={originY} x2={originX + tankWidth + 69} y2={originY} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <line x1={originX + tankWidth + 59} y1={tankTopY} x2={originX + tankWidth + 69} y2={tankTopY} stroke={colors.text.tertiary} strokeWidth="0.75" />
          <text
            x={originX + tankWidth + 72}
            y={(originY + tankTopY) / 2 + 4}
            textAnchor="start"
            fill={colors.text.secondary}
            fontWeight="600"
            fontSize="10"
            fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
            letterSpacing="-0.01em"
          >
            Hw = {H_w_val} {unitFactor}
          </text>

          {/* Liquid with sloshing */}
          {inputs.geometry === "circular" ? (
            <g>
              {/* Cylinder liquid body */}
              <rect
                x={originX}
                y={liquidTopY}
                width={tankWidth}
                height={liquidHeight}
                fill="url(#liquidGrad)"
                opacity="0.9"
              />
              {/* Curved convective sloshing dynamic cap */}
              <ellipse
                cx={originX + tankWidth / 2}
                cy={liquidTopY}
                rx={tankWidth / 2}
                ry={Math.max(6, sloshHeight)}
                fill="url(#liquidGrad)"
                stroke={colors.steelShell}
                strokeWidth="1.25"
                opacity="0.95"
              />
            </g>
          ) : (
            <path
              d={wavePath}
              fill="url(#liquidGrad)"
              stroke={colors.steelShell}
              strokeWidth="1.25"
              strokeLinejoin="round"
              strokeDasharray={viewType === "housner" ? "4,4" : ""}
              opacity="0.9"
            />
          )}

          {/* Circular Tank Cylinder top/bottom elliptical overlays for 3D look */}
          {inputs.geometry === "circular" && (
            <g opacity="0.15">
              <ellipse cx={originX + tankWidth / 2} cy={originY} rx={tankWidth / 2} ry={12} fill="none" stroke={colors.structure.wallStroke} strokeWidth="0.5" />
            </g>
          )}

          {/* Left steel shell (very thin plate) */}
          <rect
            x={originX - 3}
            y={tankTopY}
            width="3"
            height={tankHeight}
            rx="0.5"
            fill={colors.structure.wall}
            stroke={colors.structure.wallStroke}
            strokeWidth="0.5"
          />
          {/* Right steel shell */}
          <rect
            x={originX + tankWidth}
            y={tankTopY}
            width="3"
            height={tankHeight}
            rx="0.5"
            fill={colors.structure.wall}
            stroke={colors.structure.wallStroke}
            strokeWidth="0.5"
          />
          {/* Foundation slab */}
          <rect
            x={originX - 11}
            y={originY}
            width={tankWidth + 22}
            height="10"
            rx="1.5"
            fill={colors.structure.base}
            stroke={colors.structure.baseStroke}
            strokeWidth="0.75"
          />

          {/* Ground hatching */}
          <line x1={originX - 11} y1={originY + 10} x2={originX + tankWidth + 11} y2={originY + 10} stroke={colors.text.tertiary} strokeWidth="0.5" />
          {Array.from({ length: 15 }).map((_, i) => {
            const step = (tankWidth + 22) / 14;
            const px = originX - 11 + i * step;
            return (
              <line
                key={i}
                x1={px}
                y1={originY + 10}
                x2={px - 5}
                y2={originY + 16}
                stroke={colors.text.tertiary}
                strokeWidth="0.5"
                opacity="0.5"
              />
            );
          })}

          {/* Steel plate roof cap (Elliptical for Circular, flat for Rectangular) */}
          {inputs.geometry === "circular" ? (
            <ellipse
              cx={originX + tankWidth / 2}
              cy={tankTopY}
              rx={tankWidth / 2 + 4}
              ry={12}
              fill={colors.structure.wall}
              stroke={colors.structure.wallStroke}
              strokeWidth="1.25"
            />
          ) : (
            <rect
              x={originX - 4}
              y={tankTopY - 2}
              width={tankWidth + 8}
              height="2"
              rx="0.5"
              fill={colors.structure.wall}
              stroke={colors.structure.wallStroke}
              strokeWidth="0.5"
            />
          )}
          <text
            x={originX + tankWidth / 2}
            y={tankTopY - 10}
            textAnchor="middle"
            fill={colors.text.tertiary}
            fontWeight="600"
            fontSize="10"
            fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
            letterSpacing="0.02em"
          >
            STEEL SHELL &amp; ROOF
          </text>

          {/* === DESIGN FORCES VIEW === */}
          {viewType === "forces" && (
            <g>
              {getForceArrow(active_hi, results.P_i, "Impulsive Pᵢ", colors.impulsive, adjY.impulsive)}
              {getForceArrow(active_hc, results.P_c, "Convective Pꞔ", colors.convective, adjY.convective)}
              {getForceArrow(results.h_w, results.P_s, "Steel Shell Pₛ", colors.steelShell, adjY.shell)}

              {/* Base Shear badge */}
              <rect
                x={originX + tankWidth - 130}
                y={originY - 52}
                width="120"
                height="42"
                rx="10"
                fill="white"
                stroke={colors.text.tertiary}
                strokeWidth="0.75"
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.06))"
              />
              <text
                x={originX + tankWidth - 70}
                y={originY - 35}
                textAnchor="middle"
                fill={colors.text.tertiary}
                fontWeight="500"
                fontSize="9"
                fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
                letterSpacing="0.03em"
              >
                BASE SHEAR V
              </text>
              <text
                x={originX + tankWidth - 70}
                y={originY - 18}
                textAnchor="middle"
                fill={colors.success}
                fontWeight="700"
                fontSize="14"
                fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif"
                letterSpacing="-0.02em"
              >
                {formatForce(results.V)}
              </text>
            </g>
          )}

          {/* === HOUSNER SPRING-MASS VIEW === */}
          {viewType === "housner" && (
            <g>
              {/* Impulsive mass Wi */}
              <circle
                cx={originX + tankWidth / 2}
                cy={originY - results.h_i * yScale}
                r="13"
                fill={colors.impulsive}
                opacity="0.9"
              />
              <text
                x={originX + tankWidth / 2}
                y={originY - results.h_i * yScale + 4}
                fill="#ffffff"
                fontWeight="600"
                fontSize="10"
                fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
                textAnchor="middle"
              >
                Wi
              </text>
              {/* Rigid bars */}
              <line
                x1={originX}
                y1={originY - results.h_i * yScale}
                x2={originX + tankWidth / 2 - 13}
                y2={originY - results.h_i * yScale}
                stroke={colors.impulsive}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1={originX + tankWidth / 2 + 13}
                y1={originY - results.h_i * yScale}
                x2={originX + tankWidth}
                y2={originY - results.h_i * yScale}
                stroke={colors.impulsive}
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Convective mass Wc */}
              <circle
                cx={originX + tankWidth / 2}
                cy={originY - results.h_c * yScale}
                r="13"
                fill={colors.convective}
                opacity="0.9"
              />
              <text
                x={originX + tankWidth / 2}
                y={originY - results.h_c * yScale + 4}
                fill="#ffffff"
                fontWeight="600"
                fontSize="10"
                fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
                textAnchor="middle"
              >
                Wc
              </text>

              {/* Spring left */}
              <path
                d={`M ${originX} ${originY - results.h_c * yScale} 
                    L ${originX + tankWidth / 8} ${originY - results.h_c * yScale}
                    L ${originX + tankWidth / 8 + 5} ${originY - results.h_c * yScale - 5}
                    L ${originX + tankWidth / 8 + 10} ${originY - results.h_c * yScale + 5}
                    L ${originX + tankWidth / 8 + 15} ${originY - results.h_c * yScale - 5}
                    L ${originX + tankWidth / 8 + 20} ${originY - results.h_c * yScale}
                    L ${originX + tankWidth / 2 - 13} ${originY - results.h_c * yScale}`}
                fill="none"
                stroke={colors.convective}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Spring right */}
              <path
                d={`M ${originX + tankWidth} ${originY - results.h_c * yScale} 
                    L ${originX + tankWidth - tankWidth / 8} ${originY - results.h_c * yScale}
                    L ${originX + tankWidth - tankWidth / 8 - 5} ${originY - results.h_c * yScale - 5}
                    L ${originX + tankWidth - tankWidth / 8 - 10} ${originY - results.h_c * yScale + 5}
                    L ${originX + tankWidth - tankWidth / 8 - 15} ${originY - results.h_c * yScale - 5}
                    L ${originX + tankWidth - tankWidth / 8 - 20} ${originY - results.h_c * yScale}
                    L ${originX + tankWidth / 2 + 13} ${originY - results.h_c * yScale}`}
                fill="none"
                stroke={colors.convective}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Slosh height indicator */}
              <line
                x1={originX}
                y1={liquidTopY - sloshHeight}
                x2={originX + 30}
                y2={liquidTopY - sloshHeight}
                stroke={colors.steelShell}
                strokeWidth="0.75"
                opacity="0.5"
              />
              <line
                x1={originX + 15}
                y1={liquidTopY}
                x2={originX + 15}
                y2={liquidTopY - sloshHeight}
                stroke={colors.steelShell}
                strokeWidth="1"
                markerEnd="url(#arrow-007AFF)"
              />
              <text
                x={originX + 22}
                y={liquidTopY - sloshHeight / 2 + 4}
                fill={colors.steelShell}
                fontWeight="600"
                fontSize="11"
                fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif"
                letterSpacing="-0.01em"
              >
                dₘₐₓ: {results.d_max.toFixed(2)} {unitFactor}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Dynamic stats row below diagram */}
      <div className="apple-stats-row flex-wrap sm:flex-nowrap">
        <div className="apple-stat-item">
          <span className="apple-stat-label">Empty Tank Weight</span>
          <span className="apple-stat-value">{(inputs.W_empty / (inputs.unitSystem === 'US' ? 1000 : 1)).toFixed(0)} <span className="apple-stat-unit">{inputs.unitSystem === 'US' ? 'kips' : 'kN'}</span></span>
        </div>
        <div className="apple-stat-divider" />
        <div className="apple-stat-item">
          <span className="apple-stat-label">Fluid Weight</span>
          <span className="apple-stat-value">{(results.W_L / (inputs.unitSystem === 'US' ? 1000 : 1)).toFixed(0)} <span className="apple-stat-unit">{inputs.unitSystem === 'US' ? 'kips' : 'kN'}</span></span>
        </div>
        <div className="apple-stat-divider" />
        <div className="apple-stat-item">
          <span className="apple-stat-label">Impulsive Wᵢ</span>
          <span className="apple-stat-value" style={{ color: colors.impulsive }}>{(results.W_i / (inputs.unitSystem === 'US' ? 1000 : 1)).toFixed(0)} <span className="apple-stat-pct">({((results.W_i / results.W_L) * 100).toFixed(0)}%)</span></span>
        </div>
        <div className="apple-stat-divider" />
        <div className="apple-stat-item">
          <span className="apple-stat-label">Period Tᵢ</span>
          <span className="apple-stat-value" style={{ color: colors.steelShell }}>{results.T_i.toFixed(3)} <span className="apple-stat-unit">s</span></span>
        </div>
        <div className="apple-stat-divider" />
        <div className="apple-stat-item">
          <span className="apple-stat-label">Period Tꞔ</span>
          <span className="apple-stat-value" style={{ color: colors.convective }}>{results.T_c.toFixed(3)} <span className="apple-stat-unit">s</span></span>
        </div>
      </div>

      {/* Dynamic Hydraulic Sloshing Info Block */}
      <div className="p-3.5 bg-muted/40 border-t border-border flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {results.freeboardCheck.includes("WARN") ? (
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
          )}
          <div>
            <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] block">Sloshing Wave Freeboard Check</span>
            <span className="text-[11px] text-muted-foreground">
              Maximum wave slosh height is {results.d_max.toFixed(2)} {unitFactor} compared to available freeboard ({(inputs.H_w - inputs.H_L).toFixed(2)} {unitFactor}).
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded-md uppercase tracking-wider leading-none select-none ${
          results.freeboardCheck.includes("WARN")
            ? "bg-amber-100 text-amber-800 border border-amber-200" 
            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
        }`}>
          {results.freeboardCheck}
        </span>
      </div>

      {/* Footer note */}
      <div className="apple-tank-footer">
        <div className="apple-footer-icon">
          <Info className="w-[14px] h-[14px]" style={{ color: colors.steelShell }} />
        </div>
        <div>
          <h4 className="apple-footer-title">
            {viewType === "forces"
              ? `Dynamic Shear Vectors  ·  ${isEbp ? "EBP" : "IBP"}`
              : "Housner Hydrodynamic Spring-Mass Model"}
          </h4>
          <p className="apple-footer-body">
            {viewType === "forces"
              ? `Seismic steel design loads per ACI 350.3-20. The steel plate shell inertia force Pₛ acts at the structure center of gravity (0.5 Hw). Impulsive and convective forces combine via SRSS because sloshing wave frequency is decoupled from structural vibrations.`
              : `Equivalent lumped mechanical system: Wᵢ accelerates rigidly in-phase with the thin steel shell, while Wꞔ oscillates on virtual springs at the surface, producing the sloshing wave and convective pressure.`}
          </p>
        </div>
      </div>
    </div>
  );
}
