import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ISystemUser extends Document {
  id: string; // custom UUID
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Produtor' | 'Gestor' | 'Freelancer';
  freelancerId?: string;
  username: string;
  cpf: string;
  password?: string;
  isMasterAdmin?: boolean;
  statusAprovacao?: 'Pendente' | 'Aprovado' | 'Rejeitado';
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<ISystemUser>({
  id: { type: String, required: true, unique: true, index: true },
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  perfil: { 
    type: String, 
    required: true, 
    enum: ['Administrador', 'Produtor', 'Gestor', 'Freelancer'] 
  },
  freelancerId: { type: String },
  username: { type: String, required: true, unique: true, index: true },
  cpf: { type: String, required: true, unique: true },
  password: { type: String },
  isMasterAdmin: { type: Boolean, default: false },
  statusAprovacao: { 
    type: String, 
    enum: ['Pendente', 'Aprovado', 'Rejeitado'], 
    default: 'Aprovado' 
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password; // Do not expose password hash in JSON serialization
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook to automatically hash password using bcrypt
UserSchema.pre('save', async function (this: any, next: any) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Helper method to securely compare candidate password against hash
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = model<ISystemUser>('SystemUser', UserSchema);
