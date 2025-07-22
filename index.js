const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_GATEWAY_KEY);
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
    const usersCollection = client.db('teacherDB').collection('users')
    const paymentsCollection = client.db('teacherDB').collection('payments')
    const assignmentsCollection = client.db('teacherDB').collection('assignments')
    const assignmentSubmissionsCollection = client.db('teacherDB').collection('submissions')
    const reviewsCollection = client.db('teacherDB').collection('reviews')


    // Search user by email or name (partial match)
    app.get('/users/search', async (req, res) => {
      const search = req.query.email;
      if (!search) {
        return res.status(400).send({ message: 'Search query is required' });
      }

      const users = await usersCollection.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          // { name: { $regex: search, $options: 'i' } }
        ]
      })
        .limit(10)
        .toArray();

      res.send(users);
    });

    // post user info
    app.post('/users', async (req, res) => {
      const email = req.body.email;
      const user = req.body;
      console.log(user)
      const existingUser = await usersCollection.findOne({ email });
      if (!existingUser) {
        // Create new user
        await usersCollection.insertOne(user);
      }
      res.send({ message: "User Already Exsist" });
    });

    // Make user admin
    app.patch('/users/:id/make-admin', async (req, res) => {
      const { id } = req.params;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: 'admin' } }
      );
      res.send(result);
    });

    // Remove admin role
    app.patch('/users/:id/remove-admin', async (req, res) => {
      const { id } = req.params;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: 'student' } }
      );
      res.send(result);
    });

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

    // get all added class
    app.get('/classes', async (req, res) => {
      const result = await addClassCollection.find().toArray();
      res.send(result);
    })

    // get classes using specific id for class details page
    app.get('/classes/:id', async (req, res) => {
      const { id } = req.params;
      const classData = await addClassCollection.findOne({ _id: new ObjectId(id) });
      res.send(classData);
    });

    // get all approved classes
    app.get('/approvedclasses', async (req, res) => {
      try {

        const result = await addClassCollection
          .find({ status: 'approved' }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Server error while fetching classes' });
      }
    });

    // get add class by id
    app.get('/my-classes/:id', async (req, res) => {
      const id = req.params.id;
      const classData = await addClassCollection.findOne({ _id: new ObjectId(id) });
      res.send(classData);
    });

    // update add class info by teacher
    app.patch('/classes/:id', async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      try {
        const result = await addClassCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to update class', error });
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

    // Count enrollments
    // app.get('/enrollments/count/:id', async (req, res) => {

    //   const count = await addClassCollection.countDocuments({ classId: req.params.id });
    //   res.send({ count });
    // });

    // for (const payment of enrolledClasses) {
    //       const courseDetails = await addClassCollection.findOne({ _id: new ObjectId(payment.courseId) });
    //       if (courseDetails) {
    //         enrolledClassesDetails.push({
    //           ...payment,
    //           courseTitle: courseDetails.title,
    //           instructorName: courseDetails.name,
    //           courseImage: courseDetails.image,
    //         });
    //       }
    //     }
    //     app.get('/classes/assignment/:classId', async (req, res) => {
    //   try {
    //     const classId = req.params.classId;
    //     const classObjectId = new ObjectId(classId); 

    //     const classDetails = await addClassCollection
    //     .findOne({ _id: classObjectId })
    //     .toArray()
    //     ;
    //     const classesProgressDetails = [];
    //     for(const progressData of classDetails){
    //       const submissionCount = await assignmentSubmissionsCollection.findOne({ classObjectId: new ObjectId(classId) });
    //     if (submissionCount) {
    //             classesProgressDetails.push({
    //               ...progressData,
    //               submission_count:submissionCount.submission_count
    //             });

    //     }

    //     }


    //     // if (!classDetails) {
    //     //   return res.status(404).send({ message: 'Class not found' });
    //     // }


    //     // const totalSubmissionCount = await assignmentSubmissionsCollection.countDocuments({ courseId: classId });


    //     // const responseData = {
    //     //   ...classDetails,
    //     //   submission_count: totalSubmissionCount,
    //     // };

    //     res.send(responseData);
    //   } catch (error) {
    //     console.error('Error fetching class details:', error);
    //     res.status(500).send({ error: 'Failed to fetch class details' });
    //   }
    // });

    app.get('/classes/assignment/:classId', async (req, res) => {
      try {
        const classId = req.params.classId;
        const classObjectId = new ObjectId(classId);
        const classDetails = await addClassCollection.findOne({ _id: classObjectId });
        if (!classDetails) {
          return res.status(404).send({ message: 'Class not found' });
        }

        const enrollmentCount = classDetails.enrollmentCount || 0;
        const assignmentCount = classDetails.assignment_count || 0;

        const assignmentsInClass = await assignmentsCollection.find({ classId: new ObjectId(classId) }).toArray();
        console.log(assignmentsInClass);
        let totalSubmissionCount = 0;
        assignmentsInClass.forEach(assignment => {
          totalSubmissionCount += assignment.submission_count || 0;
        });
        console.log(totalSubmissionCount);
        const responseData = {

          enrollmentCount: enrollmentCount,
          assignmentCount: assignmentCount,
          totalSubmissionCount: totalSubmissionCount,
        };

        res.send(responseData);
      } catch (error) {
        console.error('Error fetching class details:', error);
        res.status(500).send({ error: 'Failed to fetch class details' });
      }
    });


    // GET all assignments by class ID
    app.get('/assignments/:courseId', async (req, res) => {
      const classId = req.params.courseId
      const assignments = await assignmentsCollection.find({ classId: new ObjectId(classId) }).toArray();
      res.send(assignments);
    });

    // post assignment data
    app.post('/assignments', async (req, res) => {
      const { title, description, deadline, created_by, createdAt, submission_count, id } = req.body;
      const assignment = {
        title: title,
        description: description,
        deadline: deadline,
        createdAt: createdAt,
        submission_count: submission_count,
        classId: new ObjectId(id),
        created_by: created_by

      }
      const result = await assignmentsCollection.insertOne(assignment);
      // increase assignment count
      if (result.insertedId) {

        await addClassCollection.updateOne(
          { _id: new ObjectId(assignment.classId) },
          { $inc: { assignment_count: 1 } }
        );
      }
      res.send(result);
    });

    // POST a submission and update submission count
    app.post('/submissions', async (req, res) => {

      const submitData = req.body;
      const { submitBy, assignmentId } = req.body;
      const alreadySubmitted = await assignmentSubmissionsCollection.findOne({ submitBy, assignmentId });
      if (alreadySubmitted) {
        return res.status(409).send({ message: "Assignment already submitted" });
      }

      const result = await assignmentSubmissionsCollection.insertOne(submitData);

      if (result.insertedId) {
        await assignmentsCollection.updateOne(
          { _id: new ObjectId(submitData.assignmentId) },
          { $inc: { submission_count: 1 } }
        );
      }

      res.send(result);
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
      const { status, email } = req.body; // either "approved" or "rejected"
      const result = await teachersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: status } }
      );

      // update user role
      if (status === 'approved') {
        const userQuery = { email }
        const userUpdateDoc = {
          $set: {
            role: "teacher"
          }
        }
        const roleRes = await usersCollection.updateOne(userQuery, userUpdateDoc)
        console.log(roleRes.modifiedCount)
      }
      res.send(result);
    });

    // Get enrolled classes for a user
    app.get('/enrolled-classes/:email', async (req, res) => {
      try {
        const email = req.params.email;
        //get enrolled class Data to aggregate paymentsCollection and classCollection
        const enrolledClasses = await paymentsCollection.find({ email: email }).toArray();
        const enrolledClassesDetails = [];
        for (const payment of enrolledClasses) {
          const courseDetails = await addClassCollection.findOne({ _id: new ObjectId(payment.courseId) });
          if (courseDetails) {
            enrolledClassesDetails.push({
              ...payment,
              courseTitle: courseDetails.title,
              instructorName: courseDetails.name,
              courseImage: courseDetails.image,
            });
          }
        }
        res.send(enrolledClassesDetails);

      } catch (error) {
        console.error('Error fetching enrolled classes:', error);
        res.status(500).send({ error: 'Failed to fetch enrolled classes' });
      }
    });

    // Mark payment and store history
    app.post('/payments', async (req, res) => {
      const { courseId, transactionId, amount, email, paymentMethod } = req.body;

      try {

        // Insert payment history
        const paymentEntry = {
          courseId: new ObjectId(courseId),
          transactionId,
          amount,
          email,
          paid_at: new Date(),
          paid_at_string: new Date().toISOString(),
          paymentMethod
        };

        const paymentResult = await paymentsCollection.insertOne(paymentEntry);

        if (paymentResult.insertedId) {
          const updateResult = await addClassCollection.updateOne(
            { _id: new ObjectId(courseId) },
            { $inc: { enrollmentCount: 1 } }
          );

        }

        res.status(201).send({
          message: 'Payment recorded successfully',
          insertedId: paymentResult.insertedId,

        });
        // res.json({ success: true, message: 'Payment recorded successfully' });
      } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    });

    // payment intent API
    app.post('/create-payment-intent', async (req, res) => {
      const amountInCents = req.body.amountInCents
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents, // Amount in cents
          currency: 'usd',
          payment_method_types: ['card'],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(400).send({ error: error.message });
      }
    });

    // POST TER (Teacher Evaluation & Review)
    app.post('/teacherEvaluation', async (req, res) => {
      try {
        const {rating,description,courseId,createdAt,studentName,studentEmail} = req.body;

        const result = await reviewsCollection.insertOne({
          rating:rating,
          description:description,
          studentName:studentName,
          studentEmail:studentEmail,
          createdAt:createdAt,
          courseId:new ObjectId(courseId)
        });

        res.status(201).send({
          message: 'TER submitted successfully.',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error('Error posting TER:', error);
        res.status(500).send({ message: 'Failed to submit TER.' });
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