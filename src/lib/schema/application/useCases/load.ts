import { Schema, SchemaError } from '../../domain'
import { DataSourceConfigService } from '../services/config/dataSourceConfigService'
import { DomainConfigService } from '../services/config/domainConfigService'
import { MappingsConfigService } from '../services/config/mappingsConfigService'
import { StageConfigService } from '../services/config/stageConfigService'
import { ViewsConfigService } from '../services/config/viewsConfigService'
import { OrmBaseH3lp } from '../../../shared'

export class LoadSchema {
	// eslint-disable-next-line no-useless-constructor
	constructor (private readonly source: DataSourceConfigService,
		private readonly domain:DomainConfigService,
		private readonly mapping:MappingsConfigService,
		private readonly stage:StageConfigService,
		private readonly view:ViewsConfigService,
		private readonly helper:OrmBaseH3lp) {}

	public load (source: Schema): Schema {
		const schema = this.helper.utils.solveEnvironmentVars(source) as Schema
		this.domain.entities = schema.domain.entities || []
		this.domain.enums = schema.domain.enums || []

		if (!schema.infrastructure) {
			return schema
		}
		if (!schema.infrastructure.views) {
			schema.infrastructure.views = [{ name: 'default', entities: [] }]
		}
		for (const view of schema.infrastructure.views) {
			this.view.load(view)
		}
		if (schema.infrastructure.mappings) {
			for (const mapping of schema.infrastructure.mappings) {
				this.mapping.load(mapping)
			}
		}
		if (schema.infrastructure.sources) {
			for (const source of schema.infrastructure.sources) {
				if (this.helper.val.isEmpty(source.connection)) {
					this.helper.logger.log(`WARNING|source:"${source.name}"|connection is empty`)
					continue
				}
				if (typeof source.connection === 'string') {
					if (source.connection.includes('${')) {
						this.helper.logger.log(`WARNING|source:"${source.name}"|had environment variables unsolved`)
					} else {
						const connection = this.helper.utils.tryParse(source.connection)
						if (connection) {
							source.connection = connection
						} else {
							throw new SchemaError(`Connection "${source.connection}" not serializable`)
						}
					}
				} else if (typeof source.connection !== 'object') {
					throw new SchemaError(`The source "${source.name}" connection to is not defined as an object`)
				}
				this.source.load(source)
			}
		}
		if (schema.infrastructure.stages) {
			for (const stage of schema.infrastructure.stages) {
				this.stage.load(stage)
			}
		}
		return schema
	}
}
