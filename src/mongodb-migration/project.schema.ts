import { Schema, model, Document } from 'mongoose';

// -------------------------------------------------------------------------
// TypeScript Interfaces for Subdocuments & Documents
// -------------------------------------------------------------------------

export interface IDocStructureItem {
  id: string;
  equipamentoId: string;
  nome: string;
  quantidade: number;
  pesoUnitario: number;
}

export interface IDocAnchoragePoint {
  ponto: string;
  fixacao: string;
}

export interface IDocStructure {
  id: string;
  nome: string;
  pontosFixacao: number;
  itens: IDocStructureItem[];
  pontosAncoragem: IDocAnchoragePoint[];
  nomenclaturaPrefix?: string;
}

export interface IDocAmbiente {
  id: string;
  nome: string;
  estruturas: IDocStructure[];
}

export interface IDocProject extends Document {
  id: string; // Map to Database-compatible UUID or sequential ID
  evento: string;
  dataEvento: string;
  pesoMaxPonto: number;
  ambientes: IDocAmbiente[];
  materiaisAncoragem: string;
  responsavel: string;
  crea: string;
  art: string;
  dataEmissao?: string;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------------------------
// Mongoose Schemas definitions
// -------------------------------------------------------------------------

const DocStructureItemSchema = new Schema<IDocStructureItem>({
  id: { type: String, required: true },
  equipamentoId: { type: String, required: true },
  nome: { type: String, required: true },
  quantidade: { type: Number, required: true, default: 1 },
  pesoUnitario: { type: Number, required: true, default: 0 }
}, { _id: false }); // Disable automatic MongoDB _id for embedded nested array items to respect standard clean IDs

const DocAnchoragePointSchema = new Schema<IDocAnchoragePoint>({
  ponto: { type: String, required: true },
  fixacao: { type: String, required: true }
}, { _id: false });

const DocStructureSchema = new Schema<IDocStructure>({
  id: { type: String, required: true },
  nome: { type: String, required: true },
  pontosFixacao: { type: Number, required: true, default: 0 },
  itens: [DocStructureItemSchema],
  pontosAncoragem: [DocAnchoragePointSchema],
  nomenclaturaPrefix: { type: String }
}, { _id: false });

const DocAmbienteSchema = new Schema<IDocAmbiente>({
  id: { type: String, required: true },
  nome: { type: String, required: true },
  estruturas: [DocStructureSchema]
}, { _id: false });

const DocProjectSchema = new Schema<IDocProject>({
  id: { type: String, required: true, unique: true, index: true },
  evento: { type: String, required: true, index: true },
  dataEvento: { type: String, required: true },
  pesoMaxPonto: { type: Number, required: true, default: 0 },
  ambientes: [DocAmbienteSchema],
  materiaisAncoragem: { type: String, required: true },
  responsavel: { type: String, required: true },
  crea: { type: String, required: true },
  art: { type: String, required: true },
  dataEmissao: { type: String }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// -------------------------------------------------------------------------
// Exporting the Model
// -------------------------------------------------------------------------

export const ProjectModel = model<IDocProject>('DocProject', DocProjectSchema);
