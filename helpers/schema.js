const Ajv = require("ajv");
const got = require("got");
const gateway = process.env.IPFS_GATEWAY;
const relayApi = process.env.RELAY_API;

const resolveSchema = async id => {
  const schemaRes = await got(`${relayApi}/schemas/${id}`);
  if (schemaRes.statusCode === 404) {
    throw new Error(`Schema ${schema} not found on network. Make sure it's registered.`)
  } else if (schemaRes.statusCode !== 200) {
    throw new Error(`Cannot connect to relay. Make sure it's online and that the URL is correct.`)
  } else {
    const meta = JSON.parse((await got(`${relayApi}/schemas/${id}`)).body);
    const schemaCid = meta.data.ipfs;
    const schema = JSON.parse((await got(`${gateway}/${schemaCid}?filename=${meta.data.id}.json`)).body);
    return schema;
  }

}

const ajvSchema = schema => {
  try {
    const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(schema)
    return validate;
  } catch (error) {
    throw new Error(error);
  }
}

// Makes arrays out of items that are of type "array" according to the schema
// Excludes escaped commas from being split
const processArrays = (items, schema) => {
  let i = 0;
  items = JSON.parse(JSON.stringify(items));
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (schema.properties[key] && schema.properties[key].type === "array") {
        // Splits by un-escaped commas
        item[key] = String(item[key]).replace(/([^\\]),/g, '$1\u000B').split('\u000B');

        // Replaces escaped commas with regular commas after split
        o = 0;
        for (const arrayItem of item[key]) {
          item[key][o] = String(arrayItem).replace('\\,', ",")
          o++;
        }
      }
    }
    i++;
  }
  return items;
}

const getPrimaryKey = (schema) => {
  try {
    console.log(schema);
    return schema.properties._primaryKey.default;
  } catch (error) {
    throw new Error("_primaryKey not found in schema")
  }
}

module.exports = { resolveSchema, ajvSchema, processArrays, getPrimaryKey }