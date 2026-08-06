import { ProjectModel, IDocProject } from './project.schema';
import { connectToDatabase } from './db';

export class ProjectRepository {
  /**
   * Loads all projects from MongoDB.
   * Connects to the database automatically if needed.
   */
  async loadProjects(): Promise<IDocProject[]> {
    try {
      await connectToDatabase();
      
      // Fetch all projects, sorted by event name or creation date
      const projects = await ProjectModel.find()
        .sort({ createdAt: -1 })
        .exec();
        
      return projects;
    } catch (error) {
      console.error('[ProjectRepository] Error loading projects:', error);
      throw new Error('Falha ao carregar os projetos do banco de dados.');
    }
  }

  /**
   * Saves or updates a list of projects in bulk (replacing or merging).
   * This mimics the frontend's saveToDatabase style, ensuring backwards-compatibility
   * during transition phases, but provides individual upserts for optimal MongoDB operation.
   */
  async saveAllProjects(projects: IDocProject[]): Promise<void> {
    try {
      await connectToDatabase();
      
      const bulkOps = projects.map(proj => ({
        updateOne: {
          filter: { id: proj.id },
          update: { $set: proj },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        await ProjectModel.bulkWrite(bulkOps);
        console.log(`[ProjectRepository] Successfully bulk-wrote ${projects.length} projects to MongoDB.`);
      }
    } catch (error) {
      console.error('[ProjectRepository] Error bulk-saving projects:', error);
      throw new Error('Falha ao salvar o lote de projetos no banco de dados.');
    }
  }

  /**
   * Saves or updates a single project.
   */
  async saveProject(project: Partial<IDocProject> & { id: string }): Promise<IDocProject> {
    try {
      await connectToDatabase();
      
      const updatedProject = await ProjectModel.findOneAndUpdate(
        { id: project.id },
        { $set: project },
        { new: true, upsert: true, runValidators: true }
      ).exec();

      console.log(`[ProjectRepository] Saved single project: ${project.id}`);
      return updatedProject;
    } catch (error) {
      console.error('[ProjectRepository] Error saving single project:', error);
      throw new Error(`Falha ao salvar o projeto com ID ${project.id}.`);
    }
  }

  /**
   * Finds a project by its custom UUID.
   */
  async findProjectById(id: string): Promise<IDocProject | null> {
    try {
      await connectToDatabase();
      return await ProjectModel.findOne({ id }).exec();
    } catch (error) {
      console.error('[ProjectRepository] Error finding project:', error);
      throw new Error(`Falha ao buscar projeto ID ${id}.`);
    }
  }

  /**
   * Deletes a project by its custom UUID.
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const result = await ProjectModel.deleteOne({ id }).exec();
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[ProjectRepository] Error deleting project:', error);
      throw new Error(`Falha ao excluir o projeto com ID ${id}.`);
    }
  }
}
