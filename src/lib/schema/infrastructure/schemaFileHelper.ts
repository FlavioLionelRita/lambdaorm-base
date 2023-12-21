import path from 'path'
import { H3lp } from 'h3lp'

export class SchemaFileHelper {
	// eslint-disable-next-line no-useless-constructor
	constructor (private readonly helper:H3lp) {}

	public async getConfigPath (source?: string):Promise<string|undefined> {
		let workspace: string
		let configFile: string | undefined
		workspace = process.cwd()

		if (source === undefined) {
			configFile = await this.getConfigFileName(workspace)
		} else if (typeof source === 'string') {
			if (source.startsWith('http')) {
				return source
			} else if (await this.helper.fs.exists(source)) {
				const lstat = await this.helper.fs.lstat(source)
				if (lstat.isFile()) {
					configFile = path.basename(source)
					workspace = path.dirname(source)
				} else {
					workspace = source
					configFile = await this.getConfigFileName(workspace)
				}
			} else {
				console.log(`Not exists path ${source}`)
			}
		} else {
			console.log('Schema: not supported:')
			console.log(source)
		}
		if (configFile) {
			return path.join(workspace, configFile)
		} else {
			return undefined
		}
	}

	public async getConfigFileName (workspace: string): Promise<string | undefined> {
		if (await this.helper.fs.exists(path.join(workspace, 'lambdaORM.yaml'))) {
			return 'lambdaORM.yaml'
		} else if (await this.helper.fs.exists(path.join(workspace, 'lambdaORM.yml'))) {
			return 'lambdaORM.yml'
		} else if (await this.helper.fs.exists(path.join(workspace, 'lambdaORM.json'))) {
			return 'lambdaORM.json'
		} else {
			return undefined
		}
	}
}
