/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TankInputs, CalculationResults } from "./types";

/**
 * Perform all seismic calculations for a rectangular or circular steel liquid-storing tank
 * according to ACI 350.3-20.
 */
export function calculateSeismic(inputs: TankInputs): CalculationResults {
  const {
    unitSystem,
    geometry,
    L,
    B,
    H_L,
    H_w,
    t_w,
    f_y,
    gamma_L,
    W_empty,
    S_DS,
    S_D1,
    S_1,
    R_wi,
    R_wc,
  } = inputs;

  // 1. Environmental constants based on Unit System
  const g = unitSystem === "US" ? 32.174 : 9.80665; // acceleration due to gravity (ft/s^2 or m/s^2)
  const gamma_s = unitSystem === "US" ? 490.0 : 77.0; // steel specific weight (lb/ft^3 or kN/m^3)
  
  // Densities:
  const rho_s = gamma_s / g; // steel mass density (slugs/ft^3 or kN-s^2/m^4)
  const rho_L = gamma_L / g; // liquid mass density (slugs/ft^3 or kN-s^2/m^4)
  const E_s = unitSystem === "US" ? 29000000.0 : 200000.0; // Steel elastic modulus (psi or MPa)
  const tw_factor = unitSystem === "US" ? t_w / 12 : t_w / 1000; // thickness in ft or m

  // 2. Geometry & Weight calculations
  const isCircular = geometry === "circular";
  const D = L; // Inside diameter D is mapped to Length L

  // Contained liquid weight
  const W_L = isCircular 
    ? (Math.PI * Math.pow(D, 2) / 4) * H_L * gamma_L
    : L * B * H_L * gamma_L;

  // 3. Dynamic Masses of Accelerating Liquid (Section 9.2.1 / 9.3.1)
  const aspect_ratio = isCircular ? D / H_L : L / H_L;
  
  // Impulsive mass factor: Wi / WL = tanh[0.866 * L_or_D / H_L] / (0.866 * L_or_D / H_L)
  const factor_i = Math.tanh(0.866 * aspect_ratio) / (0.866 * aspect_ratio);
  const W_i = W_L * factor_i;

  // Convective mass factor:
  // Rectangular: Wc / WL = 0.264 * L/H_L * tanh[3.16 * H_L / L]
  // Circular: Wc / WL = 0.230 * D/H_L * tanh[3.68 * H_L / D]
  const factor_c = isCircular
    ? 0.230 * aspect_ratio * Math.tanh(3.68 / aspect_ratio)
    : 0.264 * aspect_ratio * Math.tanh(3.16 / aspect_ratio);
  const W_c = W_L * factor_c;

  // 4. Effective mass coefficient (epsilon) for walls (for period/stiffness model)
  let eps = 0.0151 * Math.pow(aspect_ratio, 2) - 0.1908 * aspect_ratio + 1.021;
  if (eps > 1.0) eps = 1.0;
  if (eps < 0.0) eps = 0.0;

  // 5. Heights to center of gravity (EBP - Excluding Base Pressure, Section 9.2.2 & 9.3.2)
  let h_i = 0;
  if (aspect_ratio < 1.333) {
    h_i = H_L * (0.5 - 0.09375 * aspect_ratio);
  } else {
    h_i = H_L * 0.375;
  }

  // Convective height hc/H_L:
  const coeff_c = isCircular ? 3.68 : 3.16;
  const ratio_c_height = coeff_c / aspect_ratio;
  const cosh_val = Math.cosh(ratio_c_height);
  const sinh_val = Math.sinh(ratio_c_height);
  let hc_HL_factor = 1.0;
  if (sinh_val !== 0) {
    hc_HL_factor = 1.0 - (cosh_val - 1) / (ratio_c_height * sinh_val);
  } else {
    hc_HL_factor = 0.375;
  }
  const h_c = H_L * hc_HL_factor;

  const h_w = 0.5 * H_w; // walls C.G is midheight

  // 6. Heights to center of gravity (IBP - Including Base Pressure, Section 9.2.3 & 9.3.3)
  let h_i_prime = 0;
  if (aspect_ratio < 0.75) {
    h_i_prime = H_L * 0.45;
  } else {
    const tanh_val = Math.tanh(0.866 * aspect_ratio);
    h_i_prime = H_L * ((0.866 * aspect_ratio) / (2 * tanh_val) - 0.125);
  }

  let hc_prime_HL_factor = 1.0;
  if (sinh_val !== 0) {
    hc_prime_HL_factor = 1.0 - (cosh_val - 2.01) / (ratio_c_height * sinh_val);
  } else {
    hc_prime_HL_factor = 0.45;
  }
  const h_c_prime = H_L * hc_prime_HL_factor;

  // 7. Dynamic Impulsive Period T_i of the Steel Tank Shell
  // Calculated using the flexible shell-mass breathing or cantilever stiffness system
  let W_w = 0;
  let m_mass = 0;
  let k_stiffness = 0;
  let omega_i = 0;
  let T_i = 0.05;

  if (isCircular) {
    // Total empty weight of the tank is used directly (ignoring wall calculation)
    W_w = W_empty;
    const m_w = W_empty / g;
    const m_i = W_i / g;
    m_mass = m_w + m_i;

    // Flexural hoop stiffness of circular container
    const E_s_converted = unitSystem === "US" ? E_s * 144.0 : E_s * 1000.0; // psi->psf or MPa->kPa
    k_stiffness = (2 * Math.PI * E_s_converted * tw_factor * H_w) / (D / 2);
    
    if (m_mass > 0 && k_stiffness > 0) {
      omega_i = Math.sqrt(k_stiffness / m_mass);
      T_i = (2 * Math.PI) / omega_i;
    }
  } else {
    // Rectangular cantilever plate model (wall weight ignores steel weight formula, using empty weight per unit perimeter)
    W_w = W_empty;
    const m_w = W_empty / (2 * (L + B) * g);
    const m_i = factor_i * (L / 2) * H_L * rho_L;
    m_mass = m_w + m_i;

    const h_effective = (h_w * m_w + h_i * m_i) / m_mass;

    if (unitSystem === "US") {
      k_stiffness = (E_s / 48) * Math.pow(t_w / h_effective, 3);
    } else {
      k_stiffness = (E_s / 4000000) * Math.pow(t_w / h_effective, 3);
    }

    if (m_mass > 0 && k_stiffness > 0) {
      omega_i = Math.sqrt(k_stiffness / m_mass);
      T_i = (2 * Math.PI) / omega_i;
    }
  }

  // 8. Convective Period T_c
  // Rectangular: lambda^2 = 3.16 * g * tanh[3.16 * H_L / L] | omega_c = lambda / sqrt(L)
  // Circular: lambda^2 = 3.68 * g * tanh[3.68 * H_L / D] | omega_c = lambda / sqrt(D)
  const lambda = Math.sqrt(coeff_c * g * Math.tanh(coeff_c / aspect_ratio));
  const omega_c = lambda / Math.sqrt(isCircular ? D : L);
  const T_c = (2 * Math.PI) / omega_c;

  // 9. Spectral Coefficients (ACI 350.3-20)
  const T_s = S_DS > 0 ? S_D1 / S_DS : 0.1;
  const T_L = 8.0; // standard transition default

  // Impulsive Spectral Coefficient C_i
  let C_i = S_DS;
  if (T_i > T_s) {
    C_i = S_D1 / T_i;
    if (C_i > S_DS) {
      C_i = S_DS;
    }
  }

  // Convective Spectral Coefficient C_c
  let C_c = (1.5 * S_D1) / T_c;
  if (T_c <= T_L) {
    if (C_c > 1.5 * S_DS) {
      C_c = 1.5 * S_DS;
    }
  } else {
    C_c = (1.5 * S_D1 * T_L) / (T_c * T_c);
  }

  // 10. Dynamic Lateral Forces
  // Steel shell structure force:
  const P_s = C_i * (W_empty / R_wi);

  // Impulsive liquid force:
  const P_i = C_i * (W_i / R_wi);

  // Convective liquid force:
  const P_c = C_c * (W_c / R_wc);

  // Total horizontal base shear
  const V = Math.sqrt(Math.pow(P_i + P_s, 2) + Math.pow(P_c, 2));

  // 11. Bending Moments (EBP) - above wall base, excluding base slab pressure
  const M_s = P_s * h_w;
  const M_i = P_i * h_i;
  const M_c = P_c * h_c;

  // Combined bending moment at wall base:
  const M_b = Math.sqrt(Math.pow(M_i + M_s, 2) + Math.pow(M_c, 2));

  // 12. Overturning Moments (IBP) - at tank base including base slab pressure
  const M_i_prime = P_i * h_i_prime;
  const M_c_prime = P_c * h_c_prime;

  // Combined overturning moment:
  const M_o = Math.sqrt(Math.pow(M_i_prime + M_s, 2) + Math.pow(M_c_prime, 2));

  // 13. Freeboard sloshing (d_max)
  // Rectangular: d_max = (L / 2) * C_c
  // Circular: d_max = (D / 2) * C_c
  const d_max = ((isCircular ? D : L) / 2) * C_c;

  // 14. Hydraulic Freeboard Serviceability Check
  const freeboard = H_w - H_L;
  const freeboardCheck = d_max <= freeboard ? "PASS" : "WARNING (Sloshing Overflow Risk)";

  return {
    W_L,
    W_w,
    W_i,
    W_c,
    eps,
    h_i,
    h_c,
    h_w,
    h_i_prime,
    h_c_prime,
    T_i,
    T_c,
    omega_i,
    omega_c,
    k_stiffness,
    m_mass,
    R_wi,
    R_wc,
    C_i,
    C_c,
    S_DS,
    S_D1,
    T_s,
    T_L,
    P_s,
    P_i,
    P_c,
    V,
    M_s,
    M_i,
    M_c,
    M_b,
    M_i_prime,
    M_c_prime,
    M_o,
    d_max,
    freeboardCheck,
    lambda,
  };
}
