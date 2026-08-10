import React, { useState } from 'react';
import { EntityInvestigation } from '../types';
import {
  ShieldCheck,
  Smartphone,
  MapPin,
  Globe,
  FileCheck,
  FileSpreadsheet,
  CheckCircle2,
  X,
  AlertTriangle,
  Lock,
  Download,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EntityVerificationModalProps {
  entity: EntityInvestigation;
  patternId: string;
  onClose: () => void;
}

export const EntityVerificationModal: React.FC<EntityVerificationModalProps> = ({
                                                                                  entity,
                                                                                  patternId,
                                                                                  onClose,
                                                                                }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [sarSubmitted, setSarSubmitted] = useState(false);

  const { device_telematics: dev, government_verifications: gov } = entity;

  const handleFileSAR = () => {
    setSarSubmitted(true);
  };

  return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div
            className={`border rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-5 my-auto animate-in fade-in zoom-in duration-200 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
            }`}
        >
          {/* Modal Header */}
          <div
              className={`flex items-start justify-between pb-4 border-b ${
                  isLight ? 'border-slate-200' : 'border-[#232738]'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Device Telematics & Official Registry Verification
                  </h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                  LIVE COMPLIANCE AUDIT
                </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Case ID: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{patternId}</span> | Target Account:{' '}
                  <span className={`font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entity.account_id}</span>
                </p>
              </div>
            </div>

            <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-[#232738]'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Device Telematics */}
            <div
                className={`border rounded-xl p-4 space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'
                }`}
            >
              <div
                  className={`flex items-center justify-between pb-2 border-b ${
                      isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
                  }`}
              >
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Device Telematics & IP Fingerprint</span>
                </h4>
                {dev.vpn_detected && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-500 font-mono text-[10px] font-bold">
                  VPN / PROXY DETECTED
                </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div
                    className={`flex justify-between p-2 rounded border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Hardware ID:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{dev.device_id}</span>
                </div>
                <div
                    className={`flex justify-between p-2 rounded border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Device Model:</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-bold">{dev.device_model}</span>
                </div>
                <div
                    className={`flex justify-between p-2 rounded border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Last IP Address:</span>
                  <span className={`font-bold flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {dev.last_ip}
                </span>
                </div>

                {/* Geolocation Card */}
                <div
                    className={`p-3 rounded border space-y-1 font-sans ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <div className={`text-[11px] font-semibold flex items-center gap-1 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Last Known Geolocation:</span>
                  </div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {dev.last_location.address}
                  </div>
                  <div className={`text-[11px] font-mono flex items-center justify-between pt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>
                    Lat: {dev.last_location.latitude}, Long: {dev.last_location.longitude}
                  </span>
                    <span>{new Date(dev.last_location.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Government & Identity Verification */}
            <div
                className={`border rounded-xl p-4 space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'
                }`}
            >
              <div
                  className={`flex items-center justify-between pb-2 border-b ${
                      isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
                  }`}
              >
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>Government Registry Checks</span>
                </h4>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-mono text-[10px] font-bold">
                API VERIFIED
              </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* PAN Status */}
                <div
                    className={`p-2.5 rounded border space-y-1 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>PAN Verification:</span>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            gov.pan_verification.status === 'VALID'
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : 'bg-red-500/20 text-red-500'
                        }`}
                    >
                    {gov.pan_verification.status}
                  </span>
                  </div>
                  <div className={`text-[11px] font-sans flex justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>Name Match: {gov.pan_verification.name_match}</span>
                    <span className={isLight ? 'text-slate-400' : 'text-slate-400'}>({gov.pan_verification.tax_category})</span>
                  </div>
                </div>

                {/* GST Verification */}
                <div
                    className={`p-2.5 rounded border space-y-1 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>GST Compliance:</span>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            gov.gst_verification.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : 'bg-amber-500/20 text-amber-500'
                        }`}
                    >
                    {gov.gst_verification.status}
                  </span>
                  </div>
                  <div className={`text-[11px] font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    GSTIN: {gov.gst_verification.gstin} | Business: {gov.gst_verification.registered_business}
                  </div>
                </div>

                {/* TDS & Tax Deductions */}
                <div
                    className={`p-2.5 rounded border flex justify-between items-center ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <div>
                    <div className={isLight ? 'text-slate-500' : 'text-slate-400'}>TDS Tax Deductions:</div>
                    <div className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                      Claimed Last FY: ₹{gov.tds_tax_deductions.tds_claimed_last_fy.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {gov.tds_tax_deductions.mismatch_flag ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] rounded font-bold">
                    MISMATCH ALERT
                  </span>
                  ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] rounded font-bold">
                    NO MISMATCH
                  </span>
                  )}
                </div>

                {/* Aadhaar Check */}
                <div
                    className={`p-2.5 rounded border flex justify-between items-center ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
                    }`}
                >
                  <div>
                    <div className={isLight ? 'text-slate-500' : 'text-slate-400'}>Aadhaar Identity Check:</div>
                    <div className={`text-[11px] font-sans ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                      Mobile Linked: {gov.aadhaar_verification.linked_mobile_match ? 'Yes' : 'No'} | Biometric:{' '}
                      {gov.aadhaar_verification.biometric_lock_status}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 text-[10px] rounded font-bold">
                  {gov.aadhaar_verification.status}
                </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div
              className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
              }`}
          >
            <div className={`text-xs flex items-center gap-2 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Lock className="w-4 h-4 text-slate-400" />
              <span>FIU-IND Regulatory Compliance Mode Active</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                  onClick={onClose}
                  className={`px-4 py-2 border font-medium text-xs rounded-lg transition-colors cursor-pointer w-1/2 sm:w-auto ${
                      isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          : 'bg-[#0f1117] hover:bg-[#2a2d3e] border-[#2a2d3e] text-slate-300'
                  }`}
              >
                Close Window
              </button>

              <button
                  onClick={handleFileSAR}
                  disabled={sarSubmitted}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer w-1/2 sm:w-auto flex items-center justify-center gap-1.5 shadow-md hover:shadow-red-500/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{sarSubmitted ? 'SAR Filed to Regulatory Portal' : 'File Inter-Bank SAR'}</span>
              </button>
            </div>
          </div>

          {sarSubmitted && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 text-xs font-mono flex items-center gap-2 justify-center animate-in fade-in font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>
              Suspicious Activity Report (SAR) successfully registered and dispatched to Compliance Officer portal.
            </span>
              </div>
          )}
        </div>
      </div>
  );
};
