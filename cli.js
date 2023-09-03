import { readFileSync as read, 
         readdirSync as dir,
				 statSync as stat,
				 writeFileSync as writeFile,
				 appendFileSync as append
				 } from 'node:fs'
import { parse, encode } from './lib/text-format.js'
import { map_pair, translate } from './lib/translator.js'
import { globSync as glob } from 'glob'
import OpenAI from 'openai'
import arg from 'arg'

const args = arg({
	// Types
	'--help': Boolean,
	'--version': Boolean,
})

const help = () => {
	console.log('sutra <cmd>')
	console.log('sutra translate [input] [cbeta]')
	console.log('sutra translate mcowens/*.trans.txt T2008') 
}

const [ cmd, ...pos ] = args._
if (!cmd || args['--help']) {
	help()
}

const exists = f => {
	let s
	try {
		s = stat(f)
	} catch (e) {
		return false
	}
	return s
}

const config = {
  apiKey: process.env.OPENAI_API_KEY,
}
let openai = new OpenAI(config)

const _filter = f => f.length > 2
const logs = new Map(
  toString(read('prompt.log')).split('\r\n').filter(_filter).map(str => JSON.parse(str))
)

