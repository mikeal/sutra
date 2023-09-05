import { readFileSync as read, 
         readdirSync as dir,
				 mkdirSync as mkdir,
				 statSync as stat,
				 writeFileSync as writeFile,
				 appendFileSync as append
				 } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { toString } from 'uint8arrays'
import { parse, encode } from './lib/text-format.js'
import { map_pairs, translate } from './lib/translator.js'
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

const touch = filename => writeFile(filename, new Uint8Array())

const cache = {}
cache.dir = join(homedir(), '.sutra')
if (!exists(cache.dir)) mkdir(cache.dir)

cache.prompt_log = join(cache.dir, 'prompt.log')
if (!exists(cache.prompt_log)) touch(cache.prompt_log)

const _filter = f => f.length > 2
cache.logs = new Map(
  toString(read(cache.prompt_log)).split('\r\n').filter(_filter).map(str => JSON.parse(str))
)

cache.log_prompt = (prompt, result) => {
	append(cache.prompt_log, JSON.stringify([ prompt, result ]) + '\r\n')
	cache.logs.set(prompt, result)
}

const config = {
  apiKey: process.env.OPENAI_API_KEY,
}
let openai = new OpenAI(config)

if (cmd === 'translate' || cmd === 'count_map') {
	console.log({cmd, pos})
	if (pos.length < 2) {
		throw new Error('Not enough arguments')
	}
	const cbeta_id = pos.pop()
	const _read = f => parse(toString(read(f)))
	const pairs = pos.flatMap(_read)
	const counts = await map_pairs(pairs, openai, cache)
	console.log(counts)
} else {
	throw new Error(`Unknown command "${ cmd }"`)
}

