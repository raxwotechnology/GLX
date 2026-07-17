import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ClipboardList, ArrowRight, User, Folder, Calendar, AlertCircle, FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const COLUMNS = [
    { id: 'cutting', label: 'Cutting Stage', color: 'border-t-4 border-t-amber-500 bg-amber-50/20' },
    { id: 'assembly', label: 'Frame Assembly', color: 'border-t-4 border-t-blue-500 bg-blue-50/20' },
    { id: 'glazing', label: 'Glass Glazing', color: 'border-t-4 border-t-indigo-500 bg-indigo-50/20' },
    { id: 'qa', label: 'Quality Assurance', color: 'border-t-4 border-t-purple-500 bg-purple-50/20' },
    { id: 'ready', label: 'Ready / Dispatch', color: 'border-t-4 border-t-emerald-500 bg-emerald-50/20' }
];

const AluKanbanPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/alu/job-cards');
            setJobs(res.data.data || []);
        } catch (error) {
            toast.error('Failed to load Kanban production board');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const moveJob = async (jobId, newStatus) => {
        try {
            await api.put(`/alu/job-cards/${jobId}/status`, { status: newStatus });
            toast.success(`Moved job status to ${newStatus}`);
            fetchJobs();
            if (selectedJob && selectedJob._id === jobId) {
                setDetailModalOpen(false);
            }
        } catch (error) {
            toast.error('Failed to update job status');
        }
    };

    // Phase 4: CNC saw machine integration export trigger
    const exportCncSawGCode = async (quotationId) => {
        try {
            toast.loading('Generating G-Code cutting instructions...', { id: 'cnc' });
            const res = await api.post(`/alu/quotations/${quotationId}/cnc-export`);
            
            // Trigger file download
            const blob = new Blob([res.data.gcode], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CUT-${quotationId.slice(-6).toUpperCase()}.saw`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast.success('CNC G-Code export successful!', { id: 'cnc' });
        } catch (error) {
            toast.error('Failed to export CNC G-code', { id: 'cnc' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <ClipboardList className="text-indigo-600" /> Production Kanban Board
                    </h1>
                    <p className="text-slate-500 mt-1">Track fabrication progress, manage job cards, and export CNC cutting saw data.</p>
                </div>
                <button onClick={fetchJobs} className="p-2 border rounded-xl hover:bg-slate-100 bg-white text-slate-600 shadow-sm transition">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Kanban columns grid */}
            {loading ? (
                <div className="text-center py-40 text-slate-500 text-sm">Loading production cards...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                    {COLUMNS.map(col => {
                        const colJobs = jobs.filter(j => j.status === col.id);
                        return (
                            <div key={col.id} className={`rounded-2xl border border-slate-200 p-3 shadow-sm space-y-3 ${col.color} min-h-[500px]`}>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">{col.label}</span>
                                    <span className="w-5 h-5 bg-slate-200/80 text-slate-700 text-[10px] font-black rounded-full flex items-center justify-center">
                                        {colJobs.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {colJobs.map(job => (
                                        <div
                                            key={job._id}
                                            onClick={() => { setSelectedJob(job); setDetailModalOpen(true); }}
                                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition space-y-3"
                                        >
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-600 block">{job.jobCardNumber}</span>
                                                <h4 className="font-extrabold text-xs text-slate-800 leading-tight mt-0.5">{job.projectName}</h4>
                                            </div>

                                            <div className="space-y-1 text-[10px] text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={12} className="text-slate-400" />
                                                    <span className="truncate font-semibold">{job.customerName}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Folder size={12} className="text-slate-400" />
                                                    <span>{job.items.length} Custom Units</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t text-[10px]">
                                                <span className="text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                                                <span className="font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-0.5">
                                                    View Details <ArrowRight size={10} />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Card Detail Modal */}
            {selectedJob && (
                <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Production details: ${selectedJob.jobCardNumber}`}>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <span className="block text-slate-400 font-bold uppercase text-[9px]">Project / Client</span>
                                <span className="font-bold text-slate-800">{selectedJob.projectName} - {selectedJob.customerName}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 font-bold uppercase text-[9px]">Production Stage</span>
                                <span className="font-bold text-indigo-600 capitalize">{selectedJob.status} Stage</span>
                            </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700">Fabrication Items Cutting List</h4>
                            <div className="border rounded-xl overflow-hidden text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                                        <tr>
                                            <th className="p-2.5">Item</th>
                                            <th className="p-2.5">Dimensions (mm)</th>
                                            <th className="p-2.5 text-center">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700">
                                        {selectedJob.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2.5 font-semibold">{item.applicationType} ({item.configuration})</td>
                                                <td className="p-2.5 font-mono">{item.width} x {item.height} mm</td>
                                                <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Move state controls */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700">Update Production Column</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {COLUMNS.map(col => (
                                    <button
                                        key={col.id}
                                        onClick={() => moveJob(selectedJob._id, col.id)}
                                        disabled={selectedJob.status === col.id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                            selectedJob.status === col.id
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200'
                                        }`}
                                    >
                                        {col.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phase 4 Integration Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t gap-3">
                            <Button
                                onClick={() => exportCncSawGCode(selectedJob.quotationId)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-xs transition"
                            >
                                <Download size={14} /> Export CNC Saw G-Code (.saw)
                            </Button>
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AluKanbanPage;
