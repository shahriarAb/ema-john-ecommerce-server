const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5500;
var admin = require("firebase-admin");

//firebase admin initialization


var serviceAccount = require('./ena-john-simple-ecommerce-firebase-adminsdk-2e8a9-11a597f817.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cjcg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split(' ')[1];
        console.log('inside separate function', idToken);
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('ema_john_shop');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        //GET products api
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            let products;
            const count = await cursor.count();
            const page = req.query.page;
            const size = parseInt(req.query.size);

            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send({
                count,
                products
            });
        });

        //use POST to get data by keys
        app.post('/products/byKeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } }
            const products = await productCollection.find(query).toArray();
            res.json(products);
        });

        //add/POST orders api
        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order);
            res.json(result);
        });

        //GET orders api for specific email
        app.get('/orders', verifyToken, async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email };
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

//default site
app.get('/', (req, res) => {
    res.send('Ema John is running!!');
});

//listening the post everytime after save
app.listen(port, () => {
    console.log('Server is running at port:', port);
})