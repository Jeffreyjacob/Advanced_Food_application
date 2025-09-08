import mongoose, { Schema } from 'mongoose';
import { IRejectedTracker } from '../interface/models/models';
import { RoleEnums } from '../interface/enums/enums';

const RejectTrackerSchema: Schema<IRejectedTracker> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'baseUsers',
      required: true,
    },
    userType: {
      type: String,
      enum: RoleEnums,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'orders',
      required: true,
    },
    rejectedAt: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: true,
  }
);

RejectTrackerSchema.index({ userId: 1 });
RejectTrackerSchema.index({ orderId: 1 });
RejectTrackerSchema.index({ userId: 1, orderId: 1 });

export const RejectedTracker = mongoose.model<IRejectedTracker>(
  'rejectedTracker',
  RejectTrackerSchema
);
