require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.oyqb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client Setup
const client = new MongoClient(uri, {
    tls: true,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connect to the database
const connectToDB = async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("Products4U");  // Database name
        const productsCollection = db.collection("ProductsDB");  // Collection name

        // Test the connection and fetch count
        const productCount = await productsCollection.countDocuments();
        console.log(`Number of products in the collection: ${productCount}`);

        // You can now start listening to requests
        app.listen(port, () => {
            console.log(`Server running on PORT: ${port}`);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);  // Exit the app if DB connection fails
    }
};

// GET route to fetch products/queries
app.get('/queries', async (req, res) => {
    const db = client.db("Products4U");
    const productsCollection = db.collection("ProductsDB");

    try {
        const queries = await productsCollection.find({}).toArray(); // Get all products
        res.status(200).json(queries);
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/query/:id', (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    productsCollection.findOne({ _id: new ObjectId(id) })
        .then(result => {
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'No record found with that ID' });
            }
        })
        .catch(error => {
            console.error('Error fetching equipment:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Start the connection and server
connectToDB();