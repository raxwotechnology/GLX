import mongoose from 'mongoose';

const salaryAdvanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
export default SalaryAdvance;
