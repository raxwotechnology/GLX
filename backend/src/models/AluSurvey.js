import mongoose from 'mongoose';

const aluSurveyMeasurementSchema = new mongoose.Schema({
    label: { type: String, required: true }, // e.g. "GF-W1"
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    applicationType: { type: String, required: true },
    configuration: { type: String, required: true }
});

const aluSurveySchema = new mongoose.Schema({
    surveyNumber: {
        type: String,
        required: true,
        unique: true
    },
    customerName: { type: String, required: true },
    projectName: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'quoted'],
        default: 'pending'
    },
    measurements: [aluSurveyMeasurementSchema],
    notes: { type: String, default: '' },
    surveyorName: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('AluSurvey', aluSurveySchema);
