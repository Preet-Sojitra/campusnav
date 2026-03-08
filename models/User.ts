import mongoose from "mongoose";

const ScheduleClassSchema = new mongoose.Schema({
    id: String,
    status: String,
    courseCode: String,
    courseName: String,
    startTime: String,
    endTime: String,
    location: String,
    professor: String,
    directionsUrl: { type: String, default: null },
    walkDurationSeconds: { type: Number, default: null },
    leaveByTime: { type: String, default: null },
});

const RawClassEntrySchema = new mongoose.Schema({
    day: String,
    courseCode: String,
    courseName: String,
    startTime: String,
    room: String,
});

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
        },
        savedSchedule: {
            type: [RawClassEntrySchema],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
