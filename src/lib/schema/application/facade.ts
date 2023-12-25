import { ClauseInfo, SourceRule, Schema, SchemaError } from '../domain'
import { DataSourceConfigService } from './services/config/dataSourceConfigService'
import { MappingsConfigService } from './services/config/mappingsConfigService'
import { DomainConfigService } from './services/config/domainConfigService'
import { StageConfigService } from './services/config/stageConfigService'
import { ViewsConfigService } from './services/config/viewsConfigService'
import { RouteService } from './services/routeService'
import { SchemaExtender } from './services/schemaExtender'
import { SchemaCreateService } from './services/createService'
import { CompleteSchema } from './useCases/complete'
import { GetSchema } from './useCases/get'
import { LoadSchema } from './useCases/load'
import { CreateSchema } from './useCases/create'

export class SchemaFacade {
	public schema: Schema
	constructor (
		public readonly source:DataSourceConfigService,
		public readonly domain:DomainConfigService,
		public readonly mapping:MappingsConfigService,
		public readonly stage:StageConfigService,
		public readonly view:ViewsConfigService,
		private readonly schemaService:SchemaCreateService,
		private readonly routeService:RouteService,
		private readonly extender:SchemaExtender,
		private readonly createSchema: CreateSchema,
		private readonly loadSchema: LoadSchema,
		private readonly getSchema: GetSchema,
		private readonly completeSchema:CompleteSchema
	) {
		this.schema = this.schemaService.newSchema()
	}

	public evalSourceRule (rule:SourceRule, clauseInfo: ClauseInfo):boolean {
		return this.routeService.eval(rule, clauseInfo)
	}

	public getSource (clauseInfo: ClauseInfo, stage?: string):string {
		return this.routeService.getSource(clauseInfo, stage)
	}

	public async create (): Promise<Schema> {
		return this.createSchema.create()
	}

	public async get (source: string): Promise<Schema|null> {
		return this.getSchema.get(source)
	}

	public async initialize (source: string | Schema): Promise<Schema> {
		const schema = await this.getSchema.get(source)
		if (schema === null) {
			throw new SchemaError(`Schema: ${source} not supported`)
		}
		this.completeSchema.complete(schema)
		this.schema = this.loadSchema.load(schema)
		return this.schema
	}

	public complete (schema: Schema): void {
		this.extender.complete(schema)
	}
}
