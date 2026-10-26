import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, Download, Printer, RefreshCw, AlertOctagon, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';

const Reports = () => {
  const [searchParams] = useSearchParams();
  const requestedIncidentId = searchParams.get('incidentId');
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success) {
        setError('');
        setReports(res.data.data);
        if (requestedIncidentId) {
          const matched = res.data.data.find(r => r.incidentId === requestedIncidentId);
          if (matched) setActiveReport(matched);
          else {
            // Generate it on the fly
            const genRes = await api.post(`/reports/${requestedIncidentId}`);
            if (genRes.data.success) {
              setActiveReport(genRes.data.data);
              setReports(prev => [genRes.data.data, ...prev]);
            }
          }
        } else if (!res.data.success) {
          throw new Error(res.data.message || 'Reports are unavailable.');
        } else if (res.data.data.length > 0 && !activeReport) {
          setActiveReport(res.data.data[0]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reports are unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [requestedIncidentId]);

  const handleDownload = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENTINEL-${activeReport.incidentId}-REPORT.md`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadPdf = async () => {
    if (!activeReport) return;
    setPdfLoading(true);
    try {
      const res = await api.get(`/reports/${activeReport.incidentId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SENTINEL-${activeReport.incidentId}-REPORT.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to download PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex flex-wrap items-center gap-3">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Incident Forensics & Compliance Reports</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Formal post-mortem briefs compiled by Report Agent • Audit-ready markdown & documentation
          </p>
        </div>

        {activeReport && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfLoading ? 'GENERATING PDF...' : 'EXPORT PDF'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT MARKDOWN</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT REPORT</span>
            </button>
          </div>
        )}
      </div>

      {error && <div role="alert" className="border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Report Selector List */}
        <div className="min-w-0 space-y-3">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Available Reports</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {reports.map((rep) => (
              <div
                key={rep._id}
                onClick={() => setActiveReport(rep)}
                className={`p-3 rounded-lg border cursor-pointer transition-all font-mono text-xs ${
                  activeReport?._id === rep._id
                    ? 'border-cyan-500 bg-cyan-950/20 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{rep.incidentId}</span>
                  <span className="text-[10px] px-1.5 rounded bg-slate-800 text-slate-300">{rep.severity}</span>
                </div>
                <div className="text-slate-200 mt-1 truncate">{rep.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {new Date(rep.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Markdown Document Viewer */}
        <div className="lg:col-span-3 min-w-0">
          {activeReport ? (
            <div className="bg-[#05080f] p-8 rounded-xl border border-slate-800 shadow-2xl font-sans text-slate-200 space-y-6 max-h-[750px] overflow-y-auto print:bg-white print:text-black">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-300 leading-relaxed">
                {activeReport.markdownContent}
              </pre>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 italic">
              Select an incident report from the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
