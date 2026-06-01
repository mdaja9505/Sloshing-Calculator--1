/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UnitSystem = "US" | "SI";
export type TankGeometry = "rectangular" | "circular";

export interface TankInputs {
  unitSystem: UnitSystem;
  geometry: TankGeometry;
  
  // Dimensions
  L: number;       // Inside length or Inside Diameter (D), ft or m
  B: number;       // Inside width (perpendicular to force, rectangular only), ft or m
  H_L: number;     // Design liquid depth, ft or m
  H_w: number;     // Wall height, ft or m
  t_w: number;     // Steel shell thickness, in or mm
  
  // Materials & Weights
  f_y: number;     // Steel plate yield strength, psi or MPa
  gamma_L: number; // Specific weight of liquid, lb/ft3 or kN/m3
  W_empty: number; // Tank Empty Weight (self-weight only, excluding fluid), lb or kN
  
  // Seismic spectral parameters (ACI 350.3-20 / ASCE 7)
  S_DS: number;    // Design short period acceleration (SDS), g
  S_D1: number;    // Design 1-second period acceleration (SD1), g
  S_1: number;     // Mapped 1-second period acceleration (S1), g
  R_wi: number;    // Manual impulsive response modification factor (Ri)
  R_wc: number;    // Manual convective response modification factor (Rc)
}

export interface CalculationResults {
  // Volume and weights
  W_L: number;     // Total liquid weight, lb or kN
  W_w: number;     // Total wall weight calculated for mass-period estimations, lb or kN
  
  // Dynamic design parts
  W_i: number;     // Impulsive liquid weight, lb or kN
  W_c: number;     // Convective liquid weight, lb or kN
  eps: number;     // Effective mass coefficient epsilon
  
  // Heights to C.G. (EBP)
  h_i: number;     // Impulsive height EBP, ft or m
  h_c: number;     // Convective height EBP, ft or m
  h_w: number;     // Walls center of mass height, ft or m
  
  // Heights to C.G. (IBP)
  h_i_prime: number; // Impulsive height IBP, ft or m
  h_c_prime: number; // Convective height IBP, ft or m
  
  // Periods
  T_i: number;     // Fundamental period of impulsive component, sec
  T_c: number;     // Period of convective component, sec
  omega_i: number; // Circular frequency impulsive, rad/s
  omega_c: number; // Circular frequency convective, rad/s
  k_stiffness: number; // Flexural wall stiffness, lb/ft2 or kPa
  m_mass: number;  // Combined impulsive mass, lb-s2/ft4 or kN-s2/m4
  
  // Spectral coefficients
  R_wi: number;    // Response modification factor impulsive (Ri)
  R_wc: number;    // Response modification factor convective (Rc)
  C_i: number;     // Spectral amplification factor impulsive
  C_c: number;     // Spectral amplification factor convective
  
  // ACI 350.3-20 specific result parameters
  S_DS: number;   // Design short period spectral acceleration
  S_D1: number;   // Design 1-sec period spectral acceleration
  T_s: number;    // Soil/spectral transition period, Sec
  T_L: number;    // Long transition period, Sec
  
  // Lateral Forces
  P_s: number;     // Steel structure dynamic lateral force, lb or kN
  P_i: number;     // Impulsive liquid lateral force, lb or kN
  P_c: number;     // Convective liquid lateral force, lb or kN
  V: number;       // Total horizontal base shear, lb or kN
  
  // Bending Moments (EBP) - above wall base, excluding base slab pressure
  M_s: number;     // Steel structure moment, ft-lb or kN-m
  M_i: number;     // Impulsive moment, ft-lb or kN-m
  M_c: number;     // Convective moment, ft-lb or kN-m
  M_b: number;     // Total bending moment cross-section (EBP), ft-lb or kN-m
  
  // Overturning Moments (IBP) - at tank base including base pressure
  M_i_prime: number; // Impulsive moment IBP, ft-lb or kN-m
  M_c_prime: number; // Convective moment IBP, ft-lb or kN-m
  M_o: number;       // Total overturning moment (IBP), ft-lb or kN-m
  
  // Freeboard sloshing
  d_max: number;    // Maximum sloshing wave height, ft or m
  freeboardCheck: string; // Freeboard adequacy status ("PASS" or "WARNING")
  
  // Natural constants
  lambda: number;   // Convective eigenvalue factor
}
