import { Schema, SchemaData, Dialect } from '../domain'
import { SchemaExtender } from './services/schemaExtender'
import { CreateSchema } from './useCases/create'
import { UpdateSchema } from './useCases/update'
import { SchemaService } from './services/schemaService'
import { GetSchemaSchema } from './useCases/getSchemaData'
import { Type } from 'typ3s'
export class SchemaFacade {
	// eslint-disable-next-line no-useless-constructor
	constructor (
		public readonly schemaService:SchemaService,
		private readonly getSchemaData: GetSchemaSchema,
		private readonly extender:SchemaExtender,
		private readonly createSchema: CreateSchema,
		private readonly updateSchema: UpdateSchema
	) {}

	public create (dialect?: Dialect, connection?: any): Schema {
		return this.createSchema.create(dialect, connection)
	}

	public updateFromData (schema: Schema, data: any | any[], name:string): SchemaData {
		const type = this.updateSchema.update(schema, data, name)
		const schemaData = this.schemaData(data, name, type)
		return schemaData
	}

	public schemaData (source:any, name:string, type: Type): SchemaData {
		return this.getSchemaData.getData(source, name, type)
	}

	public complete (schema: Schema): void {
		this.extender.complete(schema)
	}
}
