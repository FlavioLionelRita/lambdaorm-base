import { Schema, EntityType } from '../../domain'
import { SchemaService } from '../services/schemaService'

export class CreateSchema {
	// eslint-disable-next-line no-useless-constructor
	constructor (private readonly schemaService:SchemaService) {}

	public create (types?: EntityType[]):Schema {
		const schema = this.schemaService.newSchema()
		if (types && types.length > 0) {
			this.schemaService.addEntityTypes(schema, types)
		}
		return schema
	}
}
