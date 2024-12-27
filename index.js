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

const db = client.db("Products4U");  // Database name
const productsCollection = db.collection("ProductsDB");  // Collection name
const recommendationCollection = db.collection("RecommendationsDB"); 

// Connect to the database
const connectToDB = async () => {
    try {
        // await client.connect();
        console.log("Connected to MongoDB!");

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

// POST route to save recommendations
app.post('/recommendation', async (req, res) => {
    const {
        title,
        productName,
        productImage,
        reason,
        queryId,
        queryTitle,
        userEmail,
        userName,
        recommenderEmail,
        recommenderName,
        timestamp
    } = req.body;

    try {
        const recommendation = {
            title,
            productName,
            productImage,
            reason,
            queryId,
            queryTitle,
            userEmail,
            userName,
            recommenderEmail,
            recommenderName,
            timestamp
        };

        const result = await recommendationCollection.insertOne(recommendation);

        if (result.insertedId) {
            // Successfully inserted the recommendation
            res.status(201).json({ message: 'Recommendation added successfully!' });
        } else {
            res.status(400).json({ error: 'Failed to add recommendation' });
        }
    } catch (error) {
        console.error('Error adding recommendation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH route to update the recommendation count of the query
app.patch('/update-query/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { recommendationCount: 1 } } // Increment recommendation count
        );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Recommendation count updated successfully!' });
        } else {
            res.status(404).json({ error: 'Query not found' });
        }
    } catch (error) {
        console.error('Error updating recommendation count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to fetch recommendations by logged-in user's email
app.get('/recommendations', async (req, res) => {
    const userEmail = req.query.userEmail;  // Getting the email from the query parameter

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
    }

    try {
        const recommendations = await recommendationCollection.find({ recommenderEmail: userEmail }).toArray();
        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST route to add a new query
app.post('/queries', async (req, res) => {
    const { productName, productBrand, productImageURL, queryTitle, boycottingReasonDetails, userEmail } = req.body;

    if (!productName || !productBrand || !productImageURL || !queryTitle || !boycottingReasonDetails) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const query = {
            productName,
            productBrand,
            productImageURL,
            queryTitle,
            boycottingReasonDetails,
            userEmail,
            createdAt: new Date()
        };

        const result = await productsCollection.insertOne(query);
        res.status(201).json({ message: "Query added successfully", queryId: result.insertedId });
    } catch (error) {
        console.error("Error adding query:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET route to fetch queries by user email
app.get('/queries/byUserEmail', async (req, res) => {
    const { userEmail } = req.query;

    try {
        const queries = await productsCollection.find({ userEmail }).toArray();
        res.status(200).json(queries);
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET route to fetch the latest 3 queries
app.get('/queries/latest', async (req, res) => {
    const { limit, sort } = req.query;
    
    try {
        const queryLimit = limit ? parseInt(limit) : 3; // Default to 3 queries
        const querySort = sort === 'desc' ? -1 : 1; // Sort descending by default

        const queries = await productsCollection
            .find({})
            .sort({ timestamp: querySort })  // Sort by timestamp field
            .limit(queryLimit)               // Limit to the latest 3 queries
            .toArray();

        res.status(200).json(queries);
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE route to remove a specific query by its ID
app.delete('/query/:queryId', async (req, res) => {
    const { queryId } = req.params;

    if (!queryId) {
        return res.status(400).json({ error: "Query ID is required." });
    }

    try {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(queryId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Query not found." });
        }

        res.status(200).json({ message: "Query deleted successfully" });
    } catch (error) {
        console.error("Error deleting query:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Start the connection and server
connectToDB();