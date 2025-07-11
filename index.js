const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;

// midleweare
app.use(cors());
app.use(express.json());


// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@data-house.3s1f0x8.mongodb.net/?retryWrites=true&w=majority&appName=Data-house`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const teachersCollection = client.db('teacherDB').collection('teachers')
 
    // post teacher application data
    app.post('/teacher-application', async (req, res) => {
  try {
    const application = req.body;
    const result = await teachersCollection.insertOne(application);

    res.status(201).send({
      message: 'Application submitted successfully!',
      insertedId: result.insertedId
    });
  } catch (error) {
    console.error('Error in apply-teacher:', error);
    res.status(500).send({ message: 'Server error. Please try again later.' });
  }
});




    // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// sample route
app.get('/', (req, res) => {
  res.send('edugenix website server')
})
app.listen(port, () => {
  console.log(`edugenix website server is running on port: ${port}`)
})