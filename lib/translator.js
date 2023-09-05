import { toString } from 'uint8arrays/to-string'
import { join } from 'node:path'

const default_model = 'gpt-4' // TODO: replace below

const map_prompt = async (chinese, english, openai, cache, model='gpt-3.5-turbo') => {
	const prompt = `Return a map in JSON format of each chinese character to english world, preserving binomials, from the translation below.

Chinese: ${chinese}

English: ${english}
`

  // check cache
	if (cache.logs.has(prompt)) return cache.logs.get(prompt)
  
  const completion = await openai.chat.completions.create({
    model,
		temperature: 0,
    messages: [
      { role: 'user', content: prompt }
    ]
  })
  const { choices: [ default_choice ] } = completion
  const { message: { role, content } } = default_choice

	if (content[0] !== '{') throw new Error('Not JSON')
	const map = JSON.parse(content)
	cache.log_prompt(prompt, map)
	return map
}

const translation_map = async (chinese, english, openai, cache) => {
  const map = await map_prompt(chinese, english, openai, cache)
	for (const [ ch, en ] of Object.entries(map)) {
		if (!ch.length || !en.length) {
			delete map[ch]
		}
		if (!english.includes(en)) {
			delete map[ch]
		}
		if (!chinese.includes(ch)) {
			delete map[ch]
		}
	}
	return map
}

const { entries } = Object

const map_pairs = async (pairs, openai, cache) => {
	const maps = await Promise.all(pairs.map(([ chinese, english ]) => translation_map(chinese, english, openai, cache)))
	const result = {}
	for (const map of trans_maps) {
		for (const [chinese, english ] of entries(map)) {
			if (!result[chinese]) result[chinese] = {}
			if (!result[chinese][english]) result[chinese][english] = 0
			result[chinese][english]++
		}
	}
	return result
}

const translate = () => {} // TODO

export { map_pairs, translate }

