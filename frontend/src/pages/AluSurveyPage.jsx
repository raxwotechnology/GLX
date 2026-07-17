import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Navigation, Plus, Trash2, FileText, CheckCircle, Clock, RefreshCw, User, Clipboard, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const AluSurveyPage = () => {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [surveyorName, setSurveyorName] = useState('');
    const [notes, setNotes] = useState('');
    const [measurements, setMeasurements] = useState([
        { label: 'GF-W1', width: 1200, height: 1200, applicationType: 'Casement Window', configuration: '1 Panel' }
    ]);

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const res = await api.get('/alu/surveys');
            setSurveys(res.data.data || []);
        } catch (error) {
            toast.error('Failed to load surveys');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    const addMeasurementRow = () => {
        setMeasurements([...measurements, {
            label: `GF-W${measurements.length + 1}`,
            width: 1200,
            height: 1200,
            applicationType: 'Casement Window',
            configuration: '1 Panel'
        }]);
    };

    const removeMeasurementRow = (idx) => {
        setMeasurements(measurements.filter((_, i) => i !== idx));
    };

    const handleRowChange = (idx, field, val) => {
        const updated = [...measurements];
        updated[idx][field] = val;
        setMeasurements(updated);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!customerName || !projectName) {
            return toast.error('Customer and Project name are required');
        }

        try {
            await api.post('/alu/surveys', {
                customerName,
                projectName,
                surveyorName,
                notes,
                measurements
            });
            toast.success('Survey measurements saved successfully');
            setIsOpen(false);
            fetchSurveys();
        } catch (error) {
            toast.error('Failed to save survey record');
        }
    };

    // 1-Click Convert to official ERP Quotation
    const convertToQuotation = (survey) => {
        // We navigate to the new quotation page with survey details passed in state
        navigate('/alu/quotations/new', {
            state: {
                customerName: survey.customerName,
                projectName: survey.projectName,
                items: survey.measurements.map(m => ({
                    applicationType: m.applicationType,
                    configuration: m.configuration,
                    width: m.width,
                    height: m.height,
                    quantity: 1
                }))
            }
        });
        toast.success('Pre-filled survey dimensions into quotation builder!');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Navigation className="text-indigo-600 animate-pulse" /> On-Site Site Surveys
                    </h1>
                    <p className="text-slate-500 mt-1">Collect concrete window opening sizes directly from construction sites and quote them instantly.</p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200">
                    <Plus size={18} /> New Site Survey
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-40 text-slate-500 text-sm">Loading site surveys...</div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-20 bg-white border rounded-2xl text-slate-400 italic text-sm">
                    No survey records logged yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map(survey => (
                        <div key={survey._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{survey.surveyNumber}</span>
                                        <h4 className="font-extrabold text-slate-800 text-sm">{survey.projectName}</h4>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                        survey.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {survey.status === 'pending' ? <Clock size={10} /> : <CheckCircle size={10} />}
                                        {survey.status === 'pending' ? 'Pending Quote' : 'Quoted'}
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <User size={12} className="text-slate-400" />
                                        <span>Client: <strong className="text-slate-700">{survey.customerName}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clipboard size={12} className="text-slate-400" />
                                        <span>Surveyor: <span className="text-slate-700">{survey.surveyorName || 'N/A'}</span></span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border rounded-xl p-3 space-y-1.5 text-xs max-h-[140px] overflow-y-auto">
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Openings Logged</span>
                                    {survey.measurements.map((m, idx) => (
                                        <div key={idx} className="flex justify-between text-slate-600 border-b last:border-b-0 pb-1">
                                            <span className="font-semibold text-slate-700">{m.label} ({m.applicationType})</span>
                                            <span className="font-mono text-slate-500">{m.width}x{m.height} mm</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t flex gap-2">
                                <Button
                                    onClick={() => convertToQuotation(survey)}
                                    className="flex-1 flex justify-center items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition"
                                >
                                    <FileText size={12} /> Convert to Quotation
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log Survey Modal */}
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Site Survey measurements">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer / Client *</label>
                            <input
                                type="text"
                                placeholder="e.g. Dilum Weerasinghe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Project Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Colombo Residence"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Surveyor Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Kasun Perera"
                                value={surveyorName}
                                onChange={(e) => setSurveyorName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes</label>
                            <input
                                type="text"
                                placeholder="e.g. Verify wall level alignment"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Measurements List Form */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center border-b pb-1">
                            <h4 className="text-xs font-bold text-slate-700">Openings List</h4>
                            <button type="button" onClick={addMeasurementRow} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1">
                                <PlusCircle size={14} /> Add Row
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {measurements.map((m, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border">
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            value={m.label}
                                            onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs font-mono"
                                            placeholder="Tag"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select
                                            value={m.applicationType}
                                            onChange={(e) => handleRowChange(idx, 'applicationType', e.target.value)}
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                                        >
                                            <option value="Sliding Door">Sliding Door</option>
                                            <option value="Casement Window">Casement Window</option>
                                            <option value="Fixed Glass">Fixed Glass</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={m.width}
                                            onChange={(e) => handleRowChange(idx, 'width', parseInt(e.target.value))}
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs"
                                            placeholder="Width"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={m.height}
                                            onChange={(e) => handleRowChange(idx, 'height', parseInt(e.target.value))}
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs"
                                            placeholder="Height"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <select
                                            value={m.configuration}
                                            onChange={(e) => handleRowChange(idx, 'configuration', e.target.value)}
                                            className="w-full px-2 py-1.5 border rounded-lg text-[10px] bg-white"
                                        >
                                            <option value="1 Panel">1 Panel</option>
                                            <option value="2 Panel">2 Panel</option>
                                            <option value="3 Panel">3 Panel</option>
                                            <option value="4 Panel">4 Panel</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <button type="button" onClick={() => removeMeasurementRow(idx)} className="text-rose-500 hover:text-rose-700">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Survey</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AluSurveyPage;
