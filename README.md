<p align="center">
<img src="https://i.imgur.com/1uDh3OD.png" width="250px">
</p>

Concierge is an API to manage your Compendia Layer 2 Database. It acts as an [OrbitDB](https://github.com/orbitdb/orbit-db) node and CRUD API.

When you first run Concierge after configuring your env file, you'll get the multihash address (i.e. `/orbitdb/foo/bar`) that you can register in Compendia from the Tools section in the [testnet web wallet](https://wallet.nos.dev).

[Click here](https://docs.compendia.org/guide/databases.html) for a full guide on Compendia Databases.

## API

All API requests require the configured API secret (as set in the `.env` file) in its URL query (e.g. `http://localhost?secret=my_api_secret`).

The following HTTP requests can be made to the API:

* **GET**: Return an entry by ID. Requires `id` in url query.
* **POST**: Create a new entry (entry must be stringified JSON object & pass the database's schema validation).
* **DELETE**: Deletes an entry by ID. Requires `id` in url query.

## Installation

1. Register a database in your [Compendia Wallet](https://wallet.compendia.org) (Tools tab).

2. Git clone this repository into your relay node and open it:

```bash
git clone https://github.com/compendia/concierge.git && cd concierge
```

3. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

4. Edit your `.env` file. Set up the port, the database schema, and your validator passphrase:

```bash
nano .env
```

5. Install dependencies:

```bash
npm install
```

6. Start the server with pm2 so it stays online consistently (change name to something recognizable):

```bash
pm2 start index.js --name concierge
```

If you want to set up a Concierge API for another database on the same server, simply clone the repository into a new directory and make sure to use a different port and pm2 process name.
