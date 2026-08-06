import { Schema, model, models, Model, Document } from 'mongoose';

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
  strict: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const KeyValueModel: Model<IKeyValueDoc> = (models.KeyValueStore as Model<IKeyValueDoc>) || model<IKeyValueDoc>('KeyValueStore', KeyValueSchema);


