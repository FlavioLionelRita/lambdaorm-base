import { Dialect, InitializeSchemaArgs, Mapping, Schema, Source } from '../../domain'
import { SchemaService } from '../services/schemaService'

export class InitializeSchema {
	// eslint-disable-next-line no-useless-constructor
	constructor (
		private readonly schemaService:SchemaService
	) {}

	public initialize (schema: Schema, args: InitializeSchemaArgs): Schema {
		let source:Source|undefined
		let mapping:Mapping|undefined
		if (schema.infrastructure === undefined) {
			mapping = { name: 'default', entities: [] }
			source = { name: 'default', dialect: args.dialect || Dialect.MySQL, mapping: mapping.name, connection: args.connection }
			schema.infrastructure = { sources: [source], mappings: [{ name: 'default', entities: [] }], stages: [] }
		} else {
			if (!schema.infrastructure.mappings || schema.infrastructure.mappings.length === 0) {
				mapping = { name: 'default', entities: [] }
				schema.infrastructure.mappings = [mapping]
			} else {
				mapping = schema.infrastructure.mappings[0]
			}
			if (!schema.infrastructure.sources) {
				source = { name: 'default', dialect: args.dialect || Dialect.MySQL, mapping: schema.infrastructure.mappings[0].name, connection: args.connection }
				schema.infrastructure.sources = []
			}
			if (args.source && schema.infrastructure.sources && schema.infrastructure.sources.length > 1) {
				source = schema.infrastructure?.sources.find(p => p.name === args.source)
				if (source === undefined) {
					throw Error(`source ${args.source} not found`)
				}
			} else if (schema.infrastructure?.sources.length === 1) {
				source = schema.infrastructure.sources[0]
			}
		}
		// if the mapping does not exist it creates it
		if (source && mapping && schema.infrastructure.mappings) {
			if (source.mapping === undefined) {
				if (schema.infrastructure && schema.infrastructure.mappings.length > 0) {
					source.mapping = schema.infrastructure.mappings[0].name
				} else {
					source.mapping = mapping.name
				}
			}
		}
		// update the connection if applicable
		if (source) {
			if (args.connection) {
				source.connection = args.connection
			} else if (!source.connection) {
				source.connection = this.defaultConnection(source.dialect)
			}
		}

		// if the stage does not exist, create it
		if (schema.infrastructure.stages === undefined) {
			schema.infrastructure.stages = []
		}
		if (source && schema.infrastructure.stages.length === 0) {
			schema.infrastructure.stages.push({ name: 'default', sources: [{ name: source.name }] })
		}
		return schema
	}

	private defaultConnection (dialect: string): any {
		switch (dialect) {
		case Dialect.MySQL:
			return {
				host: 'localhost',
				port: 3306,
				user: 'test',
				password: 'test',
				database: 'test',
				multipleStatements: true,
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0
			}
		case Dialect.MariaDB:
			return {
				host: 'localhost',
				port: 3306,
				user: 'test',
				password: 'test',
				database: 'test',
				multipleStatements: true,
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0
			}
		case Dialect.SQLjs:
			return { database: 'default' }
		case Dialect.PostgreSQL:
			return {
				host: 'localhost',
				port: 5432,
				username: 'test',
				password: 'test',
				database: 'test'
			}
		case Dialect.SqlServer:
			return {
				server: 'localhost',
				authentication: { type: 'default', options: { userName: 'sa', password: 'Admin12345' } },
				options: { encrypt: false, database: 'tempDb' }
			}
		case Dialect.Oracle:
			return {
				host: 'localhost',
				username: 'system',
				password: 'oracle',
				port: 1521,
				sid: 'xe.oracle.docker'
			}
		case Dialect.MongoDB:
			return {
				url: 'mongodb://@localhost:27017',
				database: 'test'
			}
		default:
			throw new Error(`dialect: ${dialect} not supported`)
		}
	}
}
