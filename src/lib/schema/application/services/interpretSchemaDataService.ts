import { SchemaData, SchemaEntityData } from '../../domain'
import { ObjType, Type } from 'typ3s'
import { H3lp } from 'h3lp'
import { SchemaService } from './schemaService'
const { v4: uuidv4 } = require('uuid')

export class InterpretSchemaDataService {
	// eslint-disable-next-line no-useless-constructor
	constructor (private readonly schemaService:SchemaService, private readonly helper: H3lp) {}

	public completeSchemaData (source:any, name:string, type: Type, schemaData: SchemaData):void {
		const entityName = this.schemaService.getEntityName(name)
		if (Type.isList(type) && type.list && Type.isObj(type.list.items) && type.list.items.obj) {
			const children = this.objectsToRows(schemaData, type.list.items.obj, source, entityName, this.getPkName(type.list.items.obj))
			this.addRows(schemaData, entityName, children)
		} else if (Type.isObj(type) && type.obj) {
			const pkName = this.getPkName(type.obj)
			if (pkName === '_id') {
				source[pkName] = uuidv4()
			}
			this.objectToRow(schemaData, type.obj, source, entityName, pkName)
		}
	}

	private objectsToRows (schemaData: SchemaData, objType:ObjType, source:any[], entityName:string, pkName:string, excludeRepeated = true): any[] {
		const rows:any[] = []
		if (excludeRepeated) {
			const schemaEntityData = this.getSchemaEntityData(schemaData, entityName)
			for (const item of source) {
				if (pkName === '_id') {
					item[pkName] = uuidv4()
				} else if (schemaEntityData.rows.some(p => p[pkName] === item[pkName])) {
				// En el caso de que el id ya exista, no se añade la fila
					continue
				}
				const row = this.objectToRow(schemaData, objType, item, entityName, pkName)
				rows.push(row)
			}
		} else {
			for (const item of source) {
				if (pkName === '_id') {
					item[pkName] = uuidv4()
				}
				const row = this.objectToRow(schemaData, objType, item, entityName, pkName)
				rows.push(row)
			}
		}

		return rows
	}

	private objectToRow (schemaData: SchemaData, objType:ObjType, source:any, entityName:string, pkName:string): any {
		const row = {}
		for (const prop of objType.properties) {
			const value = source[prop.name]
			if (value === undefined) {
				continue
			}
			if (prop.type && Type.isPrimitive(prop.type)) {
				row[prop.name] = value
			} else if (prop.type && Type.isObj(prop.type) && prop.type.obj) {
				const fk = this.schemaService.getFk(prop.type.obj)
				if (fk && fk.type) {
					const propertyName = prop.name + this.helper.str.capitalize(fk.name)
					const relatedEntityName = this.schemaService.getEntityName(prop.name)
					const relatedPkName = this.getPkName(prop.type.obj)
					if (prop.type && prop.type.repeated !== undefined && prop.type.repeated === 0) {
						const childRow = this.objectToRow(schemaData, prop.type.obj, value, relatedEntityName, relatedPkName)
						row[prop.name] = childRow
					} else {
						const schemaEntityData = this.getSchemaEntityData(schemaData, relatedEntityName)
						if (relatedPkName === '_id') {
							row[relatedPkName] = uuidv4()
						} else if (schemaEntityData.rows.some(p => p[pkName] === value[relatedPkName])) {
							// En el caso de que el id ya exista, no se añade la fila
							continue
						}
						const childRow = this.objectToRow(schemaData, prop.type.obj, value, relatedEntityName, relatedPkName)
						const fkValue = value[fk.name]
						if (fkValue !== undefined) {
							row[propertyName] = fkValue
						}
						schemaEntityData.rows.push(childRow)
					}
				}
			} else if (prop.type && Type.isList(prop.type) && prop.type.list?.items.obj) {
				const relatedEntityName = this.schemaService.getEntityName(prop.name)
				const relatedPkName = this.getPkName(prop.type.list.items.obj)
				if (prop.type && prop.type.repeatRate && prop.type.repeatRate > 0.02) {
					const rpk = this.schemaService.getFk(prop.type.list?.items.obj)
					if (rpk && rpk.type) {
						// hay que crear una tabla intermediaria con el id de la entidad y el id de la entidad relacionada
						const parentPropertyName = this.helper.str.notation(entityName, 'camel') + this.helper.str.capitalize(pkName)
						const childPropertyName = this.helper.str.singular(this.helper.str.notation(relatedEntityName, 'camel')) + this.helper.str.capitalize(rpk.name)
						const intermediaEntityName = entityName + this.helper.str.capitalize(prop.name)
						const parentValue = source[pkName]
						const intermediateObjects: any[] = []
						for (const item of value) {
							const obj: any = {}
							obj[childPropertyName] = item[rpk.name]
							obj[parentPropertyName] = parentValue
							intermediateObjects.push(obj)
						}
						this.addRows(schemaData, intermediaEntityName, intermediateObjects)
						const children = this.objectsToRows(schemaData, prop.type.list.items.obj, value, relatedEntityName, relatedPkName)
						this.addRows(schemaData, relatedEntityName, children)
					}
				} else if (prop.type && prop.type.repeated !== undefined && prop.type.repeated === 0) {
					const children = this.objectsToRows(schemaData, prop.type.list.items.obj, value, relatedEntityName, relatedPkName, false)
					row[prop.name] = children
				} else {
					const children = this.objectsToRows(schemaData, prop.type.list.items.obj, value, relatedEntityName, relatedPkName)
					const propertyName = this.helper.str.notation(this.helper.str.singular(entityName), 'camel') + this.helper.str.capitalize(pkName)
					for (const child of children) {
						child[propertyName] = source[pkName]
					}
					this.addRows(schemaData, relatedEntityName, children)
				}
			}
		}
		return row
	}

	private getSchemaEntityData (schemaData: SchemaData, entityName: string): SchemaEntityData {
		let schemaEntityData = schemaData.entities.find(p => p.entity === entityName)
		if (!schemaEntityData) {
			schemaEntityData = { entity: entityName, rows: [] }
			schemaData.entities.push(schemaEntityData)
		}
		return schemaEntityData
	}

	private getPkName (objType: ObjType): string {
		const pk = this.schemaService.getPk(objType)
		return pk ? pk.name : '_id'
	}

	private addRows (schemaData: SchemaData, entityName: string, rows: any[]) {
		const schemaEntityData = this.getSchemaEntityData(schemaData, entityName)
		schemaEntityData.rows.push(...rows)
	}
}
