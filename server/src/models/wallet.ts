import { model, Schema } from 'mongoose';
import { IWallet } from '../interface/models/models';
import {
  StripeAccountStatusEnum,
  StripeAccountType,
} from '../interface/enums/enums';

const WalletSchema: Schema<IWallet> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'baseUsers',
      required: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
    accountType: {
      type: String,
      enum: StripeAccountType,
      default: StripeAccountType.express,
    },
    country: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    balance: {
      available: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now(),
      },
    },
    accountStatus: {
      type: String,
      enum: StripeAccountStatusEnum,
      default: StripeAccountStatusEnum.pending,
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    chargesEnabled: {
      type: Boolean,
      default: false,
    },
    detailsSubmitted: {
      type: Boolean,
      default: false,
    },
    requirements: {
      currentDeadline: Date,
      disabledReason: String,
      currentlyDue: [String],
      eventuallyDue: [String],
      pastDue: [String],
      pendingVerification: [String],
    },
    bankAccount: {
      accountHolderName: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      country: String,
      currency: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    deauthorizedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

WalletSchema.index({ accountStatus: 1 });

export const Wallets = model<IWallet>('wallets', WalletSchema);
