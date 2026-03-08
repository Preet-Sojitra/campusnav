import mongoose, { Schema, Document } from "mongoose";

export interface IMapCache extends Document {
    cacheKey: string;
    routeData: any;
    createdAt: Date;
}

const MapCacheSchema = new Schema<IMapCache>(
    {
        cacheKey: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        routeData: {
            type: Schema.Types.Mixed,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 604800 // Automatically expire documents after 7 days
        }
    },
    { timestamps: true }
);

export default mongoose.models.MapCache || mongoose.model<IMapCache>("MapCache", MapCacheSchema);
