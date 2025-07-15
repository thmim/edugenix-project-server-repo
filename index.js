const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const addClassCollection = client.db('teacherDB').collection('addCllass')

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

    // get all added classes by teacher email
    app.get('/my-classes', async (req, res) => {
      const email = req.query.email;
      try {
        const result = await addClassCollection.find({ email }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch classes', error });
      }
    });

    // DELETE /classes/:id by teacher

    app.delete('/my-classes/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await addClassCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to delete class', error });
      }
    });

    // post add class data
    app.post('/add-class', async (req, res) => {
      try {
        const classData = req.body;
        const result = await addClassCollection.insertOne(classData);
        res.send(result);
      } catch (error) {
        console.error('Error adding class:', error);
        res.status(500).send({ error: 'Failed to add class' });
      }
    });

    // get all pending application
    app.get('/pending-teachers', async (req, res) => {
      try {
        const result = await teachersCollection
          .find({ status: 'pending' })
          .toArray();

        res.status(200).send(result);
      } catch (error) {
        console.error('Error fetching pending teachers:', error);
        res.status(500).send({ message: 'Server error. Please try again later.' });
      }
    });

    // update teachers status using patch using id
    app.patch('/teachers/status/:id', async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; // either "approved" or "rejected"

      const result = await teachersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: status } }
      );
      res.send(result);
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