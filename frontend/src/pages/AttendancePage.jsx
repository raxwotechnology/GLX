import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Upload, Clock, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import api from '../api/axios';
import { useAttendance, useBulkMarkAttendance, useEmployees, useDepartments } from '../features/hr/useHr';

const statusVariant = {
    present: 'success', absent: 'danger', half_day: 'warning',
    leave: 'info', holiday: 'default', weekend: 'default', late: 'warning',
};

export default function AttendancePage() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [departmentId, setDepartmentId] = useState('');
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const { data: attData, refetch: refetchAttendance } = useAttendance({ date: selectedDate, departmentId: departmentId || undefined, limit: 200 });
    const { data: empData } = useEmployees({ departmentId: departmentId || undefined, status: 'active', limit: 500 });
    const { data: deptsData } = useDepartments();
    const bulkMark = useBulkMarkAttendance();

    const attendance = attData?.data || [];
    const employees = empData?.data || [];
    const depts = deptsData?.data || [];
    const deptOptions = depts.map((d) => ({ value: d._id, label: d.name }));

    const [bulkRecords, setBulkRecords] = useState([]);

    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const openBulk = () => {
        const attMap = new Map();
        attendance.forEach((a) => {
            if (a.employeeId) {
                const id = typeof a.employeeId === 'object' ? a.employeeId._id : a.employeeId;
                if (id) attMap.set(id.toString(), a);
            }
        });

        const records = employees.map((e) => {
            const existing = attMap.get(e._id.toString());
            return {
                employeeId: e._id,
                employeeName: `${e.firstName} ${e.lastName}`,
                status: existing?.status || 'present',
                checkInTime: existing?.checkInTime ? formatDateTimeLocal(existing.checkInTime) : `${selectedDate}T08:00`,
                checkOutTime: existing?.checkOutTime ? formatDateTimeLocal(existing.checkOutTime) : `${selectedDate}T17:00`,
            };
        });
        setBulkRecords(records);
        setIsBulkOpen(true);
    };

    const submitBulk = async () => {
        try {
            await bulkMark.mutateAsync({
                date: selectedDate,
                records: bulkRecords.map((r) => ({
                    employeeId: r.employeeId,
                    status: r.status,
                    checkInTime: ['present', 'late', 'half_day'].includes(r.status) && r.checkInTime ? r.checkInTime : undefined,
                    checkOutTime: ['present', 'late', 'half_day'].includes(r.status) && r.checkOutTime ? r.checkOutTime : undefined,
                })),
            });
            setIsBulkOpen(false);
            refetchAttendance();
        } catch { }
    };

    // Fingerprint sheet file import parser
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (json.length === 0) {
                    toast.error('The uploaded sheet is empty.');
                    setImportLoading(false);
                    return;
                }

                // Send to backend endpoint
                const res = await api.post('/hr/attendance/import-fingerprint', { records: json });

                if (res.data.success) {
                    setImportResult(res.data);
                    toast.success(res.data.message);
                    refetchAttendance();
                } else {
                    toast.error(res.data.message || 'Import failed');
                }
            } catch (err) {
                console.error('Fingerprint import error:', err);
                toast.error('Failed to parse fingerprint file. Ensure file format is valid.');
            } finally {
                setImportLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const columns = [
        {
            key: 'employee', label: 'Employee', render: (r) => (
                <div>
                    <p className="font-medium text-sm">{r.employeeName || (r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : '-')}</p>
                    <p className="text-xs font-mono text-gray-500">{r.employeeCode}</p>
                </div>
            )
        },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status?.replace(/_/g, ' ')}</Badge> },
        { key: 'checkIn', label: 'Check In', render: (r) => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }) : '—' },
        { key: 'checkOut', label: 'Check Out', render: (r) => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }) : '—' },
        { key: 'worked', label: 'Worked', render: (r) => r.totalWorkedMinutes ? `${(r.totalWorkedMinutes / 60).toFixed(1)} hrs` : '—' },
        { key: 'late', label: 'Late', render: (r) => r.lateMinutes > 0 ? <span className="text-amber-600 font-semibold">{r.lateMinutes} min (-Rs. {r.latePenaltyAmount || 0})</span> : '—' },
        { key: 'ot', label: 'OT Pay', render: (r) => r.overtimeMinutes > 0 ? <span className="text-emerald-600 font-semibold">{(r.overtimeMinutes / 60).toFixed(1)} hrs (+Rs. {r.overtimeAmount || 0})</span> : '—' },
        { key: 'source', label: 'Method', render: (r) => r.importedViaFingerprint ? <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Biometric Fingerprint</span> : <span className="text-xs text-gray-500">Manual</span> },
    ];

    return (
        <div>
            <PageHeader
                title="Attendance & Fingerprint Log"
                description="Daily staff attendance, biometric imports, and policy rules"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/attendance-policies')}>
                            <Clock size={16} className="mr-1.5" /> Manage Policies
                        </Button>
                        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                            <Upload size={16} className="mr-1.5" /> Import Fingerprint Sheet
                        </Button>
                        <Button variant="primary" onClick={openBulk}>
                            <Plus size={16} className="mr-1.5" /> Bulk Mark Attendance
                        </Button>
                    </div>
                }
            />

            <Card>
                <div className="p-4 border-b flex gap-3">
                    <div className="w-48">
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <div className="w-56">
                        <Select placeholder="All Departments" options={deptOptions}
                            value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
                    </div>
                </div>
                {attendance.length === 0
                    ? <EmptyState icon={CalendarIcon} title="No attendance recorded for this date" description="Click 'Import Fingerprint Sheet' or 'Bulk Mark Attendance' to populate"
                        action={
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsImportOpen(true)}>Import Biometric Sheet</Button>
                                <Button variant="primary" onClick={openBulk}>Mark Attendance</Button>
                            </div>
                        } />
                    : <Table columns={columns} data={attendance} />}
            </Card>

            {/* Bulk Mark Modal */}
            <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title={`Mark Attendance — ${selectedDate}`} size="lg">
                <div className="p-6 max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr>
                                <th className="text-left py-2">Employee</th>
                                <th className="text-left py-2">Status</th>
                                <th className="text-left py-2">In</th>
                                <th className="text-left py-2">Out</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bulkRecords.map((r, idx) => (
                                <tr key={r.employeeId}>
                                    <td className="py-2">{r.employeeName}</td>
                                    <td className="py-2">
                                        <select value={r.status}
                                            onChange={(e) => {
                                                const newR = [...bulkRecords]; newR[idx].status = e.target.value; setBulkRecords(newR);
                                            }}
                                            className="px-2 py-1 border rounded text-xs">
                                            <option value="present">Present</option>
                                            <option value="absent">Absent</option>
                                            <option value="half_day">Half Day</option>
                                            <option value="late">Late</option>
                                            <option value="leave">Leave</option>
                                        </select>
                                    </td>
                                    <td className="py-2">
                                        <input type="datetime-local" value={r.checkInTime}
                                            onChange={(e) => {
                                                const newR = [...bulkRecords]; newR[idx].checkInTime = e.target.value; setBulkRecords(newR);
                                            }}
                                            disabled={!['present', 'late', 'half_day'].includes(r.status)}
                                            className="px-2 py-1 border rounded text-xs disabled:bg-gray-100" />
                                    </td>
                                    <td className="py-2">
                                        <input type="datetime-local" value={r.checkOutTime}
                                            onChange={(e) => {
                                                const newR = [...bulkRecords]; newR[idx].checkOutTime = e.target.value; setBulkRecords(newR);
                                            }}
                                            disabled={!['present', 'late', 'half_day'].includes(r.status)}
                                            className="px-2 py-1 border rounded text-xs disabled:bg-gray-100" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={submitBulk} loading={bulkMark.isPending}>
                        Save All ({bulkRecords.length} records)
                    </Button>
                </div>
            </Modal>

            {/* Fingerprint Importer Modal */}
            <Modal isOpen={isImportOpen} onClose={() => { setIsImportOpen(false); setImportResult(null); }} title="Import Biometric Fingerprint Sheet" size="md">
                <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-500">
                        Upload exported attendance Excel (.xlsx, .xls) or CSV logs from biometric fingerprint scanners. Records will be matched by Employee Code or Name and evaluated against active Attendance Policies.
                    </p>

                    <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-indigo-50/50 dark:bg-indigo-950/20">
                        <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                        <label className="cursor-pointer text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Choose Fingerprint Log File
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">Supports Excel & CSV biometric logs</p>
                    </div>

                    {importLoading && (
                        <div className="text-center text-sm text-indigo-600 py-2">
                            Processing biometric sheet & evaluating policies...
                        </div>
                    )}

                    {importResult && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-xs space-y-2">
                            <p className="font-bold text-emerald-600">✓ {importResult.message}</p>
                            {importResult.errors?.length > 0 && (
                                <div className="text-rose-600 space-y-1 mt-2">
                                    <p className="font-semibold">Warnings / Errors ({importResult.errors.length}):</p>
                                    <ul className="list-disc pl-4 max-h-32 overflow-y-auto">
                                        {importResult.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportResult(null); }}>
                        Close
                    </Button>
                </div>
            </Modal>
        </div>
    );
}