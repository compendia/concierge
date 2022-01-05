require('dotenv').config()

const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const NetworkIdentity = require('@nosplatform/orbitdb-nos-identity-provider').default;
const auth = require('./helpers/auth.js');
const schemaHelper = require("./helpers/schema");
const cors = require('cors')
const wrtc = require('wrtc');
const WebRTCStar = require('libp2p-webrtc-star');
const express = require('express');
const bodyParser = require('body-parser');
const Websockets = require("libp2p-websockets");


const app = express()
app.use(cors());
app.use(bodyParser.json({ extended: true }));

const schemaKey = process.env.SCHEMA;

const initIPFSInstance = async () => {
  return await IPFS.create({
    repo: './.ipfs',
    relay: { enabled: true, hop: { enabled: true, active: true } },
    EXPERIMENTAL: { pubsub: true },
    config: {
      Addresses: {
        Swarm: [
          "/dns4/hidden-sierra-49375.herokuapp.com/tcp/443/wss/p2p-webrtc-star/",
          `/ip4/0.0.0.0/tcp/${process.env.IPFS_TCP_PORT}`,
          `/ip4/0.0.0.0/tcp/${process.env.IPFS_WS_PORT}/ws`
        ]
      }
    },
    libp2p: {
      modules: {
        transport: [WebRTCStar, Websockets]
      },
      config: {
        peerDiscovery: {
          webRTCStar: { // <- note the lower-case w - see https://github.com/libp2p/js-libp2p/issues/576
            enabled: true
          }
        },
        transport: {
          WebRTCStar: { // <- note the upper-case w- see https://github.com/libp2p/js-libp2p/issues/576
            wrtc
          }
        }
      }
    }
  });
};

initIPFSInstance().then(async ipfs => {
  // Get schema
  const schema = await schemaHelper.resolveSchema(schemaKey);
  const validate = schemaHelper.ajvSchema(schema);
  const primaryKey = schemaHelper.getPrimaryKey(schema);
  // Set up OrbitDB Identity Provider
  const passphrase = process.env.PASSPHRASE;
  OrbitDB.Identities.addIdentityProvider(NetworkIdentity);
  const identity = await OrbitDB.Identities.createIdentity({ type: `CoreIdentityType`, passphrase })
  const orbitdb = await OrbitDB.createInstance(ipfs, { identity });

  // Create / Open a database
  const options = {
    indexBy: primaryKey
  }

  const db = await orbitdb.docs(process.env.SCHEMA, options);
  await db.load();
  console.log("Database address: " + db.address);

  app.use('/', auth);

  app.post('/', async function (req, res) {
    try {
      const valid = validate(req.body);
      if (valid) {
        const primaryVal = req.body[primaryKey];
        const entry = db.get(primaryVal);
        // Replace previous
        if (entry && Object.values(entry).length) {
          await db.del(primaryVal);
        }
        const hash = await db.put(req.body);
        if (hash) {
          res.json({ hash });
        } else {
          res.status(422).json({
            error: {
              message: 'Data could not be added to database.'
            }
          });
        }
      } else {
        res.status(422).json({
          error: {
            message: 'data does not pass schema validation.',
            data: req.body
          }
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: {
          message: error.message,
          data: req.body
        }
      });
    }

  })


  app.get('/', async function (req, res) {
    try {
      if (req.query.id && String(req.query.id).length > 1) {
        const entry = await db.get(req.query.id);
        if (entry && entry.length) {
          res.json(entry[0]);
        } else {
          res.status(404).json({
            error: {
              message: 'Entry not found.'
            }
          });
        }
      } else {
        res.status(404).json({
          error: {
            message: 'Entry not found.'
          }
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: {
          message: error.message,
          data: req.body
        }
      });
    }

  })
  app.delete('/', async function (req, res) {
    try {
      if (Object.values(req.body).length === 1 && req.body.id) {
        const hash = await db.del(req.body.id);
        if (hash) {
          res.status(200).json({ hash });
        } else {
          res.status(422).json({
            error: {
              message: 'Data could not be added to database.'
            }
          });
        }
      } else {
        res.status(422).json({
          error: {
            message: 'Data does not pass schema validation.',
            data: req.body
          }
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: {
          message: error.message,
          data: req.body
        }
      });
    }

  })

  app.listen(process.env.PORT);

});

