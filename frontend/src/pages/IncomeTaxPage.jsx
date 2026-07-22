import { useState } from 'react';
import { 
    Scale, HelpCircle, FileText, ArrowUpRight, 
    Calculator, DollarSign, Download, Calendar
} from 'lucide-react';

export default function IncomeTaxPage() {
    const [taxYear, setTaxYear] = useState('2025/2026');
    const [quarter, setQuarter] = useState('Q1');
    const [loading, setLoading] = useState(false);

    // Stub tax computations
    const taxAssessments = {
        corporateTax: {
            estimatedProfit: 4500000,
            rate: 0.30, // Sri Lanka corporate tax rate is standard 30%
            taxLiability: 1350000,
            paid: 900000,
            payable: 450000
        },
        apitPaye: {
            totalEmployees: 4,
            apitWithheld: 184500, // APIT withheld from employee payroll
            paid: 184500,
            payable: 0
        },
        whtTax: {
            totalTransactions: 12,
            whtWithheld: 72300, // Withholding Tax on service provider payments
            paid: 50000,
            payable: 22300
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Scale className="w-7 h-7 text-emerald-500" />
                        Statutory Tax Ledger
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Corporate Income Tax estimations, Withholding Tax (WHT) ledgers, and employee APIT withholdings
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={taxYear}
                        onChange={(e) => setTaxYear(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 outline-none"
                    >
                        <option value="2024/2025">Year 2024/2025</option>
                        <option value="2025/2026">Year 2025/2026</option>
                    </select>

                    <select
                        value={quarter}
                        onChange={(e) => setQuarter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 outline-none"
                    >
                        <option value="Q1">Quarter 1</option>
                        <option value="Q2">Quarter 2</option>
                        <option value="Q3">Quarter 3</option>
                        <option value="Q4">Quarter 4</option>
                    </select>
                </div>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Corporate Tax card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corporate Income Tax</span>
                            <Calculator className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
                            LKR {taxAssessments.corporateTax.taxLiability.toLocaleString()}
                        </p>
                        <div className="flex justify-between text-[11px] mt-2 text-slate-500">
                            <span>Paid: LKR {taxAssessments.corporateTax.paid.toLocaleString()}</span>
                            <span className="font-bold text-rose-500">Due: LKR {taxAssessments.corporateTax.payable.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* APIT card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">APIT / PAYE (Payroll)</span>
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
                            LKR {taxAssessments.apitPaye.apitWithheld.toLocaleString()}
                        </p>
                        <div className="flex justify-between text-[11px] mt-2 text-slate-500">
                            <span>Employees: {taxAssessments.apitPaye.totalEmployees}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Paid: Fully Settled</span>
                        </div>
                    </div>
                </div>

                {/* WHT card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Withholding Tax (WHT)</span>
                            <ArrowUpRight className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
                            LKR {taxAssessments.whtTax.whtWithheld.toLocaleString()}
                        </p>
                        <div className="flex justify-between text-[11px] mt-2 text-slate-500">
                            <span>Paid: LKR {taxAssessments.whtTax.paid.toLocaleString()}</span>
                            <span className="font-bold text-rose-500">Due: LKR {taxAssessments.whtTax.payable.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculations Detail Section */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Tax Estimation Workspace</h3>
                        <p className="text-[11px] text-slate-400">Quarterly tax calculation sheet</p>
                    </div>
                    <button 
                        onClick={() => alert('Tax report downloaded')} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 transition"
                    >
                        <Download size={12} />
                        Download PDF Statement
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Corporate Tax Workspace */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Corporate Income Tax Estimate</span>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">Gross Revenue (Est.)</span>
                                <span className="font-semibold text-slate-800 dark:text-white">LKR 12,450,000</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">Allowable Deductions / Expenses</span>
                                <span className="font-semibold text-slate-800 dark:text-white">- LKR 7,950,000</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">Assessable Profit</span>
                                <span className="font-bold text-slate-800 dark:text-white">LKR 4,500,000</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">Tax Rate (Sri Lanka Standard)</span>
                                <span className="font-semibold text-slate-800 dark:text-white">30.00 %</span>
                            </div>
                            <div className="flex justify-between p-2 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-lg font-bold">
                                <span className="text-emerald-700 dark:text-emerald-400">Quarterly Installment Due</span>
                                <span className="text-emerald-700 dark:text-emerald-450">LKR 1,350,000</span>
                            </div>
                        </div>
                    </div>

                    {/* WHT & APIT Details */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Payroll APIT & WHT Withholdings</span>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">APIT Deductions (Employees)</span>
                                <span className="font-semibold text-slate-800 dark:text-white">LKR 184,500</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">WHT on Professional Fees (10%)</span>
                                <span className="font-semibold text-slate-800 dark:text-white">LKR 45,000</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">WHT on Rent & Leases (10%)</span>
                                <span className="font-semibold text-slate-800 dark:text-white">LKR 27,300</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                                <span className="text-slate-505 dark:text-slate-350">Total Withholding Tax Liability</span>
                                <span className="font-bold text-slate-800 dark:text-white">LKR 256,800</span>
                            </div>
                            <div className="flex justify-between p-2 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded-lg font-bold">
                                <span className="text-amber-700 dark:text-amber-400">Total Tax Remitted to Inland Revenue (IRD)</span>
                                <span className="text-amber-750 dark:text-amber-450">LKR 234,500</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
