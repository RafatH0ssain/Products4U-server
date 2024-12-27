require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.oyqb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    tls: true,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("Products4U");
const productsCollection = db.collection("ProductsDB");

async function connectToDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        // You can now interact with the "ProductsBD" collection
        const productCount = await productsCollection.countDocuments();
        console.log(`Number of products in the collection: ${productCount}`);
        console.log("Connected to database:", db.databaseName);
        console.log("Connected to collection:", productsCollection.collectionName);

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    } finally {
        // await client.close(); // Close the connection when done
    }
}

app.listen(port, () => {
    console.log(`Sports server is running on PORT: ${port}`)
})

app.get('/queries', (req, res) => {
    productsCollection.find().toArray()
        .then(result => res.send(result))
        .catch(error => {
            console.error("Error fetching equipment:", error);
            res.status(500).json({ error: "Internal Server Error" });
        });
});

connectToDB();