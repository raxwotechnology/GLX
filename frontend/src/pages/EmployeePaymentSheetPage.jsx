import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function EmployeePaymentSheetPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadSheet = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/hr/employees/${id}/payment-sheet`, {
                params: { startDate, endDate }
            });
            if (res.data && res.data.success) {
                setData(res.data.data);
            } else {
                toast.error('Failed to load payment sheet details.');
            }
        } catch (err) {
            toast.error('Error fetching payment sheet: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSheet();
    }, [id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="p-4 max-w-4xl mx-auto font-calibri">
            {/* Header controls (hidden on print) */}
            <div className="no-print bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/employees/${id}`)}>
                        <ArrowLeft size={16} className="mr-1" /> Back to Profile
                    </Button>
                    <h2 className="text-sm font-bold text-gray-700 uppercase">Employee Payment Sheet Control</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                        <label className="font-bold text-gray-600">From:</label>
                        <input type="date" className="border rounded px-2 py-1 bg-gray-50" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <label className="font-bold text-gray-600">To:</label>
                        <input type="date" className="border rounded px-2 py-1 bg-gray-50" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <Button variant="primary" size="sm" onClick={loadSheet} loading={loading}>
                        <RefreshCw size={14} className="mr-1" /> Load
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer size={14} className="mr-1" /> Print Report
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="py-16 text-center text-gray-500 flex justify-center items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-blue-600" />
                    <span>Calculating work hours and generating sheet...</span>
                </div>
            )}

            {/* Printable Payment Sheet */}
            {data && !loading && (
                <Card className="bg-white p-10 border border-gray-300 rounded shadow-none text-gray-900 text-sm leading-relaxed max-w-[800px] mx-auto print:border-0 print:p-0">
                    
                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-1">
                            <img src="/logo.jpg" alt="GLX Logo" className="h-12 w-12 object-contain filter grayscale" />
                        </div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">GLX INDUSTRIES</h1>
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-700 border-b pb-2 max-w-[320px] mx-auto border-gray-400 mt-0.5">
                            EMPLOYEE PAYMENT SHEET
                        </h2>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[13px] border-b pb-4 mb-4 border-gray-300 font-calibri">
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-600 w-28">Name :</span>
                            <span className="font-bold text-gray-950">{data.employee.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-600 w-28">Salary Per Hour :</span>
                            <span className="font-bold font-mono">{formatCurrency(data.employee.hourlyRate)}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-600 w-28">Date From :</span>
                            <span>{data.startDate}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-600 w-28">Date To :</span>
                            <span>{data.endDate}</span>
                        </div>
                    </div>

                    {/* Sheet Table */}
                    <table className="w-full text-xs text-left border-collapse font-calibri mb-6">
                        <thead>
                            <tr className="border-b-2 border-t border-gray-400 uppercase text-[10px] text-gray-800 font-bold">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3 text-center">IN</th>
                                <th className="py-2.5 px-3 text-center">OUT</th>
                                <th className="py-2.5 px-3 text-center">HOURS</th>
                                <th className="py-2.5 px-3 text-right">DAY SALARY</th>
                                <th className="py-2.5 px-3 text-right">ADVANCE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-medium text-gray-700">{row.date}</td>
                                    <td className="py-2 px-3 text-center font-mono text-gray-600">{row.inTime}</td>
                                    <td className="py-2 px-3 text-center font-mono text-gray-600">{row.outTime}</td>
                                    <td className="py-2 px-3 text-center font-mono font-semibold text-gray-800">{row.hours}</td>
                                    <td className="py-2 px-3 text-right font-mono text-gray-800">
                                        {row.daySalary > 0 ? formatCurrency(row.daySalary) : '0.00'}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-red-600">
                                        {row.advance > 0 ? formatCurrency(row.advance) : '0.00'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Summary */}
                    <div className="flex justify-end pt-2 border-t-2 border-gray-400 font-calibri">
                        <div className="w-64 text-xs space-y-2">
                            <div className="flex justify-between font-semibold text-gray-700">
                                <span>Total Salary :</span>
                                <span className="font-mono">{formatCurrency(data.totalSalary)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-red-600">
                                <span>Total Advances :</span>
                                <span className="font-mono">-{formatCurrency(data.totalAdvances)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-300">
                                <span>Net Salary :</span>
                                <span className="font-mono text-blue-900 border-b-4 border-double border-gray-900 pb-0.5">
                                    {formatCurrency(data.netSalary)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
