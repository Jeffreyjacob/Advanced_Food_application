import { model, Schema } from 'mongoose';
import { IToken } from '../interface/models/models';

const tokenSchema: Schema<IToken> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'baseUsers',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    isExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.index({ user: 1, token: 1 });
tokenSchema.index({ user: 1, token: 1, isRevoked: 1, isExpiresAt: 1 });

export const Tokens = model<IToken>('tokens', tokenSchema);
