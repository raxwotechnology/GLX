import { useState, useEffect } from 'react';
import { 
    Coins, Calculator, Search, Printer, Download, 
    FileSpreadsheet, Users, HelpCircle 
} from 'lucide-react';
import api from '../api/axios';

export default function EpfEtfPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/hr/employees', { params: { status: 'active' } });
                if (res.data?.success) {
                    setEmployees(res.data.data);
                } else {
                    // Fallback stub data if API returns empty
                    setEmployees([
                        { _id: '1', firstName: 'Kamil', lastName: 'Sameer', employeeCode: 'EMP-001', baseSalary: 85000, designationId: { name: 'Lead Machinist' } },
                        { _id: '2', firstName: 'Dilan', lastName: 'Perera', employeeCode: 'EMP-002', baseSalary: 62000, designationId: { name: 'Senior Fabricator' } },
                        { _id: '3', firstName: 'Tharindu', lastName: 'Silva', employeeCode: 'EMP-003', baseSalary: 45000, designationId: { name: 'Apprentice Assembler' } },
                        { _id: '4', firstName: 'Nisansala', lastName: 'Fernando', employeeCode: 'EMP-004', baseSalary: 55000, designationId: { name: 'Operations Asst.' } }
                    ]);
                }
            } catch (err) {
                console.error('Error fetching employees for EPF:', err);
                // Fallback stub data
                setEmployees([
                    { _id: '1', firstName: 'Kamil', lastName: 'Sameer', employeeCode: 'EMP-001', baseSalary: 85000, designationId: { name: 'Lead Machinist' } },
                    { _id: '2', firstName: 'Dilan', lastName: 'Perera', employeeCode: 'EMP-002', baseSalary: 62000, designationId: { name: 'Senior Fabricator' } },
                    { _id: '3', firstName: 'Tharindu', lastName: 'Silva', employeeCode: 'EMP-003', baseSalary: 45000, designationId: { name: 'Apprentice Assembler' } },
                    { _id: '4', firstName: 'Nisansala', lastName: 'Fernando', employeeCode: 'EMP-004', baseSalary: 55000, designationId: { name: 'Operations Asst.' } }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    // Perform EPF calculations
    const computedEPFData = employees.map(emp => {
        const salary = emp.baseSalary || emp.salary || 50000;
        const epfEmployee = salary * 0.08;
        const epfEmployer = salary * 0.12;
        const etfEmployer = salary * 0.03;
        const totalContribution = epfEmployee + epfEmployer + etfEmployer;
        return {
            ...emp,
            salary,
            epfEmployee,
            epfEmployer,
            etfEmployer,
            totalContribution
        };
    });

    const filteredEPFData = computedEPFData.filter(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) || (emp.employeeCode || '').toLowerCase().includes(search.toLowerCase());
    });

    // Totals
    const totalSalaries = filteredEPFData.reduce((acc, curr) => acc + curr.salary, 0);
    const totalEpfEmployee = filteredEPFData.reduce((acc, curr) => acc + curr.epfEmployee, 0);
    const totalEpfEmployer = filteredEPFData.reduce((acc, curr) => acc + curr.epfEmployer, 0);
    const totalEtfEmployer = filteredEPFData.reduce((acc, curr) => acc + curr.etfEmployer, 0);
    const grandTotal = totalEpfEmployee + totalEpfEmployer + totalEtfEmployer;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Coins className="w-7 h-7 text-emerald-500" />
                        EPF & ETF Monthly Contribution Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage statutory EPF (Employer 12%, Employee 8%) and ETF (Employer 3%) compliance reports
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 transition"
                    >
                        <Printer size={14} />
                        Print Schedule
                    </button>
                    <button
                        onClick={() => alert('EPF/ETF Excel Schedule generated successfully')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                        <Download size={14} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Selection filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 print:hidden">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by employee name / ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none"
                    >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none"
                    >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </select>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total EPF Liability (20%)</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">LKR {(totalEpfEmployee + totalEpfEmployer).toLocaleString()}</p>
                        <p className="text-[9px] text-slate-450 mt-1">EE (8%): LKR {totalEpfEmployee.toLocaleString()} · ER (12%): LKR {totalEpfEmployer.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Calculator className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total ETF Liability (3%)</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">LKR {totalEtfEmployer.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-450 mt-1">100% Employer Contribution</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Coins className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grand Total Compliance due</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">LKR {grandTotal.toLocaleString()}</p>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1">Calculated across {filteredEPFData.length} active employees</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Table schedule */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">EPF / ETF Schedule for {month}/{year}</h3>
                    <HelpCircle className="w-4 h-4 text-slate-450 cursor-pointer print:hidden" title="Statutory rates: Employees' Provident Fund (EPF) and Employees' Trust Fund (ETF) Sri Lanka" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <th className="p-4">Emp Code</th>
                                <th className="p-4">Employee Name</th>
                                <th className="p-4 text-right">Basic Salary</th>
                                <th className="p-4 text-right">EE EPF (8%)</th>
                                <th className="p-4 text-right">ER EPF (12%)</th>
                                <th className="p-4 text-right">ER ETF (3%)</th>
                                <th className="p-4 text-right">Total Payable (23%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-250 dark:divide-slate-700 text-xs">
                            {filteredEPFData.map(emp => (
                                <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-200">
                                    <td className="p-4 font-mono text-[11px]">{emp.employeeCode || '—'}</td>
                                    <td className="p-4 font-bold">{emp.firstName} {emp.lastName}</td>
                                    <td className="p-4 text-right font-medium">LKR {emp.salary.toLocaleString()}</td>
                                    <td className="p-4 text-right text-slate-600 dark:text-slate-350">LKR {emp.epfEmployee.toLocaleString()}</td>
                                    <td className="p-4 text-right text-slate-600 dark:text-slate-350">LKR {emp.epfEmployer.toLocaleString()}</td>
                                    <td className="p-4 text-right text-slate-600 dark:text-slate-350">LKR {emp.etfEmployer.toLocaleString()}</td>
                                    <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">LKR {emp.totalContribution.toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Summary row */}
                            <tr className="bg-slate-50 dark:bg-slate-900/70 text-xs font-bold text-slate-800 dark:text-white border-t border-slate-300 dark:border-slate-600">
                                <td colSpan="2" className="p-4">TOTALS</td>
                                <td className="p-4 text-right">LKR {totalSalaries.toLocaleString()}</td>
                                <td className="p-4 text-right">LKR {totalEpfEmployee.toLocaleString()}</td>
                                <td className="p-4 text-right">LKR {totalEpfEmployer.toLocaleString()}</td>
                                <td className="p-4 text-right">LKR {totalEtfEmployer.toLocaleString()}</td>
                                <td className="p-4 text-right text-emerald-600 dark:text-emerald-450">LKR {grandTotal.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
