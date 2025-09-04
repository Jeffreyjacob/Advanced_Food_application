import { model, Schema } from 'mongoose';
import { IBaseRequest } from '../interface/models/models';
import { RequestStatusEnum } from '../interface/enums/enums';

const baseRequestSchema: Schema<IBaseRequest> = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'orders',
      required: true,
    },
    requestStatus: {
      type: String,
      enum: RequestStatusEnum,
      trim: true,
      default: RequestStatusEnum.pending,
    },
    rejectionReason: {
      type: String,
    },
    requestJobId: {
      type: String,
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 25 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'requestType',
  }
);

export const BaseRequest = model<IBaseRequest>(
  'baseRequest',
  baseRequestSchema
);
