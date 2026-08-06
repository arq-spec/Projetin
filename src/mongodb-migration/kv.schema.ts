import { Schema, model, Document } from 'mongoose';

export interface IKeyValueDoc extends Document {
  key: string;
  data: any;
  updatedAt: Date;
}

const KeyValueSchema = new Schema<IKeyValueDoc>({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const KeyValueModel = model<IKeyValueDoc>('KeyValueStore', KeyValueSchema);
